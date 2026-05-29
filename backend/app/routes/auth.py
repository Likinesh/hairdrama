import logging
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify, g
from app.db import get_supabase
from app.services.auth_service import sign_token, require_auth

logger = logging.getLogger(__name__)

def register_auth_routes(app: Flask) -> None:
    @app.post("/auth/sync")
    def sync_user():
        """
        Called by the Next.js frontend after Google OAuth completes.
        Upserts the user in Supabase and returns a signed app JWT.

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
            logger.warning("Cannot connect to Supabase (%s), using fallback auth", exc)
            import uuid
            fallback_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"google:{google_id}"))
            token = sign_token(
                user_id=fallback_id,
                email=email,
                name=name,
                avatar_url=avatar_url,
            )
            return jsonify({"token": token, "user": {
                "id": fallback_id,
                "email": email,
                "name": name,
                "avatar_url": avatar_url,
            }})

        try:
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
                update_payload: dict = {
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

        except Exception as exc:
            logger.exception("Error syncing user: %s", exc)
            return jsonify({"error": "Internal server error"}), 500

    @app.get("/auth/me")
    @require_auth
    def me():
        """Return the current user's profile from JWT claims."""
        return jsonify({
            "id": g.user["sub"],
            "email": g.user["email"],
            "name": g.user["name"],
            "avatar_url": g.user["avatar_url"],
        })

    @app.post("/auth/logout")
    def logout():
        """
        Stateless logout: clear the cookie.
        """
        response = jsonify({"message": "Logged out successfully"})
        response.delete_cookie("auth_token")
        return response
