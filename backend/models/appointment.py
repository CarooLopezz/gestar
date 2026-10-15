from extensions import db


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    hora = db.Column(db.String(5), nullable=False)
    tipo = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(20), nullable=False, default="Pendiente")

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": f"{self.patient.nombre} {self.patient.apellido}",
            "fecha": self.fecha.isoformat(),
            "hora": self.hora,
            "tipo": self.tipo,
            "estado": self.estado,
        }
