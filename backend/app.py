"""
GESTAR+ - Backend API
Flask + SQLAlchemy (MySQL)
"""
import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from extensions import db
from routes import register_routes

load_dotenv()

# Railway (y otros PaaS) exponen la MySQL como una única URL de conexión;
# en local seguimos armándola a partir de las variables sueltas.
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("MYSQL_URL")

DB_HOST = os.environ.get("DB_HOST", os.environ.get("MYSQLHOST", "127.0.0.1"))
DB_PORT = os.environ.get("DB_PORT", os.environ.get("MYSQLPORT", "3306"))
DB_USER = os.environ.get("DB_USER", os.environ.get("MYSQLUSER", "root"))
DB_PASSWORD = os.environ.get("DB_PASSWORD", os.environ.get("MYSQLPASSWORD", ""))
DB_NAME = os.environ.get("DB_NAME", os.environ.get("MYSQLDATABASE", "gestar"))

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
    sqlalchemy_uri = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
else:
    sqlalchemy_uri = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config["SQLALCHEMY_DATABASE_URI"] = sqlalchemy_uri
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
register_routes(app)

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=not IS_PRODUCTION, port=int(os.environ.get("PORT", 5000)))
