import axios from 'axios';
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilter,
  UserProfile,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const hasCookie = document.cookie.split('; ').some((row) => row.startsWith('auth_token='));
    if (!hasCookie) {
      try {
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        const appSession = session as (typeof session & { appToken?: string }) | null;
        if (appSession?.appToken) {
          document.cookie = `auth_token=${appSession.appToken}; path=/; max-age=604800; SameSite=Lax`;
        }
      } catch (err) {
        console.error('Failed to sync cookie in interceptor:', err);
      }
    }
  }
  return config;
});

export async function syncUser(payload: {
  google_id: string;
  email: string;
  name: string;
  avatar_url: string;
  access_token: string;
  refresh_token?: string;
}): Promise<{ token: string; user: UserProfile }> {
  const res = await apiClient.post('/auth/sync', payload);
  return res.data;
}

export async function getMe(): Promise<UserProfile> {
  const res = await apiClient.get('/auth/me');
  return res.data;
}

export async function getTasks(filter?: TaskFilter, status?: string): Promise<Task[]> {
  const params: Record<string, string> = {};
  if (filter) params.filter = filter;
  if (status) params.status = status;
  const res = await apiClient.get('/api/tasks', { params });
  return res.data;
}

export async function getTask(id: string): Promise<Task> {
  const res = await apiClient.get(`/api/tasks/${id}`);
  return res.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await apiClient.post('/api/tasks', payload);
  return res.data;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  const res = await apiClient.put(`/api/tasks/${id}`, payload);
  return res.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`);
}

export async function updateTaskStatus(id: string, status: string): Promise<Task> {
  const res = await apiClient.patch(`/api/tasks/${id}/status`, { status });
  return res.data;
}

export async function assignTask(id: string, assigned_to: string | null): Promise<Task> {
  const res = await apiClient.patch(`/api/tasks/${id}/assign`, { assigned_to });
  return res.data;
}

export async function getUsers(): Promise<UserProfile[]> {
  const res = await apiClient.get('/api/users');
  return res.data;
}
