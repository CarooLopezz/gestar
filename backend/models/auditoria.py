from sqlalchemy.orm import declared_attr

from extensions import db


def nombre_enfermero(nurse):
    return f"{nurse.nombre} {nurse.apellido}" if nurse else None


class RespuestaAuditada:
    """Quién de enfermería respondió el registro (1:N: un enfermero responde
    muchos registros, cada respuesta la escribe uno solo).

    Las respuestas viejas, de antes de guardar esto, quedan con None.
    """

    @declared_attr
    def respondido_por_id(cls):
        return db.Column(db.Integer, db.ForeignKey("nurses.id"), nullable=True)

    @declared_attr
    def respondido_por(cls):
        return db.relationship("Nurse", foreign_keys=f"{cls.__name__}.respondido_por_id")


class AlertaAuditada(RespuestaAuditada):
    """Además de quién respondió: cuándo, y quién descartó la alerta."""

    respondida_en = db.Column(db.DateTime, nullable=True)

    @declared_attr
    def descartada_por_id(cls):
        return db.Column(db.Integer, db.ForeignKey("nurses.id"), nullable=True)

    @declared_attr
    def descartada_por(cls):
        return db.relationship("Nurse", foreign_keys=f"{cls.__name__}.descartada_por_id")

    def auditoria_dict(self):
        return {
            "respondido_por": nombre_enfermero(self.respondido_por),
            "respondida_en": self.respondida_en.strftime("%d/%m/%Y %H:%M") if self.respondida_en else None,
            "descartada_por": nombre_enfermero(self.descartada_por),
        }
