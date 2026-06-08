import os
import logging
from supabase import create_client

_logger = logging.getLogger(__name__)
_client = None

def get_supabase():
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY must be set"
            )
        if key.startswith("sb_publishable_"):
            _logger.warning(
                "Using a publishable Supabase key. "
                "For production, use the service role key from Supabase Dashboard > Project Settings > API."
            )
        _client = create_client(url, key)
    return _client