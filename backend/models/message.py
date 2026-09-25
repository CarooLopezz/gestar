from extensions import db


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    mensaje = db.Column(db.Text, nullable=False)
    fecha = db.Column(db.String(10), nullable=False)
    hora = db.Column(db.String(5), nullable=False)
    respuesta = db.Column(db.Text, nullable=True)
    fecha_respuesta = db.Column(db.String(10), nullable=True)
    hora_respuesta = db.Column(db.String(5), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": f"{self.patient.nombre} {self.patient.apellido}",
            "patient_dni": self.patient.dni,
            "mensaje": self.mensaje,
            "fecha": self.fecha,
            "hora": self.hora,
            "respuesta": self.respuesta,
            "fecha_respuesta": self.fecha_respuesta,
            "hora_respuesta": self.hora_respuesta,
        }
