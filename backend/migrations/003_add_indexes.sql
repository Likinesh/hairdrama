-- Migration: 003_add_indexes
-- Performance indexes for common query patterns.
-- Run AFTER 002_create_tasks.sql

-- Tasks listed by creator
CREATE INDEX IF NOT EXISTS idx_tasks_created_by
    ON tasks (created_by);

-- Tasks assigned to a user
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
    ON tasks (assigned_to);

-- Tasks filtered by status
CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON tasks (status);

-- Tasks filtered by priority
CREATE INDEX IF NOT EXISTS idx_tasks_priority
    ON tasks (priority);

-- Most-recent tasks first
CREATE INDEX IF NOT EXISTS idx_tasks_created_at
    ON tasks (created_at DESC);

-- Users looked up by google_id during OAuth sync
CREATE INDEX IF NOT EXISTS idx_users_google_id
    ON users (google_id);

-- Users looked up by email
CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email);
