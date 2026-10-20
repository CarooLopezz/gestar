from extensions import db

TIPOS_CENTRO = ("hospital", "centro_salud", "clinica")


class HealthCenter(db.Model):
    """Centro de salud del mapa. Se precarga desde data/centros_mendoza.json
    (datos de OpenStreetMap) y el equipo puede corregirlo en la base."""

    __tablename__ = "health_centers"

    id = db.Column(db.Integer, primary_key=True)
    osm_id = db.Column(db.String(30), unique=True, nullable=True)
    nombre = db.Column(db.String(150), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)
    direccion = db.Column(db.String(200), nullable=True)
    # True cuando la dirección se dedujo de la ubicación y no estaba cargada.
    direccion_aproximada = db.Column(db.Boolean, nullable=False, default=False)
    localidad = db.Column(db.String(80), nullable=True)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    horario = db.Column(db.String(200), nullable=True)
    telefono = db.Column(db.String(60), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "tipo": self.tipo,
            "direccion": self.direccion,
            "direccion_aproximada": self.direccion_aproximada,
            "localidad": self.localidad,
            "lat": self.lat,
            "lng": self.lng,
            "horario": self.horario,
            "telefono": self.telefono,
        }
