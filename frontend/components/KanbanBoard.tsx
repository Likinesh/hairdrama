'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { InboxIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, Column, KanbanBoardProps } from '@/types';
import TaskCard from './TaskCard';
import { updateTaskStatus } from '@/lib/api';

const COLUMNS: Column[] = [
  { id: 'todo', label: 'To Do', accentColor: '#94a3b8' },
  { id: 'in_progress', label: 'In Progress', accentColor: '#3b82f6' },
  { id: 'completed', label: 'Completed', accentColor: '#10b981' },
];

export default function KanbanBoard({ tasks, onTasksChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);

    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    let targetStatus = over.id as TaskStatus;
    if (!COLUMNS.find((c) => c.id === targetStatus)) {
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask) return;
      targetStatus = overTask.status;
    }

    if (draggedTask.status === targetStatus) return;

    const updated = tasks.map((t) =>
      t.id === draggedTask.id ? { ...t, status: targetStatus } : t
    );
    onTasksChange(updated);

    try {
      await updateTaskStatus(draggedTask.id, targetStatus);
    } catch {
      onTasksChange(tasks);
    }
  }, [tasks, onTasksChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(event) => {
        const { over } = event;
        if (over) {
          const colId = COLUMNS.find((c) => c.id === over.id)?.id;
          setOverColumn(colId ?? null);
        }
      }}
    >
      <div className="grid grid-cols-3 gap-5 items-start max-[900px]:grid-cols-1">
        {COLUMNS.map((col) => {
          const colTasks = getTasksByStatus(col.id);
          return (
            <div
              key={col.id}
              id={`kanban-column-${col.id}`}
              className={cn(
                'bg-card border border-border rounded-2xl p-4 min-h-[300px] flex flex-col gap-3 transition-colors',
                overColumn === col.id && 'border-primary bg-accent'
              )}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: col.accentColor }}
                  />
                  <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                    {col.label}
                  </span>
                </div>
                <span className="bg-accent rounded-full text-xs font-bold px-2 py-0.5 text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>

              <SortableContext
                id={col.id}
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                    <InboxIcon className="w-8 h-8 opacity-30" />
                    <span className="text-xs">Drop tasks here</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-2">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
