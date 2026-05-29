-- Migration: 002_create_tasks
-- Creates the tasks table with ENUMs for status and priority.
-- Run AFTER 001_create_users.sql

-- Custom ENUM types

DO $$ BEGIN
    CREATE TYPE task_status   AS ENUM ('todo', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tasks table

CREATE TABLE IF NOT EXISTS tasks (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT         NOT NULL CHECK (char_length(title) >= 1),
    description TEXT         NOT NULL DEFAULT '',
    status      task_status  NOT NULL DEFAULT 'todo',
    priority    task_priority NOT NULL DEFAULT 'medium',
    due_date    DATE,
    created_by  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE  tasks IS 'Task records with status lifecycle and user assignment.';
COMMENT ON COLUMN tasks.status      IS 'Lifecycle status: todo - in_progress - completed';
COMMENT ON COLUMN tasks.priority    IS 'Urgency level: low | medium | high';
COMMENT ON COLUMN tasks.created_by  IS 'FK to users - the task creator.';
COMMENT ON COLUMN tasks.assigned_to IS 'FK to users - the current assignee. Nullable.';
