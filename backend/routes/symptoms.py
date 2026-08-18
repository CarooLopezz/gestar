from datetime import datetime

from flask import Blueprint, jsonify, request

from extensions import db
from models import Patient, SymptomRecord

symptoms_bp = Blueprint("symptoms", __name__)

SINTOMAS_VALIDOS = {
    "Dolor de cabeza intenso",
    "Visión borrosa",
    "Hinchazón",
    "Dolor abdominal",
    "Náuseas",
    "Mareos",
}


def now_fecha_hora():
    now = datetime.now()
    return now.strftime("%d/%m/%Y"), now.strftime("%H:%M")


@symptoms_bp.route("/api/symptoms/<dni>", methods=["GET"])
def get_symptoms(dni):
    records = (
        SymptomRecord.query.filter_by(patient_dni=dni)
        .order_by(SymptomRecord.id.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records]), 200


@symptoms_bp.route("/api/symptoms", methods=["POST"])
def create_symptom_record():
    data = request.get_json(force=True, silent=True) or {}

    dni = (data.get("patient_dni") or "").strip()
    symptoms = data.get("symptoms") or []

    if not Patient.query.filter_by(dni=dni).first():
        return jsonify({"error": "Paciente no encontrado"}), 404

    symptoms = [s for s in symptoms if s in SINTOMAS_VALIDOS]
    if not symptoms:
        return jsonify({"error": "Seleccioná al menos un síntoma."}), 400

    fecha, hora = now_fecha_hora()
    record = SymptomRecord(patient_dni=dni, fecha=fecha, hora=hora, symptoms=symptoms)
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201
