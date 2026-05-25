'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskCardProps } from '@/types';
import { PriorityBadge } from './PriorityBadge';

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.due_date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card border border-border rounded-xl px-4 py-3.5 cursor-grab flex flex-col gap-2.5 transition-all',
        'hover:border-border/80 hover:shadow-md hover:-translate-y-px',
        'active:cursor-grabbing',
        isDragging && 'opacity-50 border-primary'
      )}
      onClick={() => router.push(`/tasks/${task.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.id}`); }}
    >
      <p className="text-sm font-semibold text-foreground leading-snug">{task.title}</p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <PriorityBadge priority={task.priority} />

        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className={cn(
              'text-xs flex items-center gap-1',
              overdue ? 'text-red-400' : 'text-muted-foreground'
            )}>
              <CalendarDays className="w-3 h-3" />
              {formatDate(task.due_date)}
              {overdue && ' (Overdue)'}
            </span>
          )}

          {task.assignee ? (
            task.assignee.avatar_url ? (
              <Image
                src={task.assignee.avatar_url}
                alt={task.assignee.name}
                width={24}
                height={24}
                className="rounded-full border border-border object-cover"
                title={task.assignee.name}
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[0.6rem] font-bold"
                title={task.assignee.name}
              >
                {task.assignee.name.charAt(0)}
              </div>
            )
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
}
