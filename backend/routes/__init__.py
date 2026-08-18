from .patients import patients_bp
from .bp import bp_bp
from .auth import auth_bp
from .symptoms import symptoms_bp
from .health import health_bp
from .nurses import nurses_bp
from .weights import weights_bp


def register_routes(app):
    app.register_blueprint(patients_bp)
    app.register_blueprint(bp_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(symptoms_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(nurses_bp)
    app.register_blueprint(weights_bp)
