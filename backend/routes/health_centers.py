import json
import os

from flask import Blueprint, jsonify
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import HealthCenter

health_centers_bp = Blueprint("health_centers", __name__)

SEED_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "centros_mendoza.json")


def cargar_centros_iniciales():
    """Si la tabla está vacía, la llena con los centros del Gran Mendoza.
    Con datos ya cargados no toca nada, así no pisa correcciones del equipo."""
    if HealthCenter.query.first() is not None:
        return
    with open(SEED_PATH, encoding="utf-8") as f:
        centros = json.load(f)
    db.session.add_all(HealthCenter(**c) for c in centros)
    try:
        db.session.commit()
    except IntegrityError:
        # Otro proceso del servidor los cargó al mismo tiempo (osm_id es único).
        db.session.rollback()


# Público, como el resto de lo que consulta la paciente desde su portal.
@health_centers_bp.route("/api/centros", methods=["GET"])
def get_centros():
    centros = HealthCenter.query.order_by(HealthCenter.nombre).all()
    return jsonify([c.to_dict() for c in centros]), 200
