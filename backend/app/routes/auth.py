import logging
from flask import request, jsonify, g
from app.db import get_supabase
from app.services.auth_service import sign_token, require_auth

logger = logging.getLogger(__name__)

def register_auth_routes(app):
    @app.post("/auth/sync")
    def sync_user():
        """
        Expected JSON body:
            {
                "google_id": "...",
                "email": "...",
                "name": "...",
                "avatar_url": "...",
                "access_token": "...",      # Google OAuth access token
                "refresh_token": "..."      # Google OAuth refresh token (first sign-in only)
            }
        """
        data = request.get_json(silent=True) or {}
        required = ["google_id", "email"]
        for field in required:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        google_id = data["google_id"]
        email = data["email"]
        name = data.get("name", "")
        avatar_url = data.get("avatar_url", "")
        access_token = data.get("access_token", "")
        refresh_token = data.get("refresh_token", "")

        try:
            sb = get_supabase()
        except Exception as exc:
            logger.error("Cannot connect to Supabase: %s", exc)
            return jsonify({"error": "Database unavailable"}), 503

        # Check if user exists
        existing_data = None
        try:
            existing = (
                sb.table("users")
                .select("*")
                .eq("google_id", google_id)
                .maybe_single()
                .execute()
            )
            existing_data = existing.data
        except Exception:
            # maybe_single can raise on 204 (no rows); treat as "not found"
            existing_data = None

        if existing_data:
            # Update tokens and profile
            update_payload = {
                "name": name,
                "avatar_url": avatar_url,
                "access_token": access_token,
            }
            if refresh_token:
                update_payload["refresh_token"] = refresh_token

            sb.table("users").update(update_payload).eq("google_id", google_id).execute()
            user = {**existing_data, **update_payload}
        else:
            # Insert new user
            insert_payload = {
                "google_id": google_id,
                "email": email,
                "name": name,
                "avatar_url": avatar_url,
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
            result = sb.table("users").insert(insert_payload).execute()
            user = result.data[0]

        token = sign_token(
            user_id=user["id"],
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        return jsonify({"token": token, "user": {
            "id": user["id"],
            "email": email,
            "name": name,
            "avatar_url": avatar_url,
        }})

    @app.get("/auth/me")
    @require_auth
    def me():
        return jsonify({
            "id": g.user["sub"],
            "email": g.user["email"],
            "name": g.user["name"],
            "avatar_url": g.user["avatar_url"],
        })

    @app.post("/auth/logout")
    def logout():
        response = jsonify({"message": "Logged out successfully"})
        response.delete_cookie("auth_token")
        return response