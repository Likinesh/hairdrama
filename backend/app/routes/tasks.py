import logging
import re
import threading
from flask import request, jsonify, g, abort
from app.db import get_supabase
from app.services.auth_service import require_auth
from app.services.email_service import (
    send_task_assigned_email,
    send_task_completed_email,
)

logger = logging.getLogger(__name__)

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)

def _validate_uuid(value):
    if not _UUID_RE.match(value):
        abort(400, f"Invalid UUID: {value}")
    return value


def _get_user_tokens(user_id):
    sb = get_supabase()
    result = (
        sb.table("users")
        .select("access_token,refresh_token")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        return "", ""
    return result.data.get("access_token", ""), result.data.get("refresh_token", "")

def _get_user(user_id):
    sb = get_supabase()
    result = (
        sb.table("users")
        .select("id,email,name,avatar_url")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    return result.data


def _send_assigned_email_async(task, assignee, creator, user_id):
    """Fire-and-forget email in a background thread."""
    at, rt = _get_user_tokens(user_id)
    if at:
        sb = get_supabase()
        sb.table("tasks").update({"email_notification_status": "pending"}).eq("id", task["id"]).execute()
        threading.Thread(
            target=send_task_assigned_email,
            args=(task, assignee, creator, at, rt, user_id),
            daemon=True,
        ).start()
    else:
        logger.warning("Could not send assigned email for task %s: missing access token for user %s", task.get("id"), user_id)


def _send_completed_email_async(task, creator, assignee, completed_at, user_id):
    """Fire-and-forget email in a background thread."""
    at, rt = _get_user_tokens(user_id)
    if at:
        sb = get_supabase()
        sb.table("tasks").update({"email_notification_status": "pending"}).eq("id", task["id"]).execute()
        threading.Thread(
            target=send_task_completed_email,
            args=(task, creator, assignee, completed_at, at, rt, user_id),
            daemon=True,
        ).start()
    else:
        logger.warning("Could not send completed email for task %s: missing access token for user %s", task.get("id"), user_id)


def register_task_routes(app):
    @app.get("/api/tasks")
    @require_auth
    def list_tasks():
        """
        List tasks with optional filters.
        Query params:
            filter: all | mine | created   (default: all)
            status: todo | in_progress | completed
        """
        user_id = g.user["sub"]
        filter_type = request.args.get("filter", "all")
        status_filter = request.args.get("status")

        sb = get_supabase()
        query = sb.table("tasks").select(
            "*, creator:users!tasks_created_by_fkey(id,name,email,avatar_url), "
            "assignee:users!tasks_assigned_to_fkey(id,name,email,avatar_url)"
        )

        if filter_type == "mine":
            query = query.eq("assigned_to", user_id)
        elif filter_type == "created":
            query = query.eq("created_by", user_id)

        if status_filter:
            query = query.eq("status", status_filter)

        query = query.order("created_at", desc=True)
        result = query.execute()
        return jsonify(result.data)

    @app.post("/api/tasks")
    @require_auth
    def create_task():
        """Create a new task. Sends assignment email if assigned_to is provided."""
        user_id = g.user["sub"]
        data = request.get_json(silent=True) or {}

        if not data.get("title"):
            abort(400, "Title is required")

        priority = data.get("priority", "medium")
        if priority not in ("low", "medium", "high"):
            abort(400, "Priority must be low, medium, or high")

        payload = {
            "title": data["title"].strip(),
            "description": data.get("description", ""),
            "status": "todo",
            "priority": priority,
            "due_date": data.get("due_date"),
            "created_by": user_id,
            "assigned_to": data.get("assigned_to"),
        }

        sb = get_supabase()
        result = sb.table("tasks").insert(payload).execute()
        task = result.data[0]

        if task.get("assigned_to") and task["assigned_to"] != user_id:
            assignee = _get_user(task["assigned_to"])
            creator = _get_user(user_id)
            if assignee and creator:
                _send_assigned_email_async(task, assignee, creator, user_id)

        return jsonify(task), 201

    @app.get("/api/tasks/<task_id>")
    @require_auth
    def get_task(task_id):
        """Fetch a single task with creator and assignee details."""
        _validate_uuid(task_id)
        sb = get_supabase()
        result = (
            sb.table("tasks")
            .select(
                "*, creator:users!tasks_created_by_fkey(id,name,email,avatar_url), "
                "assignee:users!tasks_assigned_to_fkey(id,name,email,avatar_url)"
            )
            .eq("id", task_id)
            .maybe_single()
            .execute()
        )
        if not result.data:
            abort(404, "Task not found")
        return jsonify(result.data)

    @app.put("/api/tasks/<task_id>")
    @require_auth
    def update_task(task_id):
        """Full task update: creator only."""
        _validate_uuid(task_id)
        user_id = g.user["sub"]
        data = request.get_json(silent=True) or {}

        sb = get_supabase()
        existing = (
            sb.table("tasks").select("*").eq("id", task_id).maybe_single().execute()
        )
        if not existing.data:
            abort(404, "Task not found")
        if existing.data["created_by"] != user_id:
            abort(403, "Only the task creator can edit this task")

        old_assignee = existing.data.get("assigned_to")
        allowed = ["title", "description", "priority", "due_date", "assigned_to", "status"]
        update_payload = {k: v for k, v in data.items() if k in allowed}

        result = sb.table("tasks").update(update_payload).eq("id", task_id).execute()
        task = result.data[0]

        new_assignee_id = task.get("assigned_to")
        if new_assignee_id and new_assignee_id != old_assignee and new_assignee_id != user_id:
            assignee = _get_user(new_assignee_id)
            creator = _get_user(user_id)
            if assignee and creator:
                _send_assigned_email_async(task, assignee, creator, user_id)

        return jsonify(task)

    @app.delete("/api/tasks/<task_id>")
    @require_auth
    def delete_task(task_id):
        """Delete a task: creator only."""
        _validate_uuid(task_id)
        user_id = g.user["sub"]

        sb = get_supabase()
        existing = (
            sb.table("tasks").select("created_by").eq("id", task_id).maybe_single().execute()
        )
        if not existing.data:
            abort(404, "Task not found")
        if existing.data["created_by"] != user_id:
            abort(403, "Only the task creator can delete this task")

        sb.table("tasks").delete().eq("id", task_id).execute()
        return jsonify({"message": "Task deleted successfully"})

    @app.patch("/api/tasks/<task_id>/status")
    @require_auth
    def update_status(task_id):
        """Change the status of a task. Triggers completed email if applicable."""
        _validate_uuid(task_id)
        user_id = g.user["sub"]
        data = request.get_json(silent=True) or {}
        new_status = data.get("status")

        if new_status not in ("todo", "in_progress", "completed"):
            abort(400, "status must be todo, in_progress, or completed")

        sb = get_supabase()
        existing = (
            sb.table("tasks").select("*").eq("id", task_id).maybe_single().execute()
        )
        if not existing.data:
            abort(404, "Task not found")

        task_data = existing.data
        if task_data["created_by"] != user_id and task_data.get("assigned_to") != user_id:
            abort(403, "Only the creator or assignee can change status")

        result = sb.table("tasks").update({"status": new_status}).eq("id", task_id).execute()
        task = result.data[0]

        if new_status == "completed" and task_data.get("assigned_to") == user_id:
            creator_id = task_data["created_by"]
            if creator_id != user_id:
                creator = _get_user(creator_id)
                assignee = _get_user(user_id)
                if creator and assignee:
                    _send_completed_email_async(
                        task, creator, assignee, task.get("updated_at", ""), user_id
                    )

        return jsonify(task)

    @app.patch("/api/tasks/<task_id>/assign")
    @require_auth
    def assign_task(task_id):
        """Reassign a task: creator only. Pass assigned_to: null to unassign."""
        _validate_uuid(task_id)
        user_id = g.user["sub"]
        data = request.get_json(silent=True) or {}
        new_assignee_id = data.get("assigned_to")

        sb = get_supabase()
        existing = (
            sb.table("tasks").select("*").eq("id", task_id).maybe_single().execute()
        )
        if not existing.data:
            abort(404, "Task not found")
        if existing.data["created_by"] != user_id:
            abort(403, "Only the task creator can reassign this task")

        old_assignee = existing.data.get("assigned_to")
        result = sb.table("tasks").update({
            "assigned_to": new_assignee_id,
        }).eq("id", task_id).execute()
        task = result.data[0]

        if new_assignee_id and new_assignee_id != old_assignee and new_assignee_id != user_id:
            assignee = _get_user(new_assignee_id)
            creator = _get_user(user_id)
            if assignee and creator:
                _send_assigned_email_async(task, assignee, creator, user_id)

        return jsonify(task)