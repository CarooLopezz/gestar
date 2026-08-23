from datetime import datetime

from flask import Blueprint, jsonify, request

from auth import nurse_required
from extensions import db
from models import Patient, BPRecord

bp_bp = Blueprint("bp", __name__)


def now_fecha_hora():
    now = datetime.now()
    return now.strftime("%d/%m/%Y"), now.strftime("%H:%M")


def validate_bp_values(sistolica, diastolica):
    errors = {}

    try:
        sistolica = int(sistolica)
        if sistolica < 80 or sistolica > 200:
            errors["sistolica"] = "Entre 80 y 200"
    except (TypeError, ValueError):
        errors["sistolica"] = "Entre 80 y 200"

    try:
        diastolica = int(diastolica)
        if diastolica < 50 or diastolica > 130:
            errors["diastolica"] = "Entre 50 y 130"
    except (TypeError, ValueError):
        errors["diastolica"] = "Entre 50 y 130"

    return sistolica, diastolica, errors


@bp_bp.route("/api/bp", methods=["GET"])
@nurse_required
def get_bp_records():
    records = BPRecord.query.order_by(BPRecord.id.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


@bp_bp.route("/api/bp", methods=["POST"])
@nurse_required
def create_bp_record():
    data = request.get_json(force=True, silent=True) or {}

    patient_id = data.get("patient_id")
    sistolica, diastolica, errors = validate_bp_values(data.get("sistolica"), data.get("diastolica"))

    patient = Patient.query.get(patient_id)
    if patient is None:
        errors["patient_id"] = "Seleccione una embarazada"

    if errors:
        return jsonify({"errors": errors}), 400

    fecha, hora = now_fecha_hora()
    record = BPRecord(
        patient_id=patient.id,
        fecha=fecha,
        hora=hora,
        sistolica=sistolica,
        diastolica=diastolica,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


# -----------------------------------------------------------------------
# Autoregistro de presión por parte de la paciente (portal de paciente,
# sin sesión de enfermero — igual que /api/symptoms).
# -----------------------------------------------------------------------
@bp_bp.route("/api/bp/patient", methods=["POST"])
def create_own_bp_record():
    data = request.get_json(force=True, silent=True) or {}

    dni = (data.get("patient_dni") or "").strip()
    sistolica, diastolica, errors = validate_bp_values(data.get("sistolica"), data.get("diastolica"))

    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    if errors:
        return jsonify({"errors": errors}), 400

    fecha, hora = now_fecha_hora()
    record = BPRecord(
        patient_id=patient.id,
        fecha=fecha,
        hora=hora,
        sistolica=sistolica,
        diastolica=diastolica,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@bp_bp.route("/api/bp/patient/<dni>", methods=["GET"])
def get_own_bp_records(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    records = (
        BPRecord.query.filter_by(patient_id=patient.id)
        .order_by(BPRecord.id.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records]), 200
