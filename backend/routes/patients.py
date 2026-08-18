from flask import Blueprint, jsonify, request

from auth import nurse_required
from extensions import db
from models import Patient

patients_bp = Blueprint("patients", __name__)


@patients_bp.route("/api/patients", methods=["GET"])
@nurse_required
def get_patients():
    patients = Patient.query.all()
    return jsonify([p.to_dict() for p in patients]), 200


@patients_bp.route("/api/patients", methods=["POST"])
@nurse_required
def create_patient():
    data = request.get_json(force=True, silent=True) or {}

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
    elif Patient.query.filter_by(dni=dni).first():
        errors["dni"] = "DNI ya registrado"
    if not email:
        errors["email"] = "Campo obligatorio"
    elif "@" not in email or "." not in email.split("@")[-1]:
        errors["email"] = "Formato de email inválido"

    if errors:
        return jsonify({"errors": errors}), 400

    patient = Patient(nombre=nombre, apellido=apellido, dni=dni, email=email, estado="Activo")
    db.session.add(patient)
    db.session.commit()
    return jsonify(patient.to_dict()), 201
