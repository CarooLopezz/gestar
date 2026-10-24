import os

from flask import Blueprint, jsonify, request

import credenciales
import mailer
from auth import nurse_required
from extensions import db
from models import Nurse, Patient

cuentas_bp = Blueprint("cuentas", __name__)

MODELOS = {"paciente": Patient, "enfermero": Nurse}


def url_app():
    """Dirección de la app para poner en los mails."""
    if os.environ.get("APP_URL"):
        return os.environ["APP_URL"]
    origen = os.environ.get("FRONTEND_ORIGIN", "").split(",")[0].strip()
    return origen if origen.startswith("https://") else "https://gestar-cyan.vercel.app"


def preparar_alta(usuario):
    """Genera y asigna la contraseña de una cuenta nueva (antes del commit)."""
    contrasena = credenciales.generar_contrasena()
    credenciales.asignar(usuario, contrasena)
    return contrasena


def avisar_alta(usuario, contrasena):
    """Manda el mail con la contraseña y arma lo que se le devuelve a la
    enfermera: la contraseña se muestra en pantalla por si el mail no llega."""
    asunto, cuerpo = credenciales.mail_alta(usuario.nombre, usuario.email, contrasena, url_app())
    enviado = mailer.enviar_mail(usuario.email, asunto, cuerpo)
    return {"contrasena_provisoria": contrasena, "mail_enviado": enviado}


@cuentas_bp.route("/api/recuperar-contrasena", methods=["POST"])
def recuperar_contrasena():
    data = request.get_json(force=True, silent=True) or {}
    modelo = MODELOS.get(data.get("tipo"))
    email = (data.get("email") or "").strip()
    if modelo is None or not email:
        return jsonify({"error": "Falta el email."}), 400

    # La respuesta es la misma exista o no la cuenta, para no revelar qué
    # emails están registrados.
    mensaje = "Si el email está registrado, te mandamos una contraseña nueva. Revisá también la carpeta de spam."
    usuario = modelo.query.filter_by(email=email).first()
    if usuario is None:
        return jsonify({"mensaje": mensaje}), 200

    if not mailer.configurado():
        return jsonify(
            {"error": "Por ahora no podemos mandar mails. Pedile una contraseña nueva a tu equipo de enfermería."}
        ), 503

    contrasena = credenciales.generar_contrasena()
    asunto, cuerpo = credenciales.mail_recuperacion(usuario.nombre, usuario.email, contrasena, url_app())
    # Solo se reemplaza si el mail salió: si no, la persona se quedaría sin
    # poder entrar.
    if not mailer.enviar_mail(usuario.email, asunto, cuerpo):
        return jsonify({"error": "No pudimos mandar el mail. Probá de nuevo en un rato."}), 503
    credenciales.asignar(usuario, contrasena)
    db.session.commit()
    return jsonify({"mensaje": mensaje}), 200


@cuentas_bp.route("/api/cambiar-contrasena", methods=["POST"])
def cambiar_contrasena():
    data = request.get_json(force=True, silent=True) or {}
    modelo = MODELOS.get(data.get("tipo"))
    if modelo is None:
        return jsonify({"error": "Tipo de cuenta inválido."}), 400

    usuario = modelo.query.filter_by(email=(data.get("email") or "").strip()).first()
    if not credenciales.verificar(usuario, (data.get("actual") or "").strip()):
        return jsonify({"errors": {"actual": "La contraseña actual no es correcta."}}), 401

    nueva = (data.get("nueva") or "").strip()
    if len(nueva) < credenciales.MIN_LARGO:
        return jsonify({"errors": {"nueva": f"Tiene que tener al menos {credenciales.MIN_LARGO} caracteres."}}), 400

    credenciales.asignar(usuario, nueva)
    db.session.commit()
    return jsonify({"mensaje": "Contraseña actualizada."}), 200


# Una enfermera le genera una contraseña nueva a alguien desde Usuarios (por
# ejemplo, si no le llega el mail o es una cuenta vieja que entraba con el DNI).
@cuentas_bp.route("/api/<any(patients, nurses):tabla>/<int:usuario_id>/nueva-contrasena", methods=["POST"])
@nurse_required
def nueva_contrasena(tabla, usuario_id):
    modelo = Patient if tabla == "patients" else Nurse
    usuario = db.session.get(modelo, usuario_id)
    if usuario is None:
        return jsonify({"error": "Usuario no encontrado"}), 404

    contrasena = preparar_alta(usuario)
    db.session.commit()
    return jsonify({**usuario.to_dict(), **avisar_alta(usuario, contrasena)}), 200
