'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Frown, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { PriorityBadge, StatusBadge } from '@/components/PriorityBadge';
import { getTask, deleteTask, updateTaskStatus } from '@/lib/api';
import type { Task, TaskStatus } from '@/types';

const STATUS_FLOW: TaskStatus[] = ['todo', 'in_progress', 'completed'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
};

function nextStatus(current: TaskStatus): TaskStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

export default function TaskDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/');
  }, [authStatus, router]);

  useEffect(() => {
    if (!taskId || authStatus !== 'authenticated') return;
    setLoading(true);
    getTask(taskId)
      .then(setTask)
      .catch(() => setError('Task not found.'))
      .finally(() => setLoading(false));
  }, [taskId, authStatus]);

  const currentUserId = (session?.user as ({ id?: string } & { name?: string | null }) | undefined)?.id;
  const isCreator = task?.created_by === currentUserId;
  const isAssignee = task?.assigned_to === currentUserId;
  const canChangeStatus = isCreator || isAssignee;
  const next = task ? nextStatus(task.status) : null;

  const handleAdvanceStatus = async () => {
    if (!task || !next) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateTaskStatus(task.id, next);
      setTask(updated);
    } catch {
      setError('Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      router.push('/dashboard');
    } catch {
      setError('Failed to delete task.');
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center pt-20">
          <span className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (error || !task) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-64px)] py-8 px-6 max-w-[1280px] mx-auto">
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground text-center">
            <Frown className="w-14 h-14 opacity-30" />
            <p className="text-sm max-w-[280px] leading-relaxed">{error || 'Task not found.'}</p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] py-8 px-6 max-w-[760px] mx-auto">
        <div className="flex items-center gap-2 mb-5 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>&rsaquo;</span>
          <span className="text-foreground truncate">{task.title}</span>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="flex flex-wrap gap-2.5 items-start mb-5">
              <h1 className="text-2xl font-bold flex-1">{task.title}</h1>
              <div className="flex gap-2 flex-shrink-0">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            </div>

            {task.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {task.description}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
              <MetaItem label="Due Date" value={task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'None'} />
              <MetaItem label="Created">
                {task.creator ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    {task.creator.avatar_url ? (
                      <Image src={task.creator.avatar_url} alt={task.creator.name} width={22} height={22} className="rounded-full border border-border object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[0.6rem] font-bold">{task.creator.name.charAt(0)}</div>
                    )}
                    <span className="text-sm">{task.creator.name}</span>
                  </div>
                ) : 'None'}
              </MetaItem>
              <MetaItem label="Assigned To">
                {task.assignee ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    {task.assignee.avatar_url ? (
                      <Image src={task.assignee.avatar_url} alt={task.assignee.name} width={22} height={22} className="rounded-full border border-border object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[0.6rem] font-bold">{task.assignee.name.charAt(0)}</div>
                    )}
                    <span className="text-sm">{task.assignee.name}</span>
                  </div>
                ) : <span className="text-muted-foreground text-sm">Unassigned</span>}
              </MetaItem>
              <MetaItem
                label="Created At"
                value={new Date(task.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              />
            </div>

            <div className="flex gap-3 flex-wrap border-t border-border pt-6">
              {canChangeStatus && next && (
                <Button
                  id="advance-status-btn"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleAdvanceStatus}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : `Mark as ${STATUS_LABELS[next]}`}
                </Button>
              )}

              {isCreator && (
                <Button asChild variant="outline" id="edit-task-btn" className="gap-2">
                  <Link href={`/tasks/${task.id}/edit`}>
                    <Pencil className="w-4 h-4" />
                    Edit Task
                  </Link>
                </Button>
              )}

              {isCreator && (
                <Button
                  id="delete-task-btn"
                  variant="destructive"
                  onClick={() => setShowDelete(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}

              <Button asChild variant="ghost" className="ml-auto gap-2">
                <Link href="/dashboard">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {showDelete && (
        <DeleteConfirmModal
          taskTitle={task.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

function MetaItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[0.7rem] text-muted-foreground font-semibold tracking-widest uppercase mb-1">
        {label}
      </div>
      {value ? (
        <div className="text-sm text-foreground">{value}</div>
      ) : children}
    </div>
  );
}
