// Email Note Dialog - Add/edit notes on emails
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GmailMessage } from "@/hooks/useGmailIntegration";

interface EmailNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmail: GmailMessage | null;
  emailNotes: Record<string, string>;
  onSaveNote: (emailId: string, note: string) => void;
}

export function EmailNoteDialog({
  open,
  onOpenChange,
  selectedEmail,
  emailNotes,
  onSaveNote,
}: EmailNoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת הערה</DialogTitle>
          <DialogDescription>
            {selectedEmail?.subject || "ללא נושא"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="כתוב הערה..."
            rows={5}
            defaultValue={
              selectedEmail ? emailNotes[selectedEmail.id] || "" : ""
            }
            onChange={(e) => {
              if (selectedEmail) {
                onSaveNote(selectedEmail.id, e.target.value);
              }
            }}
          />
          <div className="flex gap-2">
            <Button onClick={() => onOpenChange(false)}>שמור</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              סגור
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
