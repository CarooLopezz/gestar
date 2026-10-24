"""
Envío de mails por SMTP (sin dependencias: smtplib de Python).

Con Gmail:
  1. En la cuenta de Google, activar la verificación en dos pasos.
  2. En https://myaccount.google.com/apppasswords crear una "contraseña de
     aplicación" (16 letras).
  3. En el backend (Render → Environment, o backend/.env):
       SMTP_USER=la-cuenta@gmail.com
       SMTP_PASSWORD=la-contraseña-de-aplicación
Opcionales: SMTP_HOST (por defecto smtp.gmail.com), SMTP_PORT (587) y
MAIL_FROM (por defecto SMTP_USER). Con otro proveedor, por ejemplo Brevo,
alcanza con cambiar SMTP_HOST, SMTP_USER y SMTP_PASSWORD.

Sin SMTP_USER/SMTP_PASSWORD no se manda nada y enviar_mail devuelve False.
"""
import logging
import os
import smtplib
from email.message import EmailMessage

log = logging.getLogger(__name__)


def configurado():
    return bool(os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASSWORD"))


def enviar_mail(destinatario, asunto, cuerpo):
    """Manda un mail de texto. Devuelve True si se envió."""
    if not configurado():
        log.warning("Mail no configurado (falta SMTP_USER o SMTP_PASSWORD); no se envió a %s", destinatario)
        return False

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
