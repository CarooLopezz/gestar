from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import Nurse

nurses_bp = Blueprint("nurses", __name__)


@nurses_bp.route("/api/nurse/register", methods=["POST"])
def register_nurse():
    data = request.get_json(force=True, silent=True) or {}

    nombre = (data.get("nombre") or "").strip()
    apellido = (data.get("apellido") or "").strip()
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()

    errors = {}
    if not nombre:
        errors["nombre"] = "Campo obligatorio"
    if not apellido:
        errors["apellido"] = "Campo obligatorio"
    if not email:
        errors["email"] = "Campo obligatorio"
    elif "@" not in email or "." not in email.split("@")[-1]:
        errors["email"] = "Formato de email inválido"
    elif Nurse.query.filter_by(email=email).first():
        errors["email"] = "Email ya registrado"
    if not password:
        errors["password"] = "Campo obligatorio"
    elif len(password) < 6:
        errors["password"] = "Mínimo 6 caracteres"

    if errors:
        return jsonify({"errors": errors}), 400

    nurse = Nurse(
        nombre=nombre,
        apellido=apellido,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(nurse)
    db.session.commit()

    session["nurse_id"] = nurse.id
    return jsonify(nurse.to_dict()), 201


@nurses_bp.route("/api/nurse/login", methods=["POST"])
def login_nurse():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()

    nurse = Nurse.query.filter_by(email=email).first()
    if nurse is None or not check_password_hash(nurse.password_hash, password):
        return jsonify({"error": "Email o contraseña incorrectos."}), 401

    session["nurse_id"] = nurse.id
    return jsonify(nurse.to_dict()), 200


@nurses_bp.route("/api/nurse/logout", methods=["POST"])
def logout_nurse():
    session.clear()
    return jsonify({"status": "ok"}), 200


@nurses_bp.route("/api/nurse/me", methods=["GET"])
def get_current_nurse():
    nurse_id = session.get("nurse_id")
    if not nurse_id:
        return jsonify({"error": "No autorizado."}), 401

    nurse = Nurse.query.get(nurse_id)
    if nurse is None:
        session.clear()
        return jsonify({"error": "No autorizado."}), 401

    return jsonify(nurse.to_dict()), 200
