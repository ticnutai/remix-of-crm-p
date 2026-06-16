// עורך שלבים עם פריטים + גרירה ושחרור
import React, { useState } from 'react';
import { FileText, Plus, Trash2, ChevronDown, ChevronUp, Check, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TemplateStage, TemplateStageItem } from './types';
import { SortableList, SortableItem } from './SortableList';

interface StagesEditorProps {
  stages: TemplateStage[];
  onUpdate: (stages: TemplateStage[]) => void;
  primaryColor?: string;
}

export function StagesEditor({
  stages,
  onUpdate,
  primaryColor = '#d8ac27',
}: StagesEditorProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ stageId: string; itemId: string } | null>(null);
  const [editText, setEditText] = useState('');

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

  const reorderItems = (stageId: string, items: TemplateStageItem[]) => {
    onUpdate(stages.map((s) => (s.id === stageId ? { ...s, items } : s)));
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

  const renderStage = (stage: TemplateStage) => (
    <SortableItem
      key={stage.id}
      id={stage.id}
      handleClassName="absolute right-2 top-5 z-10 p-1 rounded hover:bg-muted text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
    >
      <div className="bg-muted/30 rounded-xl overflow-hidden border pr-8">
        <Collapsible open={expandedStages.has(stage.id)}>
          <div className="flex items-center gap-2 p-4 bg-white">
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
            <div className="p-4 pt-0 space-y-2">
              <SortableList
                items={stage.items}
                onReorder={(items) => reorderItems(stage.id, items)}
                renderOverlay={(item) => (
                  <div className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg border">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <span className="flex-1 text-right">{item.text || '(ריק)'}</span>
                  </div>
                )}
                renderItem={(item) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    handleClassName="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded hover:bg-muted text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
                  >
                    <div className="flex items-center gap-2 py-2 pl-3 pr-7 bg-white rounded-lg border group">
                      {editingItem?.itemId === item.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
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
                  </SortableItem>
                )}
                className="space-y-2"
              />

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
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SortableItem>
  );

  return (
    <div className="space-y-4">
      <SortableList
        items={stages}
        onReorder={onUpdate}
        renderItem={renderStage}
        renderOverlay={(stage) => (
          <div className="bg-white rounded-xl border-2 border-[#d8ac27] p-4 flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-medium">{stage.name}</span>
            <span className="text-sm text-muted-foreground">({stage.items.length} פריטים)</span>
          </div>
        )}
        className="space-y-4"
      />

      <Button variant="outline" onClick={addStage} className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הוסף שלב חדש
      </Button>
    </div>
  );
}
