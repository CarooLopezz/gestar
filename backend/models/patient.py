from extensions import db


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    dni = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    estado = db.Column(db.String(20), nullable=False, default="Activo")

    bp_records = db.relationship("BPRecord", backref="patient", cascade="all, delete-orphan")
    weight_records = db.relationship("WeightRecord", backref="patient", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "dni": self.dni,
            "email": self.email,
            "estado": self.estado,
        }
