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

DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_PORT = os.environ.get("DB_PORT", "3306")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", "gestar")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")

# supports_credentials + origin explícito (no "*") son necesarios para que la
# cookie de sesión del login de enfermeros viaje entre localhost:5173 y :5000.
CORS(app, supports_credentials=True, origins=[FRONTEND_ORIGIN])

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
register_routes(app)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
