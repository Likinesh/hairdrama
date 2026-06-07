import os
import logging
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any, Callable

import jwt
from flask import request, jsonify, g

logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

def _get_secret() -> str:
    secret = os.environ.get("JWT_SECRET", "")
    if not secret:
        raise RuntimeError("JWT_SECRET environment variable is not set")
    return secret

def sign_token(user_id: str, email: str, name: str, avatar_url: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "avatar_url": avatar_url,
        "iat": now,
        "exp": now + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, _get_secret(), algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, _get_secret(), algorithms=[JWT_ALGORITHM])

def require_auth(f: Callable) -> Callable:
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("auth_token")
        if not token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"error": "Missing or invalid authentication token"}), 401

        try:
            claims = verify_token(token)
            g.user = claims
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError as exc:
            logger.warning("Invalid JWT: %s", exc)
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated