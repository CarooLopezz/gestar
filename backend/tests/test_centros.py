"""Pruebas de aceptación de la HU14 (mapa de centros de salud), lado backend.

Correr desde backend/:  python -m unittest discover tests
Usan una base SQLite temporal, nunca la de desarrollo ni la de Render.
"""
import os
import tempfile
import unittest

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp, 'test.db')}"
os.environ.setdefault("SECRET_KEY", "test")

from app import app  # noqa: E402  (tiene que importarse después de fijar la base)
from extensions import db  # noqa: E402
from models import HealthCenter  # noqa: E402
from models.health_center import TIPOS_CENTRO  # noqa: E402
from routes.health_centers import cargar_centros_iniciales  # noqa: E402

# Recuadro del Gran Mendoza (Capital, Godoy Cruz, Guaymallén, Las Heras,
# Luján de Cuyo, Maipú).
LAT_MIN, LAT_MAX = -33.08, -32.78
LNG_MIN, LNG_MAX = -68.98, -68.68


class CentrosTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_lista_publica_sin_sesion(self):
        # GT-147: la paciente los ve sin sesión de enfermero.
        r = self.client.get("/api/centros")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json), 53)

    def test_cada_centro_tiene_lo_que_muestra_la_pantalla(self):
        # GT-147 y GT-148: tipo para el ícono, nombre, ubicación para el mapa y
        # los campos de dirección y horario (pueden venir vacíos).
        for c in self.client.get("/api/centros").json:
            with self.subTest(centro=c["nombre"]):
                self.assertTrue(c["nombre"].strip())
                self.assertIn(c["tipo"], TIPOS_CENTRO)
                self.assertTrue(LAT_MIN <= c["lat"] <= LAT_MAX)
                self.assertTrue(LNG_MIN <= c["lng"] <= LNG_MAX)
                for campo in ("direccion", "direccion_aproximada", "localidad", "horario", "telefono"):
                    self.assertIn(campo, c)

    def test_hay_centros_de_los_tres_tipos(self):
        tipos = {c["tipo"] for c in self.client.get("/api/centros").json}
        self.assertEqual(tipos, set(TIPOS_CENTRO))

    def test_la_carga_inicial_no_duplica(self):
        with app.app_context():
            cargar_centros_iniciales()
            cargar_centros_iniciales()
            self.assertEqual(HealthCenter.query.count(), 53)

    def test_la_carga_inicial_no_pisa_correcciones_del_equipo(self):
        with app.app_context():
            centro = HealthCenter.query.filter_by(nombre="Hospital Español").first()
            centro.horario = "Guardia 24 horas"
            db.session.commit()
            cargar_centros_iniciales()
            self.assertEqual(
                HealthCenter.query.filter_by(nombre="Hospital Español").first().horario, "Guardia 24 horas"
            )


if __name__ == "__main__":
    unittest.main()
