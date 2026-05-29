'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { PriorityBadge, StatusBadge } from '@/components/PriorityBadge';
import { Card, CardContent } from '@/components/ui/card';
import { getTasks } from '@/lib/api';
import type { Task } from '@/types';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setError('');
    getTasks('all')
      .then(setTasks)
      .catch(() => {
        setTasks([]);
        setError('Failed to load profile tasks. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [status]);

  const userId = (session?.user as ({ id?: string } & { name?: string | null; email?: string | null; image?: string | null }) | undefined)?.id;

  const created  = tasks.filter((t) => t.created_by === userId);
  const assigned = tasks.filter((t) => t.assigned_to === userId);
  const completed = tasks.filter((t) => t.assigned_to === userId && t.status === 'completed');

  if (status === 'loading' || loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center pt-20">
          <span className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  const STATS = [
    { label: 'Tasks Created',  count: created.length,   color: 'text-primary' },
    { label: 'Assigned to Me', count: assigned.length,  color: 'text-blue-400' },
    { label: 'Completed',      count: completed.length, color: 'text-emerald-400' },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] py-8 px-6 max-w-[800px] mx-auto">
        <Card className="mb-6 bg-card border-border">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="flex items-center gap-5 flex-wrap">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'Avatar'}
                  width={80}
                  height={80}
                  className="rounded-full border border-border object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold flex-shrink-0">
                  {session?.user?.name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold mb-1">{session?.user?.name}</h1>
                <p className="text-muted-foreground text-sm">{session?.user?.email}</p>
                <span className="inline-block mt-2 bg-primary/15 text-primary rounded-full px-3 py-0.5 text-xs font-semibold">
                  Google OAuth
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-7 pt-6 border-t border-border">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-3xl font-extrabold ${s.color}`}>{s.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {assigned.length > 0 && (
          <div>
            <h2 className="text-base font-bold mb-4">My Assigned Tasks</h2>
            <div className="flex flex-col gap-2.5">
              {assigned.slice(0, 8).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <Card className="bg-card border-border hover:border-border/80 hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="py-3.5 px-4 flex items-center gap-3.5">
                      <div className="flex-1">
                        <div className="text-sm font-semibold mb-1">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.due_date
                            ? `Due: ${new Date(task.due_date).toLocaleDateString()}`
                            : 'No due date'}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-400 mt-5">{error}</p>
        )}
      </main>
    </>
  );
}
