from datetime import date

from flask import Blueprint, jsonify, request

from extensions import db
from models import Appointment, ExamRecord, Patient
from pregnancy import ESTUDIOS_POR_KEY, MONITOREO_POR_TRIMESTRE, estado_estudios, info_embarazo
from routes.patients import parse_fecha_parto

pregnancy_bp = Blueprint("pregnancy", __name__)


def agenda_de(patient):
    embarazo = info_embarazo(patient.fecha_parto)
    realizados = {r.examen: r.fecha_realizado for r in patient.exam_records}
    turnos = (
        Appointment.query.filter_by(patient_id=patient.id, estado="Pendiente")
        .filter(Appointment.fecha >= date.today())
        .order_by(Appointment.fecha, Appointment.hora)
        .all()
    )
    return {
        "fecha_parto": patient.fecha_parto.isoformat() if patient.fecha_parto else None,
        "embarazo": embarazo,
        "monitoreo": MONITOREO_POR_TRIMESTRE[embarazo["trimestre"]] if embarazo else [],
        "estudios": estado_estudios(embarazo["semana"], realizados) if embarazo else [],
        "turnos": [t.to_dict() for t in turnos],
    }


# -----------------------------------------------------------------------
# Agenda de la paciente (autoservicio sin sesión de enfermero, igual que el
# resto de los endpoints /patient/<dni>).
# -----------------------------------------------------------------------
@pregnancy_bp.route("/api/agenda/patient/<dni>", methods=["GET"])
def get_agenda(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404
    return jsonify(agenda_de(patient)), 200


@pregnancy_bp.route("/api/agenda/patient/<dni>/fecha-parto", methods=["PATCH"])
def set_fecha_parto(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    data = request.get_json(force=True, silent=True) or {}
    if not (data.get("fecha_parto") or "").strip():
        return jsonify({"errors": {"fecha_parto": "Campo obligatorio"}}), 400

    fecha, error = parse_fecha_parto(data.get("fecha_parto"), patient.fecha_parto)
    if error:
        return jsonify({"errors": {"fecha_parto": error}}), 400

    patient.fecha_parto = fecha
    db.session.commit()
    return jsonify(agenda_de(patient)), 200


@pregnancy_bp.route("/api/agenda/patient/<dni>/estudios/<key>", methods=["POST", "DELETE"])
def toggle_estudio(dni, key):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404
    if key not in ESTUDIOS_POR_KEY:
        return jsonify({"error": "Estudio desconocido"}), 404

    existente = ExamRecord.query.filter_by(patient_id=patient.id, examen=key).first()
    if request.method == "POST" and existente is None:
        db.session.add(ExamRecord(patient_id=patient.id, examen=key, fecha_realizado=date.today()))
    elif request.method == "DELETE" and existente is not None:
        db.session.delete(existente)
    db.session.commit()
    return jsonify(agenda_de(patient)), 200
