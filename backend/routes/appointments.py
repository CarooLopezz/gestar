import re
from datetime import date, datetime

from flask import Blueprint, jsonify, request

from auth import nurse_required
from extensions import db
from models import Appointment, Patient

appointments_bp = Blueprint("appointments", __name__)

HORA_REGEX = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


@appointments_bp.route("/api/appointments", methods=["GET"])
@nurse_required
def get_appointments():
    appointments = Appointment.query.order_by(Appointment.fecha, Appointment.hora).all()
    return jsonify([a.to_dict() for a in appointments]), 200


@appointments_bp.route("/api/appointments", methods=["POST"])
@nurse_required
def create_appointment():
    data = request.get_json(force=True, silent=True) or {}
    patient_id = data.get("patient_id")
    fecha_raw = (data.get("fecha") or "").strip()
    hora = (data.get("hora") or "").strip()
    tipo = (data.get("tipo") or "").strip()

    errors = {}

    patient = Patient.query.get(patient_id) if patient_id else None
    if patient is None:
        errors["patient_id"] = "Seleccioná una embarazada"

    fecha = None
    if not fecha_raw:
        errors["fecha"] = "Campo obligatorio"
    else:
        try:
            fecha = datetime.strptime(fecha_raw, "%Y-%m-%d").date()
        except ValueError:
            errors["fecha"] = "Fecha inválida"
        else:
            if fecha < date.today():
                errors["fecha"] = "La fecha no puede estar en el pasado"

    if not hora:
        errors["hora"] = "Campo obligatorio"
    elif not HORA_REGEX.match(hora):
        errors["hora"] = "Formato de hora inválido"

    if not tipo:
        errors["tipo"] = "Campo obligatorio"

    if errors:
        return jsonify({"errors": errors}), 400

    appointment = Appointment(
        patient_id=patient.id, fecha=fecha, hora=hora, tipo=tipo, estado="Pendiente"
    )
    db.session.add(appointment)
    db.session.commit()
    return jsonify(appointment.to_dict()), 201


@appointments_bp.route("/api/appointments/<int:appointment_id>/realizado", methods=["PATCH"])
@nurse_required
def complete_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if appointment is None:
        return jsonify({"error": "Turno no encontrado"}), 404

    appointment.estado = "Realizado"
    db.session.commit()
    return jsonify(appointment.to_dict()), 200


@appointments_bp.route("/api/appointments/<int:appointment_id>", methods=["DELETE"])
@nurse_required
def delete_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if appointment is None:
        return jsonify({"error": "Turno no encontrado"}), 404

    db.session.delete(appointment)
    db.session.commit()
    return jsonify({"status": "ok"}), 200
