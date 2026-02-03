// דיאלוג תצוגת תבנית מעוצבת
import React, { useState } from 'react';
import { X, Check, Edit2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuoteTemplate, TemplateStage, TemplateStageItem } from './types';

interface TemplatePreviewDialogProps {
  template: QuoteTemplate;
  onClose: () => void;
  onUpdateTemplate?: (updates: Partial<QuoteTemplate>) => void;
  isEditable?: boolean;
}

export function TemplatePreviewDialog({
  template,
  onClose,
  onUpdateTemplate,
  isEditable = false,
}: TemplatePreviewDialogProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const design = template.design_settings || {
    primary_color: '#d8ac27',
    company_name: '',
    company_subtitle: '',
  };

  // חישוב סה"כ
  const calculateTotal = () => {
    const itemsTotal = (template.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
    const stagesTotal = (template.stages || []).reduce((stageSum, stage) => {
      return stageSum; // שלבים לא מחושבים בסכום
    }, 0);
    return itemsTotal;
  };

  const total = calculateTotal();
  const vatAmount = template.show_vat ? total * (template.vat_rate / 100) : 0;
  const grandTotal = total + vatAmount;

  // עריכת פריט בשלב
  const startEditing = (itemId: string, text: string) => {
    if (!isEditable) return;
    setEditingItemId(itemId);
    setEditText(text);
  };

  const saveEdit = (stageId: string, itemId: string) => {
    if (!onUpdateTemplate) return;
    
    const updatedStages = (template.stages || []).map(stage => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        items: stage.items.map(item => 
          item.id === itemId ? { ...item, text: editText } : item
        ),
      };
    });

    onUpdateTemplate({ stages: updatedStages });
    setEditingItemId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditText('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      dir="rtl"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div 
          className="relative px-8 py-6"
          style={{
            background: `linear-gradient(135deg, ${design.primary_color} 0%, ${design.primary_color}dd 100%)`,
          }}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute left-4 top-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          {/* Title */}
          <div className="text-right">
            <h2 className="text-2xl font-bold text-white mb-2">
              הצעת מחיר ל{template.name}
            </h2>
            {design.company_subtitle && (
              <p className="text-white/80 text-sm">
                {design.company_subtitle}
              </p>
            )}
          </div>

          {/* Price badge */}
          <div className="absolute left-8 bottom-6 flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-white text-lg font-bold">
                ₪{grandTotal.toLocaleString()}
              </span>
              <span className="text-white/80 text-sm mr-2">
                + מע"מ
              </span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Stages */}
            {(template.stages || []).map((stage, stageIndex) => (
              <div key={stage.id} className="space-y-3">
                <h3 className="text-lg font-bold text-right flex items-center justify-end gap-2">
                  {stage.name}
                  <span 
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm"
                    style={{ backgroundColor: design.primary_color }}
                  >
                    {stageIndex + 1}
                  </span>
                </h3>

                <div className="space-y-2">
                  {stage.items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
                    >
                      {editingItemId === item.id ? (
                        <>
                          <button 
                            onClick={cancelEdit}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => saveEdit(stage.id, item.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 text-right"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(stage.id, item.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                        </>
                      ) : (
                        <>
                          {isEditable && (
                            <button 
                              onClick={() => startEditing(item.id, item.text)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          <span className="flex-1 text-right text-gray-700">
                            {item.text}
                          </span>
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: design.primary_color }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Items without stages (backwards compatibility) */}
            {(template.items || []).length > 0 && (template.stages || []).length === 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-right">פריטי ההצעה</h3>
                {template.items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100"
                  >
                    <span className="font-medium">
                      ₪{item.total.toLocaleString()}
                    </span>
                    <span className="text-gray-700">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            תוקף: {template.validity_days} יום
          </span>
          <Button 
            onClick={onClose}
            className="text-white"
            style={{ backgroundColor: design.primary_color }}
          >
            סגור
          </Button>
        </div>
      </div>
    </div>
  );
}
