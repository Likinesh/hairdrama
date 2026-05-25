'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import KanbanBoard from '@/components/KanbanBoard';
import FilterTabs from '@/components/FilterTabs';
import { getTasks } from '@/lib/api';
import type { Task, TaskFilter } from '@/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/');
  }, [status, router]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTasks(filter);
      setTasks(data);
    } catch {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === 'authenticated') fetchTasks();
  }, [status, fetchTasks]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalByStatus = {
    todo:        tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed:   tasks.filter((t) => t.status === 'completed').length,
  };

  const STATS = [
    { label: 'To Do',       count: totalByStatus.todo,        color: 'text-slate-400' },
    { label: 'In Progress', count: totalByStatus.in_progress, color: 'text-blue-400' },
    { label: 'Completed',   count: totalByStatus.completed,   color: 'text-emerald-400' },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] py-8 px-6 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome,{' '}
              <span className="text-primary">
                {session?.user?.name?.split(' ')[0] ?? 'User'}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} in view
            </p>
          </div>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" id="create-task-btn">
            <Link href="/tasks/new">
              <Plus className="w-4 h-4" />
              New Task
            </Link>
          </Button>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          {STATS.map((s) => (
            <Card key={s.label} className="flex-1 min-w-[120px] bg-card border-border">
              <CardContent className="pt-4 pb-4 flex flex-col gap-1">
                <span className={`text-[1.6rem] font-extrabold ${s.color}`}>{s.count}</span>
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-6">
          <FilterTabs active={filter} onChange={(f) => setFilter(f)} />
        </div>

        {loading ? (
          <div className="flex justify-center pt-20">
            <span className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground text-center">
            <AlertTriangle className="w-12 h-12 opacity-40" />
            <p className="text-sm max-w-[280px] leading-relaxed">{error}</p>
            <Button variant="outline" onClick={fetchTasks} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        ) : (
          <KanbanBoard tasks={tasks} onTasksChange={setTasks} />
        )}
      </main>
    </>
  );
}