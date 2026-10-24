"""
Envío de mails (sin dependencias: urllib y smtplib de Python).

Hay dos formas; se usa la primera configurada:

1. Brevo por API web (la que anda en Render gratis, que bloquea SMTP):
  1. Crear una cuenta gratis en https://www.brevo.com.
  2. En Senders, domains & dedicated IPs → Senders, agregar y verificar el
     mail que va a figurar como remitente (sirve un Gmail).
  3. En SMTP & API → API keys, generar una clave.
  4. En el backend (Render → Environment, o backend/.env):
       BREVO_API_KEY=xkeysib-...
       MAIL_FROM=el-mail-verificado@gmail.com

2. SMTP (por ejemplo Gmail; anda en la compu pero no en Render gratis):
  1. En la cuenta de Google, activar la verificación en dos pasos.
  2. En https://myaccount.google.com/apppasswords crear una "contraseña de
     aplicación" (16 letras).
  3. En el backend:
       SMTP_USER=la-cuenta@gmail.com
       SMTP_PASSWORD=la-contraseña-de-aplicación
  Opcionales: SMTP_HOST (por defecto smtp.gmail.com), SMTP_PORT (587) y
  MAIL_FROM (por defecto SMTP_USER).

Sin ninguna de las dos no se manda nada y enviar_mail devuelve False.
"""
import json
import logging
import os
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage

log = logging.getLogger(__name__)

NOMBRE_REMITENTE = "GESTAR+"


def _brevo_configurado():
    return bool(os.environ.get("BREVO_API_KEY") and (os.environ.get("MAIL_FROM") or os.environ.get("SMTP_USER")))


def _smtp_configurado():
    return bool(os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASSWORD"))


def configurado():
    return _brevo_configurado() or _smtp_configurado()


def enviar_mail(destinatario, asunto, cuerpo):
    """Manda un mail de texto. Devuelve True si se envió."""
    if _brevo_configurado():
        log.info("Mandando mail a %s por Brevo", destinatario)
        return _enviar_brevo(destinatario, asunto, cuerpo)
    if _smtp_configurado():
        log.info("Mandando mail a %s por SMTP (Brevo no configurado)", destinatario)
        return _enviar_smtp(destinatario, asunto, cuerpo)
    log.warning("Mail no configurado (falta BREVO_API_KEY o SMTP_USER/SMTP_PASSWORD); no se envió a %s", destinatario)
    return False


def _enviar_brevo(destinatario, asunto, cuerpo):
    remitente = os.environ.get("MAIL_FROM") or os.environ["SMTP_USER"]
    datos = {
        "sender": {"name": NOMBRE_REMITENTE, "email": remitente},
        "to": [{"email": destinatario}],
        "subject": asunto,
        "textContent": cuerpo,
    }
    pedido = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(datos).encode("utf-8"),
        headers={
            "api-key": os.environ["BREVO_API_KEY"],
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(pedido, timeout=15) as respuesta:
            log.info("Brevo aceptó el mail a %s: %s", destinatario, respuesta.read().decode("utf-8", "replace"))
            return True
    except urllib.error.HTTPError as e:
        log.error("Brevo rechazó el mail a %s: %s %s", destinatario, e.code, e.read().decode("utf-8", "replace"))
        return False
    except OSError as e:
        log.error("No se pudo mandar el mail a %s por Brevo: %s", destinatario, e)
        return False


def _enviar_smtp(destinatario, asunto, cuerpo):
    usuario = os.environ["SMTP_USER"]
    mensaje = EmailMessage()
    mensaje["From"] = os.environ.get("MAIL_FROM", usuario)
    mensaje["To"] = destinatario
    mensaje["Subject"] = asunto
    mensaje.set_content(cuerpo)

    try:
        with smtplib.SMTP(
            os.environ.get("SMTP_HOST", "smtp.gmail.com"), int(os.environ.get("SMTP_PORT", "587")), timeout=15
        ) as smtp:
            smtp.starttls()
            smtp.login(usuario, os.environ["SMTP_PASSWORD"])
            smtp.send_message(mensaje)
        return True
    except (smtplib.SMTPException, OSError) as e:
        log.error("No se pudo mandar el mail a %s: %s", destinatario, e)
        return False
