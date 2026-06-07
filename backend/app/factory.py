import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

def create_app() -> Flask:
    app = Flask(__name__)
    frontend_url_env = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    # Support comma-separated origins and strip trailing slashes to prevent CORS mismatch issues
    origins = [url.strip().rstrip("/") for url in frontend_url_env.split(",") if url.strip()]
    if not origins:
        origins = ["http://localhost:3000"]

    CORS(
        app,
        origins=origins,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # ── Centralized error handlers ──────────────────────────────
    @app.errorhandler(400)
    def bad_request(exc):
        return jsonify({"error": str(exc.description)}), 400

    @app.errorhandler(403)
    def forbidden(exc):
        return jsonify({"error": str(exc.description)}), 403

    @app.errorhandler(404)
    def not_found(exc):
        return jsonify({"error": str(exc.description)}), 404

    @app.errorhandler(Exception)
    def handle_exception(exc):
        logger.exception("Unhandled error: %s", exc)
        return jsonify({"error": "Internal server error"}), 500

    # ── Register routes ─────────────────────────────────────────
    from app.routes.auth import register_auth_routes
    from app.routes.tasks import register_task_routes
    from app.routes.users import register_users_routes

    register_auth_routes(app)
    register_task_routes(app)
    register_users_routes(app)

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "hairdrama-task-manager-api"}

    return app