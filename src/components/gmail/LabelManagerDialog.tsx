// Label Manager Dialog - Create and manage email labels
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailLabel, DEFAULT_LABELS } from "./gmail-types";

interface LabelManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customLabels: EmailLabel[];
  onSetCustomLabels: React.Dispatch<React.SetStateAction<EmailLabel[]>>;
  emailLabels: Record<string, string[]>;
}

export function LabelManagerDialog({
  open,
  onOpenChange,
  customLabels,
  onSetCustomLabels,
  emailLabels,
}: LabelManagerDialogProps) {
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("bg-blue-500");

  const addLabel = () => {
    if (!newLabelName.trim()) return;
    const newLabel: EmailLabel = {
      id: `custom_${Date.now()}`,
      name: newLabelName.trim(),
      color: newLabelColor,
    };
    onSetCustomLabels((prev) => [...prev, newLabel]);
    const allCustom = [
      ...customLabels.filter(
        (l) =>
          !DEFAULT_LABELS.find((dl) => dl.id === l.id) &&
          !l.id.startsWith("client_"),
      ),
      newLabel,
    ];
    localStorage.setItem("gmail_custom_labels", JSON.stringify(allCustom));
    setNewLabelName("");
  };

  const removeLabel = (labelId: string) => {
    onSetCustomLabels((prev) => prev.filter((l) => l.id !== labelId));
    const userCustom = customLabels.filter(
      (l) =>
        !DEFAULT_LABELS.find((dl) => dl.id === l.id) &&
        !l.id.startsWith("client_") &&
        l.id !== labelId,
    );
    localStorage.setItem("gmail_custom_labels", JSON.stringify(userCustom));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול תוויות</DialogTitle>
          <DialogDescription>
            צור ונהל תוויות לסיווג המיילים שלך
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {customLabels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center gap-3 p-2 border rounded-lg"
                >
                  <div className={cn("h-4 w-4 rounded-full", label.color)} />
                  <span className="flex-1">{label.name}</span>
                  <Badge variant="secondary">
                    {
                      Object.values(emailLabels).filter((labels) =>
                        labels.includes(label.id),
                      ).length
                    }
                  </Badge>
                  {!DEFAULT_LABELS.find((dl) => dl.id === label.id) &&
                    !label.id.startsWith("client_") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeLabel(label.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <Separator />
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="שם תווית חדשה..."
                className="flex-1"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newLabelName.trim()) {
                    addLabel();
                  }
                }}
              />
              <Button
                size="icon"
                disabled={!newLabelName.trim()}
                onClick={addLabel}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {[
                "bg-red-500",
                "bg-orange-500",
                "bg-yellow-500",
                "bg-green-500",
                "bg-blue-500",
                "bg-purple-500",
                "bg-pink-500",
                "bg-gray-500",
              ].map((color) => (
                <button
                  key={color}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-all",
                    color,
                    newLabelColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  onClick={() => setNewLabelColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
