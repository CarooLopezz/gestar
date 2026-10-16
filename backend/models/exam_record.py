from extensions import db


class ExamRecord(db.Model):
    """Un estudio del calendario prenatal que la paciente ya se hizo."""

    __tablename__ = "exam_records"
    __table_args__ = (db.UniqueConstraint("patient_id", "examen"),)

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    examen = db.Column(db.String(50), nullable=False)
    fecha_realizado = db.Column(db.Date, nullable=False)
