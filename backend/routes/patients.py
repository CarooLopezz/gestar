import re
from datetime import datetime

from flask import Blueprint, jsonify, request

from auth import nurse_required
from extensions import db
from models import BPRecord, Patient, SymptomRecord

patients_bp = Blueprint("patients", __name__)

HORA_REGEX = re.compile(r"^\d{2}:\d{2}$")


def validate_patient_payload(data, patient_id=None):
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
        existing = Patient.query.filter_by(dni=dni).first()
        if existing and existing.id != patient_id:
            errors["dni"] = "DNI ya registrado"

    if not email:
        errors["email"] = "Campo obligatorio"
    elif "@" not in email or "." not in email.split("@")[-1]:
        errors["email"] = "Formato de email inválido"

    return nombre, apellido, dni, email, errors


@patients_bp.route("/api/patients", methods=["GET"])
@nurse_required
def get_patients():
    patients = Patient.query.all()
    return jsonify([p.to_dict() for p in patients]), 200


@patients_bp.route("/api/patients", methods=["POST"])
@nurse_required
def create_patient():
    data = request.get_json(force=True, silent=True) or {}
    nombre, apellido, dni, email, errors = validate_patient_payload(data)

    if errors:
        return jsonify({"errors": errors}), 400

    patient = Patient(nombre=nombre, apellido=apellido, dni=dni, email=email, estado="Activo")
    db.session.add(patient)
    db.session.commit()
    return jsonify(patient.to_dict()), 201


@patients_bp.route("/api/patients/<int:patient_id>", methods=["PUT"])
@nurse_required
def update_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if patient is None:
        return jsonify({"error": "Paciente no encontrada"}), 404

    data = request.get_json(force=True, silent=True) or {}
    nombre, apellido, dni, email, errors = validate_patient_payload(data, patient_id=patient_id)

    if errors:
        return jsonify({"errors": errors}), 400

    old_dni = patient.dni
    patient.nombre = nombre
    patient.apellido = apellido
    patient.dni = dni
    patient.email = email
    db.session.commit()

    if old_dni != dni:
        SymptomRecord.query.filter_by(patient_dni=old_dni).update({"patient_dni": dni})
        db.session.commit()

    return jsonify(patient.to_dict()), 200


@patients_bp.route("/api/patients/<int:patient_id>/estado", methods=["PATCH"])
@nurse_required
def toggle_patient_estado(patient_id):
    patient = Patient.query.get(patient_id)
    if patient is None:
        return jsonify({"error": "Paciente no encontrada"}), 404

    patient.estado = "Inactivo" if patient.estado == "Activo" else "Activo"
    db.session.commit()
    return jsonify(patient.to_dict()), 200


@patients_bp.route("/api/patients/<int:patient_id>", methods=["DELETE"])
@nurse_required
def delete_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if patient is None:
        return jsonify({"error": "Paciente no encontrada"}), 404

    SymptomRecord.query.filter_by(patient_dni=patient.dni).delete()
    db.session.delete(patient)
    db.session.commit()
    return jsonify({"status": "ok"}), 200


# -----------------------------------------------------------------------
# Recordatorio diario de presión (autoservicio de la paciente, sin sesión
# de enfermero — igual que /api/bp/patient, /api/messages/patient, etc.)
# -----------------------------------------------------------------------
@patients_bp.route("/api/patients/patient/<dni>/recordatorio", methods=["GET"])
def get_recordatorio(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    hoy = datetime.now().strftime("%d/%m/%Y")
    ya_registro_hoy = (
        BPRecord.query.filter_by(patient_id=patient.id, fecha=hoy).first() is not None
    )
    return jsonify(
        {"hora_recordatorio": patient.hora_recordatorio, "ya_registro_hoy": ya_registro_hoy}
    ), 200


@patients_bp.route("/api/patients/patient/<dni>/recordatorio", methods=["PATCH"])
def set_recordatorio(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    data = request.get_json(force=True, silent=True) or {}
    hora = (data.get("hora_recordatorio") or "").strip()

    if hora and not HORA_REGEX.match(hora):
        return jsonify({"error": "Formato de hora inválido"}), 400

    patient.hora_recordatorio = hora or None
    db.session.commit()
    return jsonify(patient.to_dict()), 200
