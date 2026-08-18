from datetime import datetime

from flask import Blueprint, jsonify, request

from auth import nurse_required
from extensions import db
from models import Patient, WeightRecord

weights_bp = Blueprint("weights", __name__)


def now_fecha_hora():
    now = datetime.now()
    return now.strftime("%d/%m/%Y"), now.strftime("%H:%M")


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
    peso = data.get("peso")

    errors = {}
    patient = Patient.query.get(patient_id)
    if patient is None:
        errors["patient_id"] = "Seleccione una embarazada"

    try:
        peso = float(peso)
        if peso < 30 or peso > 200:
            errors["peso"] = "Entre 30 y 200 kg"
    except (TypeError, ValueError):
        errors["peso"] = "Entre 30 y 200 kg"

    if errors:
        return jsonify({"errors": errors}), 400

    previous = (
        WeightRecord.query.filter_by(patient_id=patient.id)
        .order_by(WeightRecord.id.desc())
        .first()
    )
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
    records = (
        WeightRecord.query.filter_by(alerta=True).order_by(WeightRecord.id.desc()).all()
    )
    return jsonify([r.to_dict() for r in records]), 200
