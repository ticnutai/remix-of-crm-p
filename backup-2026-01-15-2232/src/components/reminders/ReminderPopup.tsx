import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { Reminder } from '@/hooks/useReminders';

interface ReminderPopupProps {
  reminders: Reminder[];
  onDismiss: (id: string) => void;
}

export function ReminderPopup({ reminders, onDismiss }: ReminderPopupProps) {
  if (reminders.length === 0) return null;

  return (
    <Dialog open={reminders.length > 0}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[hsl(45,80%,45%)] animate-pulse" />
            תזכורות ({reminders.length})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-start justify-between p-3 bg-[hsl(45,80%,45%)]/10 rounded-lg border border-[hsl(45,80%,45%)]/30"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{reminder.title}</h4>
                {reminder.message && (
                  <p className="text-sm text-muted-foreground mt-1">{reminder.message}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDismiss(reminder.id)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => reminders.forEach(r => onDismiss(r.id))}
          >
            סגור הכל
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
