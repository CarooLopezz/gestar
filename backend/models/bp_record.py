from extensions import db


class BPRecord(db.Model):
    __tablename__ = "bp_records"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    fecha = db.Column(db.String(10), nullable=False)
    hora = db.Column(db.String(5), nullable=False)
    sistolica = db.Column(db.Integer, nullable=False)
    diastolica = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": f"{self.patient.nombre} {self.patient.apellido}",
            "fecha": self.fecha,
            "hora": self.hora,
            "sistolica": self.sistolica,
            "diastolica": self.diastolica,
        }
