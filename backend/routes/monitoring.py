from datetime import datetime

from flask import Blueprint, jsonify

from auth import nurse_required
from models import BPRecord, Patient, SymptomRecord, WeightRecord

monitoring_bp = Blueprint("monitoring", __name__)

# A partir de cuántos días sin cargar ningún dato (presión, peso o síntomas)
# se considera que una paciente "no se está controlando".
UMBRAL_DIAS = 3


def parse_fecha(fecha_str):
    try:
        return datetime.strptime(fecha_str, "%d/%m/%Y").date()
    except (TypeError, ValueError):
        return None


def ultimo_control(patient):
    fechas = []
    for r in patient.bp_records:
        f = parse_fecha(r.fecha)
        if f:
            fechas.append(f)
    for r in patient.weight_records:
        f = parse_fecha(r.fecha)
        if f:
            fechas.append(f)
    for r in SymptomRecord.query.filter_by(patient_dni=patient.dni).all():
        f = parse_fecha(r.fecha)
        if f:
            fechas.append(f)
    return max(fechas) if fechas else None


def estado_monitoreo(patient):
    hoy = datetime.now().date()
    ultimo = ultimo_control(patient)
    dias_sin_control = (hoy - ultimo).days if ultimo else None
    necesita_control = dias_sin_control is None or dias_sin_control >= UMBRAL_DIAS
    return {
        "dias_sin_control": dias_sin_control,
        "necesita_control": necesita_control,
        "umbral_dias": UMBRAL_DIAS,
    }


# -----------------------------------------------------------------------
# Vista de la enfermera: todas las pacientes que necesitan que se las
# contacte porque no cargaron ningún dato en varios días.
# -----------------------------------------------------------------------
@monitoring_bp.route("/api/monitoring", methods=["GET"])
@nurse_required
def get_monitoring_notifications():
    resultado = []
    for patient in Patient.query.filter_by(estado="Activo").all():
        estado = estado_monitoreo(patient)
        if estado["necesita_control"]:
            resultado.append(
                {
                    "patient_id": patient.id,
                    "patient_name": f"{patient.nombre} {patient.apellido}",
                    "patient_dni": patient.dni,
                    **estado,
                }
            )

    resultado.sort(
        key=lambda a: (a["dias_sin_control"] is not None, a["dias_sin_control"] or 0),
        reverse=True,
    )
    return jsonify(resultado), 200


# -----------------------------------------------------------------------
# Autoservicio de la paciente (sin sesión de enfermero, igual que el resto
# de los endpoints de /patient/<dni>).
# -----------------------------------------------------------------------
@monitoring_bp.route("/api/monitoring/patient/<dni>", methods=["GET"])
def get_own_monitoring_status(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrado"}), 404

    return jsonify(estado_monitoreo(patient)), 200
