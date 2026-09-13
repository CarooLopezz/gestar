from datetime import datetime

from flask import Blueprint, jsonify, request

from auth import nurse_required
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

GRAVEDADES_VALIDAS = {"Leve", "Moderado", "Severo"}


def now_fecha_hora():
    now = datetime.now()
    return now.strftime("%d/%m/%Y"), now.strftime("%H:%M")


@symptoms_bp.route("/api/symptoms", methods=["GET"])
@nurse_required
def get_all_symptoms():
    records = SymptomRecord.query.order_by(SymptomRecord.id.desc()).all()
    patients_by_dni = {p.dni: p for p in Patient.query.all()}

    result = []
    for r in records:
        data = r.to_dict()
        patient = patients_by_dni.get(r.patient_dni)
        data["patient_name"] = f"{patient.nombre} {patient.apellido}" if patient else r.patient_dni
        result.append(data)
    return jsonify(result), 200


@symptoms_bp.route("/api/symptoms/<dni>", methods=["GET"])
def get_symptoms(dni):
    records = (
        SymptomRecord.query.filter_by(patient_dni=dni)
        .order_by(SymptomRecord.id.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records]), 200


def parse_symptoms(raw_symptoms):
    """Cada item debe ser {"nombre": <sintoma valido>, "gravedad": Leve|Moderado|Severo}."""
    symptoms = []
    for item in raw_symptoms or []:
        if not isinstance(item, dict):
            continue
        nombre = item.get("nombre")
        gravedad = item.get("gravedad")
        if nombre in SINTOMAS_VALIDOS and gravedad in GRAVEDADES_VALIDAS:
            symptoms.append({"nombre": nombre, "gravedad": gravedad})
    return symptoms


@symptoms_bp.route("/api/symptoms", methods=["POST"])
def create_symptom_record():
    data = request.get_json(force=True, silent=True) or {}

    dni = (data.get("patient_dni") or "").strip()

    if not Patient.query.filter_by(dni=dni).first():
        return jsonify({"error": "Paciente no encontrado"}), 404

    symptoms = parse_symptoms(data.get("symptoms"))
    if not symptoms:
        return jsonify({"error": "Seleccioná al menos un síntoma con su gravedad."}), 400

    alerta = any(s["gravedad"] == "Severo" for s in symptoms)

    fecha, hora = now_fecha_hora()
    record = SymptomRecord(
        patient_dni=dni, fecha=fecha, hora=hora, symptoms=symptoms, alerta=alerta
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201
