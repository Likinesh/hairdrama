import os
import html
import logging
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

APP_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",")[0].strip().rstrip("/")

def _update_email_status(task_id: str, status: str) -> None:
    """Update the email_notification_status column on a task."""
    try:
        from app.db import get_supabase
        sb = get_supabase()
        sb.table("tasks").update({"email_notification_status": status}).eq("id", task_id).execute()
        logger.info("Email status for task %s set to '%s'", task_id, status)
    except Exception as exc:
        logger.warning("Failed to update email status for task %s: %s", task_id, exc)

def _build_service(access_token: str, refresh_token: str) -> tuple:
    """Build an authorised Gmail API service from stored OAuth tokens.

    Returns (service, credentials) so the caller can check if the token was refreshed.
    """
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
        scopes=["https://www.googleapis.com/auth/gmail.send"],
    )
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    return service, creds

def _persist_refreshed_token(creds: Credentials, original_token: str, user_id: str) -> None:
    """If the access token was refreshed, save the new one back to the database."""
    if creds.token and creds.token != original_token:
        try:
            from app.db import get_supabase
            sb = get_supabase()
            sb.table("users").update({"access_token": creds.token}).eq("id", user_id).execute()
            logger.info("Persisted refreshed access token for user %s", user_id)
        except Exception as exc:
            logger.warning("Failed to persist refreshed token: %s", exc)

def _make_message(sender: str, to: str, subject: str, html_body: str) -> dict:
    """Encode an email as a base64url Gmail API message dict."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    return {"raw": raw}

def _send(service, message: dict) -> None:
    service.users().messages().send(userId="me", body=message).execute()

def _esc(value: str) -> str:
    """Escape user-supplied text for safe HTML insertion."""
    return html.escape(str(value), quote=True)

def _task_assigned_html(task: dict[str, Any], assignee: dict, creator: dict) -> str:
    task_url = f"{APP_URL}/tasks/{task['id']}"
    due = _esc(task.get("due_date") or "No due date")
    priority = _esc((task.get("priority") or "medium").capitalize())
    description = _esc(task.get("description") or "None")
    title = _esc(task["title"])
    assignee_name = _esc(assignee.get("name", "there"))
    creator_name = _esc(creator.get("name", "Unknown"))
    return f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#18181b;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:#18181b;padding:32px 40px;">
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">New Task Assigned</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="margin:0 0 8px 0;color:#71717a;">Hi {assignee_name},</p>
        <p style="margin:0 0 24px 0;">You have been assigned a new task:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:10px 0;color:#71717a;width:120px;">Title</td><td style="padding:10px 0;font-weight:600;">{title}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Description</td><td style="padding:10px 0;">{description}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Priority</td><td style="padding:10px 0;">{priority}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Due Date</td><td style="padding:10px 0;">{due}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Assigned by</td><td style="padding:10px 0;">{creator_name}</td></tr>
        </table>
        <a href="{task_url}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">View Task</a>
      </div>
      <div style="padding:16px 40px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px;">Hairdrama Task Manager</div>
    </div>
    """

def _task_completed_html(task: dict[str, Any], creator: dict, assignee: dict, completed_at: str) -> str:
    task_url = f"{APP_URL}/tasks/{task['id']}"
    title = _esc(task["title"])
    creator_name = _esc(creator.get("name", "there"))
    assignee_name = _esc(assignee.get("name", "Unknown"))
    completed_at_esc = _esc(completed_at)
    return f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#18181b;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:#18181b;padding:32px 40px;">
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Task Completed</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="margin:0 0 8px 0;color:#71717a;">Hi {creator_name},</p>
        <p style="margin:0 0 24px 0;">The following task has been marked as completed:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:10px 0;color:#71717a;width:140px;">Title</td><td style="padding:10px 0;font-weight:600;">{title}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Completed by</td><td style="padding:10px 0;">{assignee_name}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Completed on</td><td style="padding:10px 0;">{completed_at_esc}</td></tr>
        </table>
        <a href="{task_url}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">View Task</a>
      </div>
      <div style="padding:16px 40px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px;">Hairdrama Task Manager</div>
    </div>
    """

def send_task_assigned_email(
    task: dict[str, Any],
    assignee: dict,
    creator: dict,
    creator_access_token: str,
    creator_refresh_token: str,
    sender_user_id: str = "",
) -> None:
    """Send 'task assigned' email to the assignee. Errors are logged, not raised."""
    task_id = task.get("id", "")
    try:
        service, creds = _build_service(creator_access_token, creator_refresh_token)
        msg = _make_message(
            sender=creator.get("email", "noreply@hairdrama.app"),
            to=assignee["email"],
            subject=f"New Task Assigned: {task['title']}",
            html_body=_task_assigned_html(task, assignee, creator),
        )
        _send(service, msg)
        logger.info("Task-assigned email sent to %s", assignee["email"])
        _update_email_status(task_id, "sent")
        if sender_user_id:
            _persist_refreshed_token(creds, creator_access_token, sender_user_id)
    except HttpError as exc:
        logger.error("Gmail API error sending task-assigned email: %s", exc)
        _update_email_status(task_id, "failed")
    except Exception as exc:
        logger.error("Unexpected error sending task-assigned email: %s", exc)
        _update_email_status(task_id, "failed")

def send_task_completed_email(
    task: dict[str, Any],
    creator: dict,
    assignee: dict,
    completed_at: str,
    assignee_access_token: str,
    assignee_refresh_token: str,
    sender_user_id: str = "",
) -> None:
    """Send 'task completed' email to the creator. Errors are logged, not raised."""
    task_id = task.get("id", "")
    try:
        service, creds = _build_service(assignee_access_token, assignee_refresh_token)
        msg = _make_message(
            sender=assignee.get("email", "noreply@hairdrama.app"),
            to=creator["email"],
            subject=f"Task Completed: {task['title']}",
            html_body=_task_completed_html(task, creator, assignee, completed_at),
        )
        _send(service, msg)
        logger.info("Task-completed email sent to %s", creator["email"])
        _update_email_status(task_id, "sent")
        if sender_user_id:
            _persist_refreshed_token(creds, assignee_access_token, sender_user_id)
    except HttpError as exc:
        logger.error("Gmail API error sending task-completed email: %s", exc)
        _update_email_status(task_id, "failed")
    except Exception as exc:
        logger.error("Unexpected error sending task-completed email: %s", exc)
        _update_email_status(task_id, "failed")