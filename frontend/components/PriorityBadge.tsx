import { cn } from '@/lib/utils';
import type { TaskPriority, TaskStatus, PriorityBadgeProps, StatusBadgeProps } from '@/types';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; classes: string }> = {
  low: { label: 'Low', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  medium: { label: 'Medium', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  high: { label: 'High', classes: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide',
        cfg.classes
      )}
      aria-label={`Priority: ${cfg.label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; classes: string }> = {
  todo: { label: 'To Do', classes: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  completed: { label: 'Completed', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide',
        cfg.classes
      )}
      aria-label={`Status: ${cfg.label}`}
    >
      {cfg.label}
    </span>
  );
}
