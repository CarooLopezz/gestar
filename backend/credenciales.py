"""
Contraseñas de embarazadas y enfermeros.

Al registrar a alguien se genera una contraseña fácil de escribir (una
palabra y cuatro números, ej. "Salud4821"), se guarda cifrada y se manda por
mail. La persona la puede cambiar después si quiere.

Las cuentas creadas antes de esto no tienen contraseña guardada: siguen
entrando con su DNI hasta que pidan una nueva ("Olvidé mi contraseña").
"""
import secrets

from werkzeug.security import check_password_hash, generate_password_hash

MIN_LARGO = 6

# Palabras cortas relacionadas con la salud y el embarazo, sin tildes ni eñes,
# fáciles de leer y de tipear en el celular.
PALABRAS = [
    "Salud", "Vida", "Bebe", "Latido", "Cuidar", "Nacer", "Crecer", "Calma", "Abrazo", "Amor",
    "Mama", "Cuna", "Sano", "Vital", "Nutrir", "Agua", "Fruta", "Paseo", "Respiro", "Control",
    "Pulso", "Energia", "Descanso", "Sonrisa", "Familia", "Ternura", "Alegria", "Cuidado", "Bienestar", "Ecografia",
]


def generar_contrasena():
    return f"{secrets.choice(PALABRAS)}{secrets.randbelow(10000):04d}"


def asignar(usuario, contrasena):
    usuario.password_hash = generate_password_hash(contrasena)


def verificar(usuario, contrasena):
    """True si la contraseña es la de la cuenta. Las cuentas viejas, sin
    contraseña guardada, entran con su DNI."""
    if usuario is None or not contrasena:
        return False
    if usuario.password_hash:
        return check_password_hash(usuario.password_hash, contrasena)
    return contrasena == usuario.dni


def mail_alta(nombre, email, contrasena, url):
    asunto = "Tu cuenta de GESTAR+"
    cuerpo = (
        f"Hola, {nombre}:\n\n"
        "Te dieron de alta en GESTAR+.\n\n"
        f"Usuario: {email}\n"
        f"Contraseña: {contrasena}\n\n"
        f"Entrá en {url}\n"
        "Si querés, después podés cambiar la contraseña desde el menú, en \"Cambiar contraseña\".\n\n"
        "Equipo de GESTAR+"
    )
    return asunto, cuerpo


def mail_recuperacion(nombre, email, contrasena, url):
    asunto = "Tu nueva contraseña de GESTAR+"
    cuerpo = (
        f"Hola, {nombre}:\n\n"
        "Pediste una contraseña nueva para GESTAR+.\n\n"
        f"Usuario: {email}\n"
        f"Contraseña nueva: {contrasena}\n\n"
        f"Entrá en {url}\n"
        "Si no lo pediste vos, avisale a tu equipo de enfermería.\n\n"
        "Equipo de GESTAR+"
    )
    return asunto, cuerpo
