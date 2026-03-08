// Undo Send Bar - Floating notification bar for undo send
import React from "react";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";

interface UndoSendBarProps {
  countdown: number;
  onCancel: () => void;
}

export function UndoSendBar({ countdown, onCancel }: UndoSendBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background rounded-lg px-6 py-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom">
      <span className="text-sm font-medium">
        ההודעה תישלח בעוד {countdown} שניות...
      </span>
      <Button variant="secondary" size="sm" onClick={onCancel}>
        <Undo2 className="h-4 w-4 ml-1" />
        ביטול שליחה
      </Button>
    </div>
  );
}
