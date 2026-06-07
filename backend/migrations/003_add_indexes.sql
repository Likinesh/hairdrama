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

-- NOTE: users.google_id and users.email already have UNIQUE constraints,
-- which automatically create indexes in PostgreSQL. No extra indexes needed.
