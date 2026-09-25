from datetime import datetime

from flask import Blueprint, jsonify, request

from auth import nurse_required
from extensions import db
from models import Message, Patient

messages_bp = Blueprint("messages", __name__)

MENSAJE_MAX_LEN = 500


def now_fecha_hora():
    now = datetime.now()
    return now.strftime("%d/%m/%Y"), now.strftime("%H:%M")


def validate_mensaje(mensaje):
    if not mensaje:
        return "El mensaje no puede estar vacío"
    if len(mensaje) > MENSAJE_MAX_LEN:
        return f"El mensaje no puede superar los {MENSAJE_MAX_LEN} caracteres"
    return None


# -----------------------------------------------------------------------
# Autoregistro de mensaje por parte de la paciente (portal de paciente,
# sin sesión de enfermero — igual que /api/symptoms, /api/bp/patient, etc.).
# -----------------------------------------------------------------------
@messages_bp.route("/api/messages/patient", methods=["POST"])
def create_own_message():
    data = request.get_json(force=True, silent=True) or {}

    dni = (data.get("patient_dni") or "").strip()
    mensaje = (data.get("mensaje") or "").strip()

    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    error = validate_mensaje(mensaje)
    if error:
        return jsonify({"errors": {"mensaje": error}}), 400

    fecha, hora = now_fecha_hora()
    record = Message(patient_id=patient.id, mensaje=mensaje, fecha=fecha, hora=hora)
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@messages_bp.route("/api/messages/patient/<dni>", methods=["GET"])
def get_own_messages(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    records = (
        Message.query.filter_by(patient_id=patient.id).order_by(Message.id.desc()).all()
    )
    return jsonify([r.to_dict() for r in records]), 200


# -----------------------------------------------------------------------
# Vista de la enfermera
# -----------------------------------------------------------------------
@messages_bp.route("/api/messages", methods=["GET"])
@nurse_required
def get_all_messages():
    records = Message.query.order_by(Message.id.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


@messages_bp.route("/api/messages/<int:message_id>/responder", methods=["PATCH"])
@nurse_required
def responder_mensaje(message_id):
    record = Message.query.get(message_id)
    if record is None:
        return jsonify({"error": "Mensaje no encontrado"}), 404

    respuesta = (request.get_json(force=True, silent=True) or {}).get("respuesta", "").strip()
    error = validate_mensaje(respuesta)
    if error:
        return jsonify({"error": error}), 400

    fecha, hora = now_fecha_hora()
    record.respuesta = respuesta
    record.fecha_respuesta = fecha
    record.hora_respuesta = hora
    db.session.commit()
    return jsonify(record.to_dict()), 200
