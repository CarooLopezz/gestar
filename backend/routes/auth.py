from flask import Blueprint, jsonify, request

import credenciales
from models import Patient

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/login", methods=["POST"])
def patient_login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()

    patient = Patient.query.filter_by(email=email).first()
    if not credenciales.verificar(patient, password):
        return jsonify({"error": "Email o contraseña incorrectos."}), 401

    return jsonify(patient.to_dict()), 200
