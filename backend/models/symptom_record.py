from extensions import db


class SymptomRecord(db.Model):
    __tablename__ = "symptom_records"

    id = db.Column(db.Integer, primary_key=True)
    patient_dni = db.Column(db.String(20), nullable=False)
    fecha = db.Column(db.String(10), nullable=False)
    hora = db.Column(db.String(5), nullable=False)
    symptoms = db.Column(db.JSON, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_dni": self.patient_dni,
            "fecha": self.fecha,
            "hora": self.hora,
            "symptoms": self.symptoms,
        }
