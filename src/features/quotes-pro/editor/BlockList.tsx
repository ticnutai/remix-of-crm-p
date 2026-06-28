// Quotes Pro — רשימת בלוקים עם גרירה לסידור (dnd-kit)
import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import type { QPBlock, QPBlockType } from "../model/types";

interface Props {
  blocks: QPBlock[];
  labels: Record<QPBlockType, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onReorder: (blocks: QPBlock[]) => void;
}

function SortableRow({
  block,
  label,
  selected,
  onSelect,
  onRemove,
  onToggleHidden,
}: {
  block: QPBlock;
  label: string;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onToggleHidden: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
        selected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted"
      } ${block.hidden ? "opacity-50" : ""}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="גרור לסידור"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex-1 truncate">{label}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        title={block.hidden ? "הצג" : "הסתר"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleHidden();
        }}
      >
        {block.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function BlockList({
  blocks,
  labels,
  selectedId,
  onSelect,
  onRemove,
  onToggleHidden,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(blocks, from, to));
  };

  if (blocks.length === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-8">
        אין בלוקים. הוסף בלוק כדי להתחיל.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {blocks.map((b) => (
            <SortableRow
              key={b.id}
              block={b}
              label={labels[b.type]}
              selected={selectedId === b.id}
              onSelect={() => onSelect(b.id)}
              onRemove={() => onRemove(b.id)}
              onToggleHidden={() => onToggleHidden(b.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
