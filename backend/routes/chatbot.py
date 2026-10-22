import time
from collections import defaultdict, deque

from flask import Blueprint, jsonify, request

import chatbot
from models import Patient

chatbot_bp = Blueprint("chatbot", __name__)

# Límite de uso por paciente, para que el asistente no se use de más (cada
# consulta tiene costo). En memoria: se reinicia si se reinicia el servidor.
LIMITE_CONSULTAS = 30
VENTANA_SEGUNDOS = 3600
_consultas = defaultdict(deque)


def _supera_limite(dni):
    ahora = time.time()
    historial = _consultas[dni]
    while historial and ahora - historial[0] > VENTANA_SEGUNDOS:
        historial.popleft()
    if len(historial) >= LIMITE_CONSULTAS:
        return True
    historial.append(ahora)
    return False


def _validar(mensajes):
    if not isinstance(mensajes, list) or not mensajes:
        return "No hay mensajes."
    for m in mensajes:
        if not isinstance(m, dict) or m.get("rol") not in ("usuaria", "asistente"):
            return "Mensaje inválido."
        if not isinstance(m.get("texto"), str) or not m["texto"].strip():
            return "Mensaje vacío."
    if mensajes[-1]["rol"] != "usuaria":
        return "El último mensaje tiene que ser de la usuaria."
    if len(mensajes[-1]["texto"]) > chatbot.MAX_LARGO_MENSAJE:
        return f"El mensaje no puede superar los {chatbot.MAX_LARGO_MENSAJE} caracteres."
    return None


# Autoservicio de la paciente (sin sesión de enfermero, igual que el resto de
# los endpoints /patient del portal).
@chatbot_bp.route("/api/chatbot/patient", methods=["POST"])
def conversar():
    data = request.get_json(force=True, silent=True) or {}
    patient = Patient.query.filter_by(dni=(data.get("dni") or "").strip(), estado="Activo").first()
    if patient is None:
        return jsonify({"error": "Paciente no encontrada"}), 404

    mensajes = data.get("mensajes")
    error = _validar(mensajes)
    if error:
        return jsonify({"error": error}), 400

    if _supera_limite(patient.dni):
        return jsonify(
            {"error": "Hiciste muchas consultas seguidas. Probá de nuevo en un rato o escribile a tu enfermera."}
        ), 429

    try:
        texto = chatbot.responder(mensajes)
    except chatbot.AsistenteNoDisponible as e:
        return jsonify({"error": f"{e} Probá más tarde o escribile a tu enfermera desde Mensajes."}), 503

    return jsonify({"respuesta": texto}), 200
