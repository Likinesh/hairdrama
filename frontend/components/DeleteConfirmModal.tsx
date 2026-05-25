'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { DeleteConfirmModalProps } from '@/types';

export default function DeleteConfirmModal({
  taskTitle,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center mb-2">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <DialogTitle id="delete-modal-title">Delete Task?</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-foreground">&ldquo;{taskTitle}&rdquo;</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            id="delete-cancel-btn"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            id="delete-confirm-btn"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : (
              'Delete Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
