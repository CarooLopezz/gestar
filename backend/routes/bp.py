from datetime import datetime

from flask import Blueprint, jsonify, request

from auth import nurse_required
from extensions import db
from models import Patient, BPRecord

bp_bp = Blueprint("bp", __name__)

SISTOLICA_MAX_ALERTA = 120
DIASTOLICA_MAX_ALERTA = 80


def now_fecha_hora():
    now = datetime.now()
    return now.strftime("%d/%m/%Y"), now.strftime("%H:%M")


def validate_bp_values(sistolica, diastolica):
    errors = {}

    try:
        sistolica = int(sistolica)
        if sistolica <= 0:
            errors["sistolica"] = "Tiene que ser un valor positivo"
    except (TypeError, ValueError):
        errors["sistolica"] = "Tiene que ser un valor positivo"

    try:
        diastolica = int(diastolica)
        if diastolica <= 0:
            errors["diastolica"] = "Tiene que ser un valor positivo"
    except (TypeError, ValueError):
        errors["diastolica"] = "Tiene que ser un valor positivo"

    return sistolica, diastolica, errors


def bp_alerta(sistolica, diastolica):
    # Presión normal: hasta 120/80. Por encima de cualquiera de los dos
    # valores se considera presión alta y genera alerta.
    return sistolica > SISTOLICA_MAX_ALERTA or diastolica > DIASTOLICA_MAX_ALERTA


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
        alerta=bp_alerta(sistolica, diastolica),
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
        alerta=bp_alerta(sistolica, diastolica),
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
