from flask import Blueprint, jsonify, request, session

from auth import nurse_required
from extensions import db
from models import BPRecord, Message, Nurse, Patient, SymptomRecord, WeightRecord


def tiene_actividad(nurse_id):
    for modelo in (BPRecord, WeightRecord, SymptomRecord):
        if modelo.query.filter(
            (modelo.respondido_por_id == nurse_id) | (modelo.descartada_por_id == nurse_id)
        ).first():
            return True
    return Message.query.filter_by(respondido_por_id=nurse_id).first() is not None


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


# El autorregistro solo sirve para crear el primer enfermero de una instalación
# nueva. Después, cualquiera que se registrara vería a todas las embarazadas:
# los enfermeros nuevos los da de alta otro enfermero (POST /api/nurses, con
# sesión) desde Usuarios.
def registro_abierto():
    return Nurse.query.first() is None


@nurses_bp.route("/api/nurse/register", methods=["GET"])
def estado_registro_nurse():
    return jsonify({"abierto": registro_abierto()}), 200


@nurses_bp.route("/api/nurse/register", methods=["POST"])
def register_nurse():
    if not registro_abierto():
        return jsonify(
            {"error": "El registro está cerrado. Pedile a un enfermero/a del equipo que te dé de alta."}
        ), 403

    data = request.get_json(force=True, silent=True) or {}
    nombre, apellido, dni, email, errors = validate_nurse_payload(data)

    if errors:
        return jsonify({"errors": errors}), 400

    nurse = Nurse(nombre=nombre, apellido=apellido, dni=dni, email=email)
    db.session.add(nurse)
    db.session.commit()

    session["nurse_id"] = nurse.id
    return jsonify(nurse.to_dict()), 201


@nurses_bp.route("/api/nurse/login", methods=["POST"])
def login_nurse():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()  # la "contraseña" es el DNI

    nurse = Nurse.query.filter_by(email=email, dni=password).first()
    if nurse is None:
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

    if errors:
        return jsonify({"errors": errors}), 400

    nurse = Nurse(nombre=nombre, apellido=apellido, dni=dni, email=email)
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

    # Auditoría: si respondió o descartó algo, borrarlo haría perder quién fue.
    if tiene_actividad(nurse_id):
        return jsonify(
            {
                "error": "No se puede eliminar: respondió o descartó alertas o mensajes, "
                "y eso se conserva para auditoría."
            }
        ), 400

    # Sus embarazadas quedan sin referente hasta que se les asigne otro.
    Patient.query.filter_by(nurse_id=nurse_id).update({"nurse_id": None})
    db.session.delete(nurse)
    db.session.commit()

    if session.get("nurse_id") == nurse_id:
        session.clear()

    return jsonify({"status": "ok"}), 200
