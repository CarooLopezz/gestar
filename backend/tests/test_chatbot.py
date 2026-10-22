"""Pruebas de aceptación de la HU15 (asistente), lado backend.

Correr desde backend/:  python -m unittest discover tests
Usan una base SQLite temporal y un cliente falso de Claude: nunca llaman a la
API de verdad ni generan costo.
"""
import os
import tempfile
import unittest
from datetime import datetime
from types import SimpleNamespace as NS

_tmp = tempfile.mkdtemp()
os.environ.setdefault("DATABASE_URL", f"sqlite:///{os.path.join(_tmp, 'test.db')}")
os.environ.setdefault("SECRET_KEY", "test")

import chatbot  # noqa: E402
import routes.chatbot as rutas_chatbot  # noqa: E402
from app import app  # noqa: E402  (tiene que importarse después de fijar la base)

URL = "/api/chatbot/patient"
BIENVENIDA = {"rol": "asistente", "texto": "¡Hola! Soy el asistente de GESTAR+."}


class ClienteFalso:
    """Imita client.beta.messages.create y guarda lo que se le mandó."""

    def __init__(self, texto="Respuesta de prueba", stop_reason="end_turn", error=None):
        self.llamadas = []
        cliente = self

        class _Messages:
            @staticmethod
            def create(**kwargs):
                cliente.llamadas.append(kwargs)
                if error:
                    raise error
                return NS(stop_reason=stop_reason, content=[NS(type="thinking"), NS(type="text", text=texto)])

        self.beta = NS(messages=_Messages)


def crear_paciente(dni, nombre="Ana"):
    cliente = app.test_client()
    with cliente.session_transaction() as s:
        s["nurse_id"] = 1
    cliente.post(
        "/api/patients",
        json={"nombre": nombre, "apellido": "Prueba", "dni": dni, "email": f"{dni}@prueba.com"},
    )


class ChatbotTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        crear_paciente("40000001")
        crear_paciente("40000002", "Sofía")

    def setUp(self):
        self.client = app.test_client()
        self.falso = ClienteFalso()
        chatbot._cliente = self.falso
        rutas_chatbot._consultas.clear()

    def conversar(self, mensajes, dni="40000001"):
        return self.client.post(URL, json={"dni": dni, "mensajes": mensajes})

    # GT-154: enviar mensajes y ver la respuesta
    def test_responde_a_la_usuaria(self):
        r = self.conversar([BIENVENIDA, {"rol": "usuaria", "texto": "Hola"}])
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json(), {"respuesta": "Respuesta de prueba"})

    def test_manda_la_conversacion_sin_la_bienvenida(self):
        self.conversar(
            [
                BIENVENIDA,
                {"rol": "usuaria", "texto": "¿Cuál es el horario?"},
                {"rol": "asistente", "texto": "De lunes a viernes de 8 a 20 h."},
                {"rol": "usuaria", "texto": "¿Y los sábados?"},
            ]
        )
        enviados = self.falso.llamadas[0]["messages"]
        self.assertEqual([m["role"] for m in enviados], ["user", "assistant", "user"])
        self.assertEqual(enviados[-1]["content"], "¿Y los sábados?")

    def test_valida_la_conversacion(self):
        self.assertEqual(self.conversar([BIENVENIDA]).status_code, 400)
        self.assertEqual(self.conversar([{"rol": "usuaria", "texto": "a" * 501}]).status_code, 400)
        self.assertEqual(self.conversar([{"rol": "otro", "texto": "hola"}]).status_code, 400)
        self.assertEqual(self.conversar([{"rol": "usuaria", "texto": "hola"}], dni="99999999").status_code, 404)
        self.assertEqual(self.falso.llamadas, [])

    def test_limite_de_consultas(self):
        mensajes = [{"rol": "usuaria", "texto": "hola"}]
        codigos = [self.conversar(mensajes).status_code for _ in range(rutas_chatbot.LIMITE_CONSULTAS + 1)]
        self.assertTrue(all(c == 200 for c in codigos[:-1]))
        self.assertEqual(codigos[-1], 429)
        # El límite es por paciente: otra puede seguir consultando.
        self.assertEqual(self.conversar(mensajes, dni="40000002").status_code, 200)

    def test_sin_clave_avisa_que_no_esta_disponible(self):
        chatbot._cliente = ClienteFalso(
            error=TypeError('"Could not resolve authentication method. Expected one of api_key..."')
        )
        r = self.conversar([{"rol": "usuaria", "texto": "hola"}])
        self.assertEqual(r.status_code, 503)
        self.assertIn("escribile a tu enfermera", r.get_json()["error"])

    def test_si_rechaza_deriva_a_enfermeria_y_al_107(self):
        chatbot._cliente = ClienteFalso(stop_reason="refusal")
        texto = self.conversar([{"rol": "usuaria", "texto": "hola"}]).get_json()["respuesta"]
        self.assertIn("Mensajes", texto)
        self.assertIn("107", texto)

    # GT-155: consultas generales y horarios
    def test_usa_el_modelo_y_el_respaldo_ante_rechazos(self):
        self.conversar([{"rol": "usuaria", "texto": "hola"}])
        llamada = self.falso.llamadas[0]
        self.assertEqual(llamada["model"], "claude-opus-5-5")
        self.assertEqual(llamada["fallbacks"], "default")
        self.assertIn("server-side-fallback-2026-07-01", llamada["betas"])

    def test_instrucciones_con_horario_y_senales_de_alarma(self):
        self.conversar([{"rol": "usuaria", "texto": "hola"}])
        fijo, contexto = self.falso.llamadas[0]["system"]
        self.assertIn("lunes a viernes de 8 a 20 h", fijo["text"])
        self.assertIn("107", fijo["text"])
        self.assertIn("No diagnosticás", fijo["text"])
        self.assertEqual(fijo["cache_control"], {"type": "ephemeral"})
        self.assertIn("Nombre: Ana.", contexto["text"])

    def test_contexto_dice_si_enfermeria_atiende(self):
        agenda = {"embarazo": None, "turnos": [], "estudios": []}
        miercoles = datetime(2026, 10, 21, 10, 0, tzinfo=chatbot.ARGENTINA)
        sabado = datetime(2026, 10, 24, 10, 0, tzinfo=chatbot.ARGENTINA)
        self.assertIn("está atendiendo", chatbot.contexto_paciente("Ana", agenda, None, miercoles))
        self.assertIn("fuera de horario", chatbot.contexto_paciente("Ana", agenda, None, sabado))

    def test_contexto_con_embarazo_turnos_y_estudios(self):
        agenda = {
            "fecha_parto": "2027-02-19",
            "embarazo": {"semana": 22, "dias": 3, "trimestre": 2},
            "monitoreo": ["Presión arterial: todos los días"],
            "estudios": [
                {"nombre": "Ecografía morfológica", "estado": "pendiente", "semana_desde": 20, "semana_hasta": 24},
                {"nombre": "Laboratorio inicial", "estado": "hecho", "semana_desde": 1, "semana_hasta": 13},
            ],
            "turnos": [{"tipo": "Ecografía", "fecha": "2026-10-30", "hora": "10:30"}],
        }
        texto = chatbot.contexto_paciente("Ana", agenda, "Laura Ruiz")
        self.assertIn("semana 22", texto)
        self.assertIn("19/02/2027", texto)
        self.assertIn("Ecografía morfológica", texto)
        self.assertNotIn("Laboratorio inicial", texto)
        self.assertIn("Ecografía el 30/10/2026 a las 10:30", texto)
        self.assertIn("Laura Ruiz", texto)


if __name__ == "__main__":
    unittest.main()
