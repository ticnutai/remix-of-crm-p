// EmailDndProvider - Drag & Drop wrapper for emails to folders using @dnd-kit
import React, { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { GmailMessage } from "@/hooks/useGmailIntegration";
import { Badge } from "@/components/ui/badge";
import { Mail, FolderInput } from "lucide-react";

interface EmailDndProviderProps {
  children: React.ReactNode;
  messages: GmailMessage[];
  onMoveToFolder: (message: GmailMessage, folderId: string) => Promise<void>;
}

export function EmailDndProvider({
  children,
  messages,
  onMoveToFolder,
}: EmailDndProviderProps) {
  const [activeDrag, setActiveDrag] = useState<GmailMessage | null>(null);
  const [overFolderId, setOverFolderId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag threshold to avoid accidental drags
      },
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragId = String(event.active.id);
      const message = messages.find((m) => m.id === dragId);
      if (message) {
        setActiveDrag(message);
      }
    },
    [messages],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    // Only set if it's a folder drop target (prefixed with "folder-")
    if (overId?.startsWith("folder-")) {
      setOverFolderId(overId.replace("folder-", ""));
    } else {
      setOverFolderId(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDrag(null);
      setOverFolderId(null);

      if (!over || !active) return;

      const overId = String(over.id);
      if (!overId.startsWith("folder-")) return;

      const folderId = overId.replace("folder-", "");
      const message = messages.find((m) => m.id === String(active.id));
      if (message && folderId) {
        await onMoveToFolder(message, folderId);
      }
    },
    [messages, onMoveToFolder],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}

      {/* Drag overlay - floating preview of the email being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div
            className="bg-card border rounded-lg shadow-lg px-4 py-3 max-w-xs opacity-90"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <div className="truncate text-sm font-medium">
                {activeDrag.subject || "(ללא נושא)"}
              </div>
            </div>
            <div className="text-xs text-muted-foreground truncate mt-1">
              {activeDrag.fromName || activeDrag.from}
            </div>
            {overFolderId && (
              <Badge variant="secondary" className="mt-2 gap-1 text-xs">
                <FolderInput className="h-3 w-3" />
                העבר לתיקייה
              </Badge>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Hook to make an email item draggable
export { useDraggable } from "@dnd-kit/core";

// Hook to make a folder item droppable
export { useDroppable } from "@dnd-kit/core";
