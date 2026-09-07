from datetime import datetime

from flask import Blueprint, jsonify, request

from auth import nurse_required
from extensions import db
from models import BPRecord, Patient, WeightRecord

weights_bp = Blueprint("weights", __name__)


def now_fecha_hora():
    now = datetime.now()
    return now.strftime("%d/%m/%Y"), now.strftime("%H:%M")


PESO_MIN = 40
PESO_MAX = 200


def validate_peso(peso):
    errors = {}
    try:
        peso = float(peso)
        if peso < PESO_MIN or peso > PESO_MAX:
            errors["peso"] = f"Entre {PESO_MIN} y {PESO_MAX} kg"
    except (TypeError, ValueError):
        errors["peso"] = f"Entre {PESO_MIN} y {PESO_MAX} kg"
    return peso, errors


def get_previous_weight_record(patient):
    return (
        WeightRecord.query.filter_by(patient_id=patient.id)
        .order_by(WeightRecord.id.desc())
        .first()
    )


@weights_bp.route("/api/weights", methods=["GET"])
@nurse_required
def get_weight_records():
    records = WeightRecord.query.order_by(WeightRecord.id.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


@weights_bp.route("/api/weights", methods=["POST"])
@nurse_required
def create_weight_record():
    data = request.get_json(force=True, silent=True) or {}

    patient_id = data.get("patient_id")
    peso, errors = validate_peso(data.get("peso"))

    patient = Patient.query.get(patient_id)
    if patient is None:
        errors["patient_id"] = "Seleccione una embarazada"

    if errors:
        return jsonify({"errors": errors}), 400

    previous = get_previous_weight_record(patient)
    alerta = previous is not None and (peso - previous.peso) > 2

    fecha, hora = now_fecha_hora()
    record = WeightRecord(
        patient_id=patient.id,
        fecha=fecha,
        hora=hora,
        peso=peso,
        alerta=alerta,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@weights_bp.route("/api/alerts", methods=["GET"])
@nurse_required
def get_alerts():
    weight_alerts = WeightRecord.query.filter_by(alerta=True).all()
    bp_alerts = BPRecord.query.filter_by(alerta=True).all()

    alerts = [
        {
            "tipo": "peso",
            "id": r.id,
            "patient_name": f"{r.patient.nombre} {r.patient.apellido}",
            "fecha": r.fecha,
            "hora": r.hora,
            "detalle": f"{r.peso} kg",
            "motivo": "Aumento de más de 2kg respecto del registro anterior",
        }
        for r in weight_alerts
    ] + [
        {
            "tipo": "presion",
            "id": r.id,
            "patient_name": f"{r.patient.nombre} {r.patient.apellido}",
            "fecha": r.fecha,
            "hora": r.hora,
            "detalle": f"{r.sistolica}/{r.diastolica} mmHg",
            "motivo": "Presión fuera de rango seguro",
        }
        for r in bp_alerts
    ]

    def sort_key(a):
        try:
            return datetime.strptime(f"{a['fecha']} {a['hora']}", "%d/%m/%Y %H:%M")
        except ValueError:
            return datetime.min

    alerts.sort(key=sort_key, reverse=True)
    return jsonify(alerts), 200


# -----------------------------------------------------------------------
# Autoregistro de peso por parte de la paciente (portal de paciente,
# sin sesión de enfermero — igual que /api/symptoms y /api/bp/patient).
# -----------------------------------------------------------------------
@weights_bp.route("/api/weights/patient", methods=["POST"])
def create_own_weight_record():
    data = request.get_json(force=True, silent=True) or {}

    dni = (data.get("patient_dni") or "").strip()
    peso, errors = validate_peso(data.get("peso"))

    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    if errors:
        return jsonify({"errors": errors}), 400

    previous = get_previous_weight_record(patient)
    alerta = previous is not None and (peso - previous.peso) > 2

    fecha, hora = now_fecha_hora()
    record = WeightRecord(
        patient_id=patient.id,
        fecha=fecha,
        hora=hora,
        peso=peso,
        alerta=alerta,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@weights_bp.route("/api/weights/patient/<dni>", methods=["GET"])
def get_own_weight_records(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    records = (
        WeightRecord.query.filter_by(patient_id=patient.id)
        .order_by(WeightRecord.id.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records]), 200
