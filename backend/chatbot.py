"""
Asistente de la embarazada (HU15). Responde con Claude a partir de la
conversación que manda el portal.

Necesita la variable de entorno ANTHROPIC_API_KEY. Sin ella el asistente
responde que no está disponible, y el resto de la app sigue funcionando.
"""
import logging

import anthropic

log = logging.getLogger(__name__)

MODELO = "claude-opus-5-5"
# Respuestas de chat: cortas. Si se llegara al límite, se corta la respuesta.
MAX_TOKENS = 2048
MAX_MENSAJES = 20
MAX_LARGO_MENSAJE = 500

SISTEMA = """Sos el asistente de GESTAR+, una app de seguimiento del embarazo que usan embarazadas \
y el equipo de enfermería de un centro de salud del Gran Mendoza, Argentina.

Hablás con una embarazada. Respondé en español rioplatense, con calidez, en pocas oraciones \
(máximo 120 palabras) y sin formato markdown."""


class AsistenteNoDisponible(Exception):
    """El asistente no puede responder ahora (sin clave, sin conexión, límite de uso)."""


_cliente = None


def _cliente_claude():
    global _cliente
    if _cliente is None:
        try:
            _cliente = anthropic.Anthropic(timeout=30.0, max_retries=2)
        except anthropic.AnthropicError as e:
            raise AsistenteNoDisponible("El asistente no está configurado.") from e
    return _cliente


def a_mensajes_api(mensajes):
    """Convierte la conversación del portal al formato de la API.

    Se queda con los últimos MAX_MENSAJES y descarta los del asistente que
    queden al principio (la API necesita empezar con un mensaje de la usuaria;
    el saludo de bienvenida no hace falta mandarlo).
    """
    recientes = mensajes[-MAX_MENSAJES:]
    while recientes and recientes[0]["rol"] != "usuaria":
        recientes = recientes[1:]
    return [
        {"role": "user" if m["rol"] == "usuaria" else "assistant", "content": m["texto"]}
        for m in recientes
    ]


def responder(mensajes, cliente=None):
    """Devuelve el texto de la respuesta del asistente.

    mensajes: [{"rol": "usuaria" | "asistente", "texto": str}], el último de
    la usuaria. Lanza AsistenteNoDisponible si no se puede responder.
    """
    cliente = cliente or _cliente_claude()
    try:
        respuesta = cliente.beta.messages.create(
            model=MODELO,
            max_tokens=MAX_TOKENS,
            # Si los filtros de seguridad rechazan una consulta legítima, la
            # API la reintenta con el modelo de respaldo que corresponda.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "low"},
            system=[{"type": "text", "text": SISTEMA, "cache_control": {"type": "ephemeral"}}],
            messages=a_mensajes_api(mensajes),
        )
    except anthropic.AuthenticationError as e:
        log.error("Clave de Anthropic inválida")
        raise AsistenteNoDisponible("El asistente no está configurado.") from e
    except TypeError as e:
        # Sin ANTHROPIC_API_KEY (ni otra credencial) el SDK falla recién acá.
        if "authentication" not in str(e):
            raise
        log.error("Falta ANTHROPIC_API_KEY")
        raise AsistenteNoDisponible("El asistente no está configurado.") from e
    except anthropic.RateLimitError as e:
        raise AsistenteNoDisponible("Hay muchas consultas en este momento.") from e
    except (anthropic.APIConnectionError, anthropic.APITimeoutError) as e:
        raise AsistenteNoDisponible("No se pudo conectar con el asistente.") from e
    except anthropic.APIStatusError as e:
        log.error("Error de la API de Anthropic %s: %s", e.status_code, e.message)
        raise AsistenteNoDisponible("El asistente tuvo un problema.") from e

    if respuesta.stop_reason == "refusal":
        return (
            "No puedo responder esa consulta. Si es sobre tu salud, escribile a tu enfermera desde "
            "Mensajes, y si es urgente llamá al 107 o andá a la guardia."
        )

    texto = "".join(b.text for b in respuesta.content if b.type == "text").strip()
    return texto or "Perdón, no pude armar una respuesta. ¿Me lo preguntás de otra forma?"
