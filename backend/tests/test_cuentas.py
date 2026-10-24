"""Pruebas de contraseñas: alta con contraseña por mail, login, "Olvidé mi
contraseña" y cambio de contraseña.

Correr desde backend/:  python -m unittest discover tests
El envío de mails está simulado: no se manda ningún mail de verdad.
"""
import os
import re
import tempfile
import unittest
from unittest import mock

_tmp = tempfile.mkdtemp()
os.environ.setdefault("DATABASE_URL", f"sqlite:///{os.path.join(_tmp, 'test.db')}")
os.environ.setdefault("SECRET_KEY", "test")

import credenciales  # noqa: E402
from app import app  # noqa: E402  (tiene que importarse después de fijar la base)
from extensions import db  # noqa: E402
from models import Patient  # noqa: E402

FORMATO = re.compile(r"^[A-Z][a-z]+\d{4}$")


class CuentasTest(unittest.TestCase):
    def setUp(self):
        self.enfermera = app.test_client()
        with self.enfermera.session_transaction() as s:
            s["nurse_id"] = 1
        self.anonima = app.test_client()
        self.mails = []
        parche = mock.patch("mailer.enviar_mail", side_effect=lambda *a: self.mails.append(a) or True)
        parche.start()
        self.addCleanup(parche.stop)

    def alta(self, dni, email):
        return self.enfermera.post(
            "/api/patients", json={"nombre": "Ana", "apellido": "Prueba", "dni": dni, "email": email}
        ).get_json()

    def login(self, email, password):
        return self.anonima.post("/api/login", json={"email": email, "password": password})

    def test_al_registrar_genera_una_contrasena_y_la_manda_por_mail(self):
        datos = self.alta("50000001", "a1@prueba.com")
        contrasena = datos["contrasena_provisoria"]
        self.assertRegex(contrasena, FORMATO)
        self.assertTrue(datos["mail_enviado"])
        destinatario, asunto, cuerpo = self.mails[-1]
        self.assertEqual(destinatario, "a1@prueba.com")
        self.assertIn(contrasena, cuerpo)
        self.assertIn("a1@prueba.com", cuerpo)

    def test_la_contrasena_se_guarda_cifrada(self):
        contrasena = self.alta("50000002", "a2@prueba.com")["contrasena_provisoria"]
        with app.app_context():
            guardada = Patient.query.filter_by(dni="50000002").first().password_hash
        self.assertTrue(guardada)
        self.assertNotIn(contrasena, guardada)

    def test_entra_con_la_contrasena_y_ya_no_con_el_dni(self):
        contrasena = self.alta("50000003", "a3@prueba.com")["contrasena_provisoria"]
        self.assertEqual(self.login("a3@prueba.com", contrasena).status_code, 200)
        self.assertEqual(self.login("a3@prueba.com", "50000003").status_code, 401)
        self.assertEqual(self.login("a3@prueba.com", "otra").status_code, 401)

    def test_una_cuenta_vieja_sin_contrasena_sigue_entrando_con_el_dni(self):
        with app.app_context():
            db.session.add(Patient(nombre="Vieja", apellido="X", dni="50000004", email="a4@prueba.com"))
            db.session.commit()
        self.assertEqual(self.login("a4@prueba.com", "50000004").status_code, 200)

    def test_si_el_mail_falla_igual_se_registra_y_la_enfermera_ve_la_contrasena(self):
        with mock.patch("mailer.enviar_mail", return_value=False):
            datos = self.alta("50000005", "a5@prueba.com")
        self.assertFalse(datos["mail_enviado"])
        self.assertEqual(self.login("a5@prueba.com", datos["contrasena_provisoria"]).status_code, 200)

    def test_olvide_mi_contrasena_manda_una_nueva(self):
        vieja = self.alta("50000006", "a6@prueba.com")["contrasena_provisoria"]
        with mock.patch("mailer.configurado", return_value=True):
            r = self.anonima.post("/api/recuperar-contrasena", json={"tipo": "paciente", "email": "a6@prueba.com"})
        self.assertEqual(r.status_code, 200)
        nueva = re.search(r"Contraseña nueva: (\S+)", self.mails[-1][2]).group(1)
        self.assertEqual(self.login("a6@prueba.com", nueva).status_code, 200)
        self.assertEqual(self.login("a6@prueba.com", vieja).status_code, 401)

    def test_olvide_mi_contrasena_no_revela_si_el_email_existe(self):
        with mock.patch("mailer.configurado", return_value=True):
            r = self.anonima.post("/api/recuperar-contrasena", json={"tipo": "paciente", "email": "nadie@prueba.com"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.mails, [])

    def test_si_el_mail_de_recuperacion_falla_no_cambia_la_contrasena(self):
        vieja = self.alta("50000007", "a7@prueba.com")["contrasena_provisoria"]
        with mock.patch("mailer.configurado", return_value=True), mock.patch("mailer.enviar_mail", return_value=False):
            r = self.anonima.post("/api/recuperar-contrasena", json={"tipo": "paciente", "email": "a7@prueba.com"})
        self.assertEqual(r.status_code, 503)
        self.assertEqual(self.login("a7@prueba.com", vieja).status_code, 200)

    def test_cambiar_la_contrasena_es_opcional_y_pide_la_actual(self):
        actual = self.alta("50000008", "a8@prueba.com")["contrasena_provisoria"]
        cambio = {"tipo": "paciente", "email": "a8@prueba.com", "actual": "mal", "nueva": "MiClave2026"}
        self.assertEqual(self.anonima.post("/api/cambiar-contrasena", json=cambio).status_code, 401)
        cambio["actual"] = actual
        cambio["nueva"] = "corta"
        self.assertEqual(self.anonima.post("/api/cambiar-contrasena", json=cambio).status_code, 400)
        cambio["nueva"] = "MiClave2026"
        self.assertEqual(self.anonima.post("/api/cambiar-contrasena", json=cambio).status_code, 200)
        self.assertEqual(self.login("a8@prueba.com", "MiClave2026").status_code, 200)
        self.assertEqual(self.login("a8@prueba.com", actual).status_code, 401)

    def test_enfermeros_nuevos_tambien_reciben_contrasena(self):
        datos = self.enfermera.post(
            "/api/nurses", json={"nombre": "Laura", "apellido": "X", "dni": "50000009", "email": "e9@prueba.com"}
        ).get_json()
        contrasena = datos["contrasena_provisoria"]
        r = self.anonima.post("/api/nurse/login", json={"email": "e9@prueba.com", "password": contrasena})
        self.assertEqual(r.status_code, 200)

    def test_la_enfermera_genera_una_contrasena_nueva_desde_usuarios(self):
        with app.app_context():
            db.session.add(Patient(nombre="Vieja", apellido="X", dni="50000010", email="a10@prueba.com"))
            db.session.commit()
            pid = Patient.query.filter_by(dni="50000010").first().id
        self.assertEqual(self.anonima.post(f"/api/patients/{pid}/nueva-contrasena").status_code, 401)
        datos = self.enfermera.post(f"/api/patients/{pid}/nueva-contrasena").get_json()
        self.assertIn(datos["contrasena_provisoria"], self.mails[-1][2])
        self.assertEqual(self.login("a10@prueba.com", datos["contrasena_provisoria"]).status_code, 200)
        self.assertEqual(self.login("a10@prueba.com", "50000010").status_code, 401)

    def test_las_contrasenas_generadas_son_faciles_y_distintas(self):
        generadas = {credenciales.generar_contrasena() for _ in range(50)}
        self.assertTrue(all(FORMATO.match(c) for c in generadas))
        self.assertGreater(len(generadas), 40)


if __name__ == "__main__":
    unittest.main()
