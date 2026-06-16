// רכיב עזר לרשימות עם גרירה ושחרור (D&D) באמצעות @dnd-kit
import React, { useState, ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  handleClassName?: string;
}

export function SortableItem({ id, children, handleClassName }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="גרור לסידור"
        className={
          handleClassName ??
          'absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded hover:bg-muted text-muted-foreground cursor-grab active:cursor-grabbing touch-none'
        }
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  renderOverlay?: (item: T) => ReactNode;
  className?: string;
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  className,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>{items.map((item, idx) => renderItem(item, idx))}</div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeItem && renderOverlay ? (
          <div className="shadow-2xl ring-2 ring-[#d8ac27] rounded-lg bg-white opacity-95">
            {renderOverlay(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
