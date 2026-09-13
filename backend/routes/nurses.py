from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from auth import nurse_required
from extensions import db
from models import Nurse

nurses_bp = Blueprint("nurses", __name__)


def validate_nurse_payload(data, nurse_id=None):
    nombre = (data.get("nombre") or "").strip()
    apellido = (data.get("apellido") or "").strip()
    dni = (data.get("dni") or "").strip()
    email = (data.get("email") or "").strip()

    errors = {}
    if not nombre:
        errors["nombre"] = "Campo obligatorio"
    if not apellido:
        errors["apellido"] = "Campo obligatorio"

    if not dni:
        errors["dni"] = "Campo obligatorio"
    else:
        existing = Nurse.query.filter_by(dni=dni).first()
        if existing and existing.id != nurse_id:
            errors["dni"] = "DNI ya registrado"

    if not email:
        errors["email"] = "Campo obligatorio"
    elif "@" not in email or "." not in email.split("@")[-1]:
        errors["email"] = "Formato de email inválido"
    else:
        existing = Nurse.query.filter_by(email=email).first()
        if existing and existing.id != nurse_id:
            errors["email"] = "Email ya registrado"

    return nombre, apellido, dni, email, errors


def validate_password(password):
    if not password:
        return "Campo obligatorio"
    if len(password) < 6:
        return "Mínimo 6 caracteres"
    return None


@nurses_bp.route("/api/nurse/register", methods=["POST"])
def register_nurse():
    data = request.get_json(force=True, silent=True) or {}
    nombre, apellido, dni, email, errors = validate_nurse_payload(data)

    password = (data.get("password") or "").strip()
    password_error = validate_password(password)
    if password_error:
        errors["password"] = password_error

    if errors:
        return jsonify({"errors": errors}), 400

    nurse = Nurse(
        nombre=nombre,
        apellido=apellido,
        dni=dni,
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


# -----------------------------------------------------------------------
# Recuperación de contraseña: como no hay servicio de email configurado, se
# verifica identidad con email + DNI (dato que ya se pide al registrarse) y
# se permite elegir una contraseña nueva directamente.
# -----------------------------------------------------------------------
@nurses_bp.route("/api/nurse/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip()
    dni = (data.get("dni") or "").strip()
    new_password = (data.get("new_password") or "").strip()

    password_error = validate_password(new_password)
    if password_error:
        return jsonify({"errors": {"new_password": password_error}}), 400

    nurse = Nurse.query.filter_by(email=email, dni=dni).first()
    if nurse is None:
        return jsonify({"error": "El email y el DNI no coinciden con ningún registro."}), 404

    nurse.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"status": "ok"}), 200


@nurses_bp.route("/api/nurses", methods=["GET"])
@nurse_required
def get_nurses():
    nurses = Nurse.query.all()
    return jsonify([n.to_dict() for n in nurses]), 200


@nurses_bp.route("/api/nurses", methods=["POST"])
@nurse_required
def create_nurse():
    data = request.get_json(force=True, silent=True) or {}
    nombre, apellido, dni, email, errors = validate_nurse_payload(data)

    password = (data.get("password") or "").strip()
    password_error = validate_password(password)
    if password_error:
        errors["password"] = password_error

    if errors:
        return jsonify({"errors": errors}), 400

    nurse = Nurse(
        nombre=nombre,
        apellido=apellido,
        dni=dni,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(nurse)
    db.session.commit()

    # Lo crea un enfermero ya logueado: a diferencia de /api/nurse/register,
    # no se toca la sesión (no hay que reemplazar la sesión activa por la del nuevo usuario).
    return jsonify(nurse.to_dict()), 201


@nurses_bp.route("/api/nurses/<int:nurse_id>", methods=["PUT"])
@nurse_required
def update_nurse(nurse_id):
    nurse = Nurse.query.get(nurse_id)
    if nurse is None:
        return jsonify({"error": "Enfermero/a no encontrado"}), 404

    data = request.get_json(force=True, silent=True) or {}
    nombre, apellido, dni, email, errors = validate_nurse_payload(data, nurse_id=nurse_id)

    if errors:
        return jsonify({"errors": errors}), 400

    nurse.nombre = nombre
    nurse.apellido = apellido
    nurse.dni = dni
    nurse.email = email
    db.session.commit()
    return jsonify(nurse.to_dict()), 200


@nurses_bp.route("/api/nurses/<int:nurse_id>", methods=["DELETE"])
@nurse_required
def delete_nurse(nurse_id):
    nurse = Nurse.query.get(nurse_id)
    if nurse is None:
        return jsonify({"error": "Enfermero/a no encontrado"}), 404

    if Nurse.query.count() <= 1:
        return jsonify({"error": "No se puede eliminar al único enfermero/a registrado."}), 400

    db.session.delete(nurse)
    db.session.commit()

    if session.get("nurse_id") == nurse_id:
        session.clear()

    return jsonify({"status": "ok"}), 200
