import os
import logging
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

APP_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

def _build_service(access_token: str, refresh_token: str):
    """Build an authorised Gmail API service from stored OAuth tokens."""
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
        scopes=["https://www.googleapis.com/auth/gmail.send"],
    )
    return build("gmail", "v1", credentials=creds, cache_discovery=False)

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

def _task_assigned_html(task: dict[str, Any], assignee: dict, creator: dict) -> str:
    task_url = f"{APP_URL}/tasks/{task['id']}"
    due = task.get("due_date") or "No due date"
    priority = (task.get("priority") or "medium").capitalize()
    description = task.get("description") or "None"
    return f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#18181b;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:#18181b;padding:32px 40px;">
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">New Task Assigned</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="margin:0 0 8px 0;color:#71717a;">Hi {assignee.get('name','there')},</p>
        <p style="margin:0 0 24px 0;">You have been assigned a new task:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:10px 0;color:#71717a;width:120px;">Title</td><td style="padding:10px 0;font-weight:600;">{task['title']}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Description</td><td style="padding:10px 0;">{description}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Priority</td><td style="padding:10px 0;">{priority}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Due Date</td><td style="padding:10px 0;">{due}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Assigned by</td><td style="padding:10px 0;">{creator.get('name','Unknown')}</td></tr>
        </table>
        <a href="{task_url}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">View Task</a>
      </div>
      <div style="padding:16px 40px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px;">Hairdrama Task Manager</div>
    </div>
    """

def _task_completed_html(task: dict[str, Any], creator: dict, assignee: dict, completed_at: str) -> str:
    task_url = f"{APP_URL}/tasks/{task['id']}"
    return f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#18181b;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:#18181b;padding:32px 40px;">
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Task Completed</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="margin:0 0 8px 0;color:#71717a;">Hi {creator.get('name','there')},</p>
        <p style="margin:0 0 24px 0;">The following task has been marked as completed:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:10px 0;color:#71717a;width:140px;">Title</td><td style="padding:10px 0;font-weight:600;">{task['title']}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Completed by</td><td style="padding:10px 0;">{assignee.get('name','Unknown')}</td></tr>
          <tr style="border-top:1px solid #e4e4e7;"><td style="padding:10px 0;color:#71717a;">Completed on</td><td style="padding:10px 0;">{completed_at}</td></tr>
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
) -> None:
    """Send 'task assigned' email to the assignee. Errors are logged, not raised."""
    try:
        service = _build_service(creator_access_token, creator_refresh_token)
        html = _task_assigned_html(task, assignee, creator)
        msg = _make_message(
            sender=creator.get("email", "noreply@hairdrama.app"),
            to=assignee["email"],
            subject=f"New Task Assigned: {task['title']}",
            html_body=html,
        )
        _send(service, msg)
        logger.info("Task-assigned email sent to %s", assignee["email"])
    except HttpError as exc:
        logger.error("Gmail API error sending task-assigned email: %s", exc)
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected error sending task-assigned email: %s", exc)

def send_task_completed_email(
    task: dict[str, Any],
    creator: dict,
    assignee: dict,
    completed_at: str,
    assignee_access_token: str,
    assignee_refresh_token: str,
) -> None:
    """Send 'task completed' email to the creator. Errors are logged, not raised."""
    try:
        service = _build_service(assignee_access_token, assignee_refresh_token)
        html = _task_completed_html(task, creator, assignee, completed_at)
        msg = _make_message(
            sender=assignee.get("email", "noreply@hairdrama.app"),
            to=creator["email"],
            subject=f"Task Completed: {task['title']}",
            html_body=html,
        )
        _send(service, msg)
        logger.info("Task-completed email sent to %s", creator["email"])
    except HttpError as exc:
        logger.error("Gmail API error sending task-completed email: %s", exc)
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected error sending task-completed email: %s", exc)