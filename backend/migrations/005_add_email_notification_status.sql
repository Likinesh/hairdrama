DO $$ BEGIN
    CREATE TYPE email_notification_status AS ENUM ('not_required', 'pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS email_notification_status email_notification_status NOT NULL DEFAULT 'not_required';

COMMENT ON COLUMN tasks.email_notification_status IS 'Tracks whether the email notification (assignment/completion) was sent successfully.';
