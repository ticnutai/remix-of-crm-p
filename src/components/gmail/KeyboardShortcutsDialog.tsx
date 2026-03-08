// Keyboard Shortcuts Help Dialog
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  ["c", "כתיבת הודעה חדשה"],
  ["r", "השב"],
  ["a", "השב לכולם"],
  ["f", "העבר"],
  ["e", "ארכיון"],
  ["#", "מחק"],
  ["s", "כוכב"],
  ["p", "הדפס"],
  ["j", "מייל הבא"],
  ["k", "מייל הקודם"],
  ["o", "פתח שיחה"],
  ["Esc", "חזור לרשימה"],
  ["?", "קיצורי מקשים"],
  ["Shift+Click", "בחירת טווח"],
  ["Enter", "חיפוש בשרת"],
];

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            קיצורי מקשים
          </DialogTitle>
          <DialogDescription>קיצורים זמינים בתצוגת Gmail</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-1">
            {SHORTCUTS.map(([key, desc]) => (
              <div
                key={key}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-muted"
              >
                <kbd className="px-2 py-0.5 bg-muted rounded border text-xs font-mono min-w-[28px] text-center">
                  {key}
                </kbd>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
