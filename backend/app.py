"""
GESTAR+ - Backend API
Flask + SQLAlchemy (Postgres en producción, SQLite en desarrollo local)
"""
import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from extensions import db
from routes import register_routes

load_dotenv()

# Render (y otros PaaS) inyectan la URL de Postgres en DATABASE_URL. Sin esa
# variable (desarrollo local) usamos un archivo SQLite, así no hace falta
# tener ningún servidor de base de datos corriendo para levantar el backend.
DATABASE_URL = os.environ.get("DATABASE_URL")

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
IS_PRODUCTION = os.environ.get("FLASK_ENV", "development") == "production"

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")

# supports_credentials + origin explícito (no "*") son necesarios para que la
# cookie de sesión del login de enfermeros viaje entre el frontend y el backend.
CORS(app, supports_credentials=True, origins=[o.strip() for o in FRONTEND_ORIGIN.split(",")])

# En producción el frontend y el backend viven en dominios distintos
# (ej. Vercel + Railway), así que la cookie de sesión necesita SameSite=None
# + Secure para poder viajar entre sitios sobre HTTPS.
app.config["SESSION_COOKIE_SAMESITE"] = "None" if IS_PRODUCTION else "Lax"
app.config["SESSION_COOKIE_SECURE"] = IS_PRODUCTION

if DATABASE_URL:
    # Render entrega el esquema viejo "postgres://"; SQLAlchemy 1.4+ solo
    # acepta "postgresql://".
    sqlalchemy_uri = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    sqlalchemy_uri = "sqlite:///gestar.db"

app.config["SQLALCHEMY_DATABASE_URI"] = sqlalchemy_uri
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
register_routes(app)

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=not IS_PRODUCTION, port=int(os.environ.get("PORT", 5000)))
