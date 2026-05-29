-- Migration: 001_create_users
-- Creates the users table for Google OAuth profile storage.
-- Run this in your Supabase SQL editor or via the Supabase CLI.

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id   TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL DEFAULT '',
    avatar_url  TEXT NOT NULL DEFAULT '',
    -- OAuth tokens (stored to send emails on behalf of user via Gmail API)
    access_token   TEXT NOT NULL DEFAULT '',
    refresh_token  TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - service role key bypasses RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE  users IS 'Registered users authenticated via Google OAuth.';
COMMENT ON COLUMN users.google_id       IS 'Google sub claim - unique Google account ID.';
COMMENT ON COLUMN users.access_token    IS 'Latest Google OAuth access token (refreshable).';
COMMENT ON COLUMN users.refresh_token   IS 'Google OAuth refresh token for Gmail API.';