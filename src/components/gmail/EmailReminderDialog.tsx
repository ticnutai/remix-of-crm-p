// Email Reminder Dialog - Set reminders on emails
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Clock4, Calendar, BellOff } from "lucide-react";
import { GmailMessage } from "@/hooks/useGmailIntegration";

interface EmailReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmail: GmailMessage | null;
  emailReminders: Record<string, string>;
  onSetReminder: (emailId: string, date: Date | null) => void;
}

export function EmailReminderDialog({
  open,
  onOpenChange,
  selectedEmail,
  emailReminders,
  onSetReminder,
}: EmailReminderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הגדרת תזכורת</DialogTitle>
          <DialogDescription>
            {selectedEmail?.subject || "ללא נושא"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const date = new Date();
                date.setHours(date.getHours() + 1);
                if (selectedEmail) {
                  onSetReminder(selectedEmail.id, date);
                }
                onOpenChange(false);
              }}
            >
              <Clock4 className="h-4 w-4 ml-2" />
              בעוד שעה
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const date = new Date();
                date.setHours(date.getHours() + 3);
                if (selectedEmail) {
                  onSetReminder(selectedEmail.id, date);
                }
                onOpenChange(false);
              }}
            >
              <Clock4 className="h-4 w-4 ml-2" />
              בעוד 3 שעות
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() + 1);
                date.setHours(9, 0, 0, 0);
                if (selectedEmail) {
                  onSetReminder(selectedEmail.id, date);
                }
                onOpenChange(false);
              }}
            >
              <Calendar className="h-4 w-4 ml-2" />
              מחר בבוקר
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() + 7);
                date.setHours(9, 0, 0, 0);
                if (selectedEmail) {
                  onSetReminder(selectedEmail.id, date);
                }
                onOpenChange(false);
              }}
            >
              <Calendar className="h-4 w-4 ml-2" />
              בעוד שבוע
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>תאריך ושעה מותאמים אישית</Label>
            <Input
              type="datetime-local"
              dir="ltr"
              onChange={(e) => {
                if (selectedEmail && e.target.value) {
                  onSetReminder(
                    selectedEmail.id,
                    new Date(e.target.value),
                  );
                  onOpenChange(false);
                }
              }}
            />
          </div>
          {selectedEmail &&
            emailReminders[selectedEmail.id] && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (selectedEmail) {
                    onSetReminder(selectedEmail.id, null);
                  }
                  onOpenChange(false);
                }}
              >
                <BellOff className="h-4 w-4 ml-2" />
                הסר תזכורת
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
