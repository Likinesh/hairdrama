'use client';

import { cn } from '@/lib/utils';
import type { TaskFilter, FilterTabsProps } from '@/types';

const TABS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'All Tasks' },
  { value: 'mine', label: 'Assigned to Me' },
  { value: 'created', label: 'Created by Me' },
];

export default function FilterTabs({ active, onChange }: FilterTabsProps) {
  return (
    <div
      className="inline-flex gap-1 bg-card border border-border rounded-xl p-1"
      role="tablist"
      aria-label="Task filters"
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          id={`filter-tab-${tab.value}`}
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border-none outline-none',
            active === tab.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
