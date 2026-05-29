import logging
from datetime import datetime, timezone
from flask import Flask, request, jsonify, g
from app.db import get_supabase
from app.services.auth_service import require_auth
from app.services.email_service import (
    send_task_assigned_email,
    send_task_completed_email,
)

logger = logging.getLogger(__name__)

def _get_user_tokens(user_id: str) -> tuple[str, str]:
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

def _get_user(user_id: str) -> dict | None:
    sb = get_supabase()
    result = (
        sb.table("users")
        .select("id,email,name,avatar_url")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    return result.data

def register_task_routes(app: Flask) -> None:
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

        try:
            result = query.execute()
            return jsonify(result.data)
        except Exception as exc:
            logger.exception("Error listing tasks: %s", exc)
            return jsonify({"error": "Failed to fetch tasks"}), 500

    @app.post("/api/tasks")
    @require_auth
    def create_task():
        """Create a new task. Sends assignment email if assigned_to is provided."""
        user_id = g.user["sub"]
        data = request.get_json(silent=True) or {}

        if not data.get("title"):
            return jsonify({"error": "Title is required"}), 400

        priority = data.get("priority", "medium")
        if priority not in ("low", "medium", "high"):
            return jsonify({"error": "Priority must be low, medium, or high"}), 400

        payload = {
            "title": data["title"].strip(),
            "description": data.get("description", ""),
            "status": "todo",
            "priority": priority,
            "due_date": data.get("due_date"),
            "created_by": user_id,
            "assigned_to": data.get("assigned_to"),
        }
        try:
            sb = get_supabase()
            result = sb.table("tasks").insert(payload).execute()
            task = result.data[0]

            if task.get("assigned_to") and task["assigned_to"] != user_id:
                assignee = _get_user(task["assigned_to"])
                creator = _get_user(user_id)
                if assignee and creator:
                    at, rt = _get_user_tokens(user_id)
                    send_task_assigned_email(task, assignee, creator, at, rt)

            return jsonify(task), 201
        except Exception as exc:
            logger.exception("Error creating task: %s", exc)
            return jsonify({"error": "Failed to create task"}), 500

    @app.get("/api/tasks/<task_id>")
    @require_auth
    def get_task(task_id: str):
        """Fetch a single task with creator and assignee details."""
        try:
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
                return jsonify({"error": "Task not found"}), 404
            return jsonify(result.data)
        except Exception as exc:
            logger.exception("Error fetching task %s: %s", task_id, exc)
            return jsonify({"error": "Failed to fetch task"}), 500

    @app.put("/api/tasks/<task_id>")
    @require_auth
    def update_task(task_id: str):
        """Full task update: creator only."""
        user_id = g.user["sub"]
        data = request.get_json(silent=True) or {}
        try:
            sb = get_supabase()
            existing = (
                sb.table("tasks").select("*").eq("id", task_id).maybe_single().execute()
            )
            if not existing.data:
                return jsonify({"error": "Task not found"}), 404
            if existing.data["created_by"] != user_id:
                return jsonify({"error": "Only the task creator can edit this task"}), 403

            old_assignee = existing.data.get("assigned_to")
            allowed = ["title", "description", "priority", "due_date", "assigned_to", "status"]
            update_payload = {k: v for k, v in data.items() if k in allowed}
            update_payload["updated_at"] = datetime.now(timezone.utc).isoformat()

            result = sb.table("tasks").update(update_payload).eq("id", task_id).execute()
            task = result.data[0]

            new_assignee_id = task.get("assigned_to")
            if new_assignee_id and new_assignee_id != old_assignee and new_assignee_id != user_id:
                assignee = _get_user(new_assignee_id)
                creator = _get_user(user_id)
                if assignee and creator:
                    at, rt = _get_user_tokens(user_id)
                    send_task_assigned_email(task, assignee, creator, at, rt)

            return jsonify(task)
        except Exception as exc:
            logger.exception("Error updating task %s: %s", task_id, exc)
            return jsonify({"error": "Failed to update task"}), 500

    @app.delete("/api/tasks/<task_id>")
    @require_auth
    def delete_task(task_id: str):
        """Delete a task: creator only."""
        user_id = g.user["sub"]

        try:
            sb = get_supabase()
            existing = (
                sb.table("tasks").select("created_by").eq("id", task_id).maybe_single().execute()
            )
            if not existing.data:
                return jsonify({"error": "Task not found"}), 404
            if existing.data["created_by"] != user_id:
                return jsonify({"error": "Only the task creator can delete this task"}), 403

            sb.table("tasks").delete().eq("id", task_id).execute()
            return jsonify({"message": "Task deleted successfully"})
        except Exception as exc:
            logger.exception("Error deleting task %s: %s", task_id, exc)
            return jsonify({"error": "Failed to delete task"}), 500


    @app.patch("/api/tasks/<task_id>/status")
    @require_auth
    def update_status(task_id: str):
        """Change the status of a task. Triggers completed email if applicable."""
        user_id = g.user["sub"]
        data = request.get_json(silent=True) or {}
        new_status = data.get("status")

        if new_status not in ("todo", "in_progress", "completed"):
            return jsonify({"error": "status must be todo, in_progress, or completed"}), 400

        try:
            sb = get_supabase()
            existing = (
                sb.table("tasks").select("*").eq("id", task_id).maybe_single().execute()
            )
            if not existing.data:
                return jsonify({"error": "Task not found"}), 404

            task_data = existing.data
            if task_data["created_by"] != user_id and task_data.get("assigned_to") != user_id:
                return jsonify({"error": "Only the creator or assignee can change status"}), 403

            completed_at = datetime.now(timezone.utc).isoformat()
            update_payload: dict = {
                "status": new_status,
                "updated_at": completed_at,
            }
            result = sb.table("tasks").update(update_payload).eq("id", task_id).execute()
            task = result.data[0]

            if new_status == "completed" and task_data.get("assigned_to") == user_id:
                creator_id = task_data["created_by"]
                if creator_id != user_id:
                    creator = _get_user(creator_id)
                    assignee = _get_user(user_id)
                    if creator and assignee:
                        at, rt = _get_user_tokens(user_id)
                        send_task_completed_email(task, creator, assignee, completed_at, at, rt)

            return jsonify(task)
        except Exception as exc:
            logger.exception("Error updating status for task %s: %s", task_id, exc)
            return jsonify({"error": "Failed to update task status"}), 500

    @app.patch("/api/tasks/<task_id>/assign")
    @require_auth
    def assign_task(task_id: str):
        """Reassign a task: creator only. Pass assigned_to: null to unassign."""
        user_id = g.user["sub"]
        data = request.get_json(silent=True) or {}
        new_assignee_id = data.get("assigned_to")

        try:
            sb = get_supabase()
            existing = (
                sb.table("tasks").select("*").eq("id", task_id).maybe_single().execute()
            )
            if not existing.data:
                return jsonify({"error": "Task not found"}), 404
            if existing.data["created_by"] != user_id:
                return jsonify({"error": "Only the task creator can reassign this task"}), 403

            old_assignee = existing.data.get("assigned_to")
            result = sb.table("tasks").update({
                "assigned_to": new_assignee_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", task_id).execute()
            task = result.data[0]

            if new_assignee_id and new_assignee_id != old_assignee and new_assignee_id != user_id:
                assignee = _get_user(new_assignee_id)
                creator = _get_user(user_id)
                if assignee and creator:
                    at, rt = _get_user_tokens(user_id)
                    send_task_assigned_email(task, assignee, creator, at, rt)

            return jsonify(task)
        except Exception as exc:
            logger.exception("Error assigning task %s: %s", task_id, exc)
            return jsonify({"error": "Failed to assign task"}), 500