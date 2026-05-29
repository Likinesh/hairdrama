import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

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