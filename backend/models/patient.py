from extensions import db


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    dni = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    estado = db.Column(db.String(20), nullable=False, default="Activo")
    hora_recordatorio = db.Column(db.String(5), nullable=True)
    fecha_parto = db.Column(db.Date, nullable=True)
    # Enfermero/a de referencia (1:N: un enfermero tiene muchas embarazadas).
    # Es organizativo: todo el equipo sigue viendo a todas las pacientes.
    nurse_id = db.Column(db.Integer, db.ForeignKey("nurses.id"), nullable=True)
    referente = db.relationship("Nurse", foreign_keys=[nurse_id])

    bp_records = db.relationship("BPRecord", backref="patient", cascade="all, delete-orphan")
    weight_records = db.relationship("WeightRecord", backref="patient", cascade="all, delete-orphan")
    messages = db.relationship("Message", backref="patient", cascade="all, delete-orphan")
    appointments = db.relationship("Appointment", backref="patient", cascade="all, delete-orphan")
    exam_records = db.relationship("ExamRecord", backref="patient", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "dni": self.dni,
            "email": self.email,
            "estado": self.estado,
            "hora_recordatorio": self.hora_recordatorio,
            "fecha_parto": self.fecha_parto.isoformat() if self.fecha_parto else None,
            "nurse_id": self.nurse_id,
            "enfermero_referencia": (
                f"{self.referente.nombre} {self.referente.apellido}" if self.referente else None
            ),
        }
