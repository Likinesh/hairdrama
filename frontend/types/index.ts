import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type EmailNotificationStatus = 'not_required' | 'pending' | 'sent' | 'failed';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  email_notification_status: EmailNotificationStatus;
  creator?: UserProfile;
  assignee?: UserProfile | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string | null;
  assigned_to?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  assigned_to?: string | null;
  status?: TaskStatus;
}

export type TaskFilter = 'all' | 'mine' | 'created';

export interface ApiError {
  error: string;
}

// NextAuth custom types
export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export interface AppJWT extends JWT {
  appToken?: string;
  appUser?: { id: string };
  // Google credentials stored for client-side sync
  googleId?: string;
  googleEmail?: string;
  googleName?: string;
  googleAvatar?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export interface AppSession extends Session {
  appToken?: string;
  // Exposed to client for sync fallback
  googleId?: string;
  googleEmail?: string;
  googleName?: string;
  googleAvatar?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

// Component Props & helpers
export interface PriorityBadgeProps {
  priority: TaskPriority;
}

export interface StatusBadgeProps {
  status: TaskStatus;
}

export interface FilterTabsProps {
  active: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}

export interface TaskCardProps {
  task: Task;
}

export interface Column {
  id: TaskStatus;
  label: string;
  accentColor: string;
}

export interface KanbanBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (data: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export interface DeleteConfirmModalProps {
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}
