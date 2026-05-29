import logging
from flask import Flask, jsonify
from app.db import get_supabase
from app.services.auth_service import require_auth

logger = logging.getLogger(__name__)

def register_users_routes(app: Flask) -> None:
    @app.get("/api/users")
    @require_auth
    def list_users():
        """Return all registered users (id, name, email, avatar_url) for the assignee picker."""
        try:
            sb = get_supabase()
            result = (
                sb.table("users")
                .select("id,name,email,avatar_url")
                .order("name")
                .execute()
            )
            return jsonify(result.data)
        except Exception as exc:
            logger.exception("Error listing users: %s", exc)
            return jsonify({"error": "Failed to fetch users"}), 500