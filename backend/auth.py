from functools import wraps

from flask import jsonify, session


def nurse_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("nurse_id"):
            return jsonify({"error": "No autorizado. Iniciá sesión como enfermero."}), 401
        return fn(*args, **kwargs)

    return wrapper
