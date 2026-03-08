// עורך שלבים עם פריטים
import React, { useState } from 'react';
import { FileText, Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Check, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TemplateStage, TemplateStageItem } from './types';

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
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
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
    onUpdate(
      stages.map(stage => 
        stage.id === id ? { ...stage, name } : stage
      )
    );
  };

  const removeStage = (id: string) => {
    onUpdate(stages.filter(stage => stage.id !== id));
  };

  const addItem = (stageId: string) => {
    const newItem: TemplateStageItem = {
      id: crypto.randomUUID(),
      text: '',
    };
    onUpdate(
      stages.map(stage => 
        stage.id === stageId 
          ? { ...stage, items: [...stage.items, newItem] }
          : stage
      )
    );
    // Auto start editing
    setEditingItem({ stageId, itemId: newItem.id });
    setEditText('');
  };

  const updateItem = (stageId: string, itemId: string, text: string) => {
    onUpdate(
      stages.map(stage => 
        stage.id === stageId 
          ? { 
              ...stage, 
              items: stage.items.map(item => 
                item.id === itemId ? { ...item, text } : item
              )
            }
          : stage
      )
    );
  };

  const removeItem = (stageId: string, itemId: string) => {
    onUpdate(
      stages.map(stage => 
        stage.id === stageId 
          ? { ...stage, items: stage.items.filter(item => item.id !== itemId) }
          : stage
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
    // If new item is empty, remove it
    if (editingItem && editText.trim() === '') {
      const stage = stages.find(s => s.id === editingItem.stageId);
      const item = stage?.items.find(i => i.id === editingItem.itemId);
      if (item && item.text === '') {
        removeItem(editingItem.stageId, editingItem.itemId);
      }
    }
    setEditingItem(null);
    setEditText('');
  };

  return (
    <div className="space-y-4">
      {stages.map((stage, stageIndex) => (
        <div 
          key={stage.id}
          className="bg-muted/30 rounded-xl overflow-hidden border"
        >
          {/* Stage Header */}
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

              <span className="text-sm text-muted-foreground">
                {stage.items.length} פריטים
              </span>

              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => toggleExpand(stage.id)}
                >
                  {expandedStages.has(stage.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStage(stage.id)}
                className="text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-2">
                {stage.items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg border group"
                  >
                    {editingItem?.itemId === item.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:bg-red-50"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:bg-green-50"
                          onClick={saveEdit}
                        >
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
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span className="flex-1 text-right">
                          {item.text || '(ריק)'}
                        </span>
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
                ))}

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
      ))}

      <Button
        variant="outline"
        onClick={addStage}
        className="w-full"
      >
        <Plus className="h-4 w-4 ml-2" />
        הוסף שלב חדש
      </Button>
    </div>
  );
}
