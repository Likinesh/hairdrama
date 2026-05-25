'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserProfile, TaskPriority, CreateTaskPayload, UpdateTaskPayload, Task, TaskFormProps } from '@/types';
import { getUsers } from '@/lib/api';

export default function TaskForm({
  initialData,
  onSubmit,
  submitLabel = 'Create Task',
  isLoading = false,
}: TaskFormProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(initialData?.due_date ?? '');
  const [assignedTo, setAssignedTo] = useState<string | null>(initialData?.assigned_to ?? null);
  const [assignedUser, setAssignedUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (assignedTo && users.length) {
      setAssignedUser(users.find((u) => u.id === assignedTo) ?? null);
    }
  }, [assignedTo, users]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setError('');
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      assigned_to: assignedTo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="bg-destructive/15 border border-destructive/50 rounded-lg px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-title"
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          placeholder="Add more detail about this task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-priority">Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <SelectTrigger id="task-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-due-date">Due Date</Label>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 relative">
        <Label htmlFor="task-assignee-search">Assignee</Label>

        {assignedUser ? (
          <div className="flex items-center gap-2.5 bg-accent border border-border rounded-lg px-3 py-2">
            {assignedUser.avatar_url ? (
              <Image src={assignedUser.avatar_url} alt={assignedUser.name} width={28} height={28} className="rounded-full border border-border object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {assignedUser.name.charAt(0)}
              </div>
            )}
            <span className="flex-1 text-sm">{assignedUser.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => { setAssignedTo(null); setAssignedUser(null); }}
              aria-label="Remove assignee"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <Input
              id="task-assignee-search"
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              autoComplete="off"
            />
            {showDropdown && filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto scrollbar-thin">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left bg-transparent border-none cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      setAssignedTo(u.id);
                      setAssignedUser(u);
                      setUserSearch('');
                      setShowDropdown(false);
                    }}
                  >
                    {u.avatar_url ? (
                      <Image src={u.avatar_url} alt={u.name} width={28} height={28} className="rounded-full border border-border object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3.5 py-2.5 bg-transparent border-none border-t border-border cursor-pointer text-muted-foreground text-xs hover:bg-accent transition-colors"
                  onClick={() => { setAssignedTo(null); setAssignedUser(null); setUserSearch(''); setShowDropdown(false); }}
                >
                  <X className="w-3 h-3" /> Leave unassigned
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          id="task-submit-btn"
          type="submit"
          disabled={isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : submitLabel}
        </Button>
      </div>
    </form>
  );
}
