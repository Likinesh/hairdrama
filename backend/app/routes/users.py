import logging
from flask import jsonify
from app.db import get_supabase
from app.services.auth_service import require_auth

logger = logging.getLogger(__name__)

def register_users_routes(app):
    @app.get("/api/users")
    @require_auth
    def list_users():
        """Return all registered users (id, name, email, avatar_url) for the assignee picker."""
        sb = get_supabase()
        result = (
            sb.table("users")
            .select("id,name,email,avatar_url")
            .order("name")
            .execute()
        )
        return jsonify(result.data)