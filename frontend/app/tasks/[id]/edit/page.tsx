'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import TaskForm from '@/components/TaskForm';
import { getTask, updateTask } from '@/lib/api';
import type { Task, UpdateTaskPayload } from '@/types';

export default function EditTaskPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/');
  }, [authStatus, router]);

  useEffect(() => {
    if (!taskId || authStatus !== 'authenticated') return;
    getTask(taskId)
      .then((t) => {
        const userId = (session?.user as ({ id?: string } & { name?: string | null }) | undefined)?.id;
        if (t.created_by !== userId) {
          setError('Only the task creator can edit this task.');
          return;
        }
        setTask(t);
      })
      .catch(() => setError('Task not found.'))
      .finally(() => setLoading(false));
  }, [taskId, authStatus, session]);

  const handleSubmit = async (data: UpdateTaskPayload) => {
    if (!task) return;
    setIsSubmitting(true);
    setError('');
    try {
      await updateTask(task.id, data);
      router.push(`/tasks/${task.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to update task.');
      setIsSubmitting(false);
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
            <Ban className="w-14 h-14 opacity-30" />
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
      <main className="min-h-[calc(100vh-64px)] py-8 px-6 max-w-[700px] mx-auto">
        <div className="mb-7">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>&rsaquo;</span>
            <Link href={`/tasks/${task.id}`} className="hover:text-foreground transition-colors truncate max-w-[200px]">
              {task.title}
            </Link>
            <span>&rsaquo;</span>
            <span className="text-foreground">Edit</span>
          </div>
          <h1 className="text-2xl font-bold">Edit Task</h1>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-7 pb-7 px-7">
            <TaskForm
              initialData={task}
              onSubmit={handleSubmit}
              submitLabel="Save Changes"
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
