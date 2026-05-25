'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TaskForm from '@/components/TaskForm';
import { Card, CardContent } from '@/components/ui/card';
import { createTask } from '@/lib/api';
import type { CreateTaskPayload, UpdateTaskPayload } from '@/types';

export default function NewTaskPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (status === 'unauthenticated') {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (data: CreateTaskPayload | UpdateTaskPayload) => {
    setIsLoading(true);
    setError('');
    try {
      const task = await createTask(data as CreateTaskPayload);
      router.push(`/tasks/${task.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to create task. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] py-8 px-6 max-w-[700px] mx-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold">Create New Task</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Fill in the details below to create and optionally assign a task.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 border border-destructive/50 rounded-lg px-4 py-3 mb-5 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="bg-card border-border">
          <CardContent className="pt-7 pb-7 px-7">
            <TaskForm
              onSubmit={handleSubmit}
              submitLabel="Create Task"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
