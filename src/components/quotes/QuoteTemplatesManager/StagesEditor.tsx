// עורך שלבים עם פריטים + גרירה ושחרור (כולל בין שלבים)
import React, { useState, useMemo } from 'react';
import {
  FileText, Plus, Trash2, ChevronDown, ChevronUp, Check, X, Edit2, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TemplateStage, TemplateStageItem } from './types';
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragOverlay, DragStartEvent, DragEndEvent, DragOverEvent, useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StagesEditorProps {
  stages: TemplateStage[];
  onUpdate: (stages: TemplateStage[]) => void;
  primaryColor?: string;
}

type DragType = 'stage' | 'item';

function SortableStage({
  stage, children,
}: { stage: TemplateStage; children: (handleProps: { listeners: any; attributes: any }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `stage:${stage.id}`,
    data: { type: 'stage' as DragType, stageId: stage.id },
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {children({ listeners, attributes })}
    </div>
  );
}

function SortableItemRow({
  item, stageId, children,
}: { item: TemplateStageItem; stageId: string; children: (handleProps: { listeners: any; attributes: any }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `item:${item.id}`,
    data: { type: 'item' as DragType, stageId, itemId: item.id },
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {children({ listeners, attributes })}
    </div>
  );
}

function StageDroppable({ stageId, children }: { stageId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-drop:${stageId}`,
    data: { type: 'stage-container' as const, stageId },
  });
  return (
    <div ref={setNodeRef} className={isOver ? 'ring-2 ring-[#d8ac27] rounded-lg' : ''}>
      {children}
    </div>
  );
}

export function StagesEditor({
  stages,
  onUpdate,
  primaryColor = '#d8ac27',
}: StagesEditorProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ stageId: string; itemId: string } | null>(null);
  const [editText, setEditText] = useState('');
  const [activeDrag, setActiveDrag] = useState<{ type: DragType; id: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpand = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) newExpanded.delete(stageId);
    else newExpanded.add(stageId);
    setExpandedStages(newExpanded);
  };

  const addStage = () => {
    const newStage: TemplateStage = {
      id: crypto.randomUUID(),
      name: `שלב ${stages.length + 1}`,
      items: [],
    };
    onUpdate([...stages, newStage]);
    setExpandedStages(new Set([...expandedStages, newStage.id]));
  };

  const updateStageName = (id: string, name: string) => {
    onUpdate(stages.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const removeStage = (id: string) => {
    onUpdate(stages.filter((s) => s.id !== id));
  };

  const addItem = (stageId: string) => {
    const newItem: TemplateStageItem = { id: crypto.randomUUID(), text: '' };
    onUpdate(
      stages.map((s) =>
        s.id === stageId ? { ...s, items: [...s.items, newItem] } : s
      )
    );
    setEditingItem({ stageId, itemId: newItem.id });
    setEditText('');
  };

  const updateItem = (stageId: string, itemId: string, text: string) => {
    onUpdate(
      stages.map((s) =>
        s.id === stageId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, text } : i)) }
          : s
      )
    );
  };

  const removeItem = (stageId: string, itemId: string) => {
    onUpdate(
      stages.map((s) =>
        s.id === stageId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      )
    );
  };

  const startEditing = (stageId: string, itemId: string, text: string) => {
    setEditingItem({ stageId, itemId });
    setEditText(text);
  };

  const saveEdit = () => {
    if (editingItem) {
      updateItem(editingItem.stageId, editingItem.itemId, editText);
      setEditingItem(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    if (editingItem && editText.trim() === '') {
      const stage = stages.find((s) => s.id === editingItem.stageId);
      const item = stage?.items.find((i) => i.id === editingItem.itemId);
      if (item && item.text === '') removeItem(editingItem.stageId, editingItem.itemId);
    }
    setEditingItem(null);
    setEditText('');
  };

  // ===== DnD helpers =====
  const findStageOfItem = (itemId: string): string | null => {
    for (const s of stages) if (s.items.some((i) => i.id === itemId)) return s.id;
    return null;
  };

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as { type: DragType } | undefined;
    if (!data) return;
    setActiveDrag({ type: data.type, id: String(e.active.id) });
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeData = active.data.current as any;
    const overData = over.data.current as any;
    if (!activeData || activeData.type !== 'item') return;

    const activeItemId: string = activeData.itemId;
    const activeStageId: string = activeData.stageId;

    // Determine target stage
    let overStageId: string | null = null;
    if (overData?.type === 'item') overStageId = overData.stageId;
    else if (overData?.type === 'stage-container') overStageId = overData.stageId;
    else if (overData?.type === 'stage') overStageId = overData.stageId;

    if (!overStageId || overStageId === activeStageId) return;

    // Move item to new stage (at end, or before over-item)
    const newStages = stages.map((s) => ({ ...s, items: [...s.items] }));
    const fromStage = newStages.find((s) => s.id === activeStageId);
    const toStage = newStages.find((s) => s.id === overStageId);
    if (!fromStage || !toStage) return;
    const idx = fromStage.items.findIndex((i) => i.id === activeItemId);
    if (idx < 0) return;
    const [moved] = fromStage.items.splice(idx, 1);

    let insertAt = toStage.items.length;
    if (overData?.type === 'item') {
      const overIdx = toStage.items.findIndex((i) => i.id === overData.itemId);
      if (overIdx >= 0) insertAt = overIdx;
    }
    toStage.items.splice(insertAt, 0, moved);
    onUpdate(newStages);
    // Auto-expand target stage so user sees the drop
    if (!expandedStages.has(overStageId)) {
      setExpandedStages(new Set([...expandedStages, overStageId]));
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveDrag(null);
    if (!over) return;
    const activeData = active.data.current as any;
    const overData = over.data.current as any;
    if (!activeData) return;

    if (activeData.type === 'stage') {
      if (overData?.type !== 'stage' || active.id === over.id) return;
      const oldIdx = stages.findIndex((s) => s.id === activeData.stageId);
      const newIdx = stages.findIndex((s) => s.id === overData.stageId);
      if (oldIdx < 0 || newIdx < 0) return;
      onUpdate(arrayMove(stages, oldIdx, newIdx));
      return;
    }

    if (activeData.type === 'item') {
      // Reorder within same stage
      const stageId = findStageOfItem(activeData.itemId);
      if (!stageId) return;
      if (overData?.type === 'item') {
        const overStageId = findStageOfItem(overData.itemId);
        if (overStageId !== stageId) return; // cross-stage already handled in onDragOver
        const stage = stages.find((s) => s.id === stageId)!;
        const oldIdx = stage.items.findIndex((i) => i.id === activeData.itemId);
        const newIdx = stage.items.findIndex((i) => i.id === overData.itemId);
        if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return;
        onUpdate(
          stages.map((s) =>
            s.id === stageId ? { ...s, items: arrayMove(s.items, oldIdx, newIdx) } : s
          )
        );
      }
    }
  };

  const stageIds = useMemo(() => stages.map((s) => `stage:${s.id}`), [stages]);

  const activeItemPreview = useMemo(() => {
    if (!activeDrag) return null;
    if (activeDrag.type === 'stage') {
      const id = activeDrag.id.replace('stage:', '');
      return { kind: 'stage' as const, stage: stages.find((s) => s.id === id) };
    } else {
      const id = activeDrag.id.replace('item:', '');
      for (const s of stages) {
        const it = s.items.find((i) => i.id === id);
        if (it) return { kind: 'item' as const, item: it };
      }
    }
    return null;
  }, [activeDrag, stages]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="space-y-4">
        <SortableContext items={stageIds} strategy={verticalListSortingStrategy}>
          {stages.map((stage) => (
            <SortableStage key={stage.id} stage={stage}>
              {({ listeners, attributes }) => (
                <div className="bg-muted/30 rounded-xl overflow-hidden border">
                  <Collapsible open={expandedStages.has(stage.id)}>
                    <div className="flex items-center gap-2 p-4 bg-white">
                      <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        aria-label="גרור שלב"
                        className="p-1 rounded hover:bg-muted text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <FileText className="h-4 w-4" />
                      </div>
                      <Input
                        value={stage.name}
                        onChange={(e) => updateStageName(stage.id, e.target.value)}
                        className="flex-1 font-medium border-0 bg-transparent focus-visible:ring-0"
                        placeholder="שם השלב"
                      />
                      <span className="text-sm text-muted-foreground">{stage.items.length} פריטים</span>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => toggleExpand(stage.id)}>
                          {expandedStages.has(stage.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <Button variant="ghost" size="icon" onClick={() => removeStage(stage.id)} className="text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <CollapsibleContent>
                      <StageDroppable stageId={stage.id}>
                        <div className="p-4 pt-0 space-y-2 min-h-[40px]">
                          <SortableContext
                            items={stage.items.map((i) => `item:${i.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {stage.items.map((item) => (
                              <SortableItemRow key={item.id} item={item} stageId={stage.id}>
                                {({ listeners, attributes }) => (
                                  <div className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg border group">
                                    <button
                                      type="button"
                                      {...attributes}
                                      {...listeners}
                                      aria-label="גרור פריט"
                                      className="p-1 rounded hover:bg-muted text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </button>
                                    {editingItem?.itemId === item.id ? (
                                      <>
                                        <Input
                                          value={editText}
                                          onChange={(e) => setEditText(e.target.value)}
                                          className="flex-1"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEdit();
                                            if (e.key === 'Escape') cancelEdit();
                                          }}
                                        />
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={saveEdit}>
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={cancelEdit}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                                        <span className="flex-1 text-right">{item.text || '(ריק)'}</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => startEditing(stage.id, item.id, item.text)}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => removeItem(stage.id, item.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </SortableItemRow>
                            ))}
                          </SortableContext>

                          {stage.items.length === 0 && (
                            <div className="text-center text-xs text-muted-foreground py-3 border border-dashed rounded-lg">
                              גרור פריטים לכאן
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addItem(stage.id)}
                            className="w-full border-dashed border text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף פריט
                          </Button>
                        </div>
                      </StageDroppable>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </SortableStage>
          ))}
        </SortableContext>

        <Button variant="outline" onClick={addStage} className="w-full">
          <Plus className="h-4 w-4 ml-2" />
          הוסף שלב חדש
        </Button>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeItemPreview?.kind === 'stage' && activeItemPreview.stage && (
          <div className="bg-white rounded-xl border-2 border-[#d8ac27] p-4 flex items-center gap-2 shadow-2xl">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-medium">{activeItemPreview.stage.name}</span>
            <span className="text-sm text-muted-foreground">({activeItemPreview.stage.items.length} פריטים)</span>
          </div>
        )}
        {activeItemPreview?.kind === 'item' && activeItemPreview.item && (
          <div className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg border-2 border-[#d8ac27] shadow-2xl">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="flex-1 text-right">{activeItemPreview.item.text || '(ריק)'}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
