import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Trash2,
  GripVertical,
  Edit2,
  Eye,
  EyeOff,
  FormInput,
  Hash,
  Calendar,
  AlignLeft,
} from 'lucide-react';
import { CustomField, QuoteDocumentData } from './types';
import { toast } from 'sonner';

interface CustomFieldsEditorProps {
  document: QuoteDocumentData;
  onUpdate: (updates: Partial<QuoteDocumentData>) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'טקסט', icon: FormInput },
  { value: 'number', label: 'מספר', icon: Hash },
  { value: 'date', label: 'תאריך', icon: Calendar },
  { value: 'textarea', label: 'טקסט ארוך', icon: AlignLeft },
];

const FIELD_POSITIONS = [
  { value: 'header', label: 'כותרת' },
  { value: 'client', label: 'פרטי לקוח' },
  { value: 'items', label: 'אזור פריטים' },
  { value: 'footer', label: 'חתימה' },
];

const createNewField = (): CustomField => ({
  id: crypto.randomUUID(),
  label: '',
  value: '',
  type: 'text',
  position: 'header',
  visible: true,
});

export function CustomFieldsEditor({ document, onUpdate }: CustomFieldsEditorProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isNew, setIsNew] = useState(false);

  const customFields = document.customFields || [];

  const addField = useCallback(() => {
    const newField = createNewField();
    setEditingField(newField);
    setIsNew(true);
    setEditDialogOpen(true);
  }, []);

  const editField = useCallback((field: CustomField) => {
    setEditingField({ ...field });
    setIsNew(false);
    setEditDialogOpen(true);
  }, []);

  const saveField = useCallback(() => {
    if (!editingField) return;
    
    if (!editingField.label.trim()) {
      toast.error('יש להזין שם לשדה');
      return;
    }

    const updatedFields = isNew
      ? [...customFields, editingField]
      : customFields.map(f => f.id === editingField.id ? editingField : f);

    onUpdate({ customFields: updatedFields });
    setEditDialogOpen(false);
    setEditingField(null);
    toast.success(isNew ? 'שדה נוסף בהצלחה' : 'שדה עודכן בהצלחה');
  }, [editingField, isNew, customFields, onUpdate]);

  const deleteField = useCallback((id: string) => {
    const updatedFields = customFields.filter(f => f.id !== id);
    onUpdate({ customFields: updatedFields });
    toast.success('שדה נמחק');
  }, [customFields, onUpdate]);

  const toggleFieldVisibility = useCallback((id: string) => {
    const updatedFields = customFields.map(f =>
      f.id === id ? { ...f, visible: !f.visible } : f
    );
    onUpdate({ customFields: updatedFields });
  }, [customFields, onUpdate]);

  const updateFieldValue = useCallback((id: string, value: string) => {
    const updatedFields = customFields.map(f =>
      f.id === id ? { ...f, value } : f
    );
    onUpdate({ customFields: updatedFields });
  }, [customFields, onUpdate]);

  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find(t => t.value === type);
    return fieldType?.icon || FormInput;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">שדות מותאמים אישית</Label>
        <Button variant="ghost" size="sm" className="h-7" onClick={addField}>
          <Plus className="h-3.5 w-3.5 ml-1" />
          הוסף שדה
        </Button>
      </div>

      {customFields.length === 0 ? (
        <div className="text-center py-4 border-2 border-dashed rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">אין שדות מותאמים אישית</p>
          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="h-3.5 w-3.5 ml-1" />
            הוסף שדה ראשון
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {customFields.map((field) => {
            const Icon = getFieldIcon(field.type);
            return (
              <div
                key={field.id}
                className={`border rounded-lg p-2 transition-opacity ${
                  !field.visible ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-move" />
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium flex-1">{field.label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleFieldVisibility(field.id)}
                  >
                    {field.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => editField(field)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => deleteField(field.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Field Value Input */}
                {field.type === 'textarea' ? (
                  <Textarea
                    value={field.value}
                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                    placeholder={`הזן ${field.label}...`}
                    rows={2}
                    className="text-xs"
                  />
                ) : field.type === 'date' ? (
                  <Input
                    type="date"
                    value={field.value}
                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                    className="text-xs h-7"
                  />
                ) : field.type === 'number' ? (
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                    placeholder={`הזן ${field.label}...`}
                    className="text-xs h-7"
                  />
                ) : (
                  <Input
                    value={field.value}
                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                    placeholder={`הזן ${field.label}...`}
                    className="text-xs h-7"
                  />
                )}

                <div className="text-xs text-muted-foreground mt-1">
                  מיקום: {FIELD_POSITIONS.find(p => p.value === field.position)?.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {isNew ? 'הוספת שדה חדש' : 'עריכת שדה'}
            </DialogTitle>
          </DialogHeader>

          {editingField && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>שם השדה *</Label>
                <Input
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  placeholder="למשל: מספר פרויקט"
                />
              </div>

              <div className="space-y-2">
                <Label>סוג שדה</Label>
                <Select
                  value={editingField.type}
                  onValueChange={(v: CustomField['type']) =>
                    setEditingField({ ...editingField, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>מיקום במסמך</Label>
                <Select
                  value={editingField.position}
                  onValueChange={(v: CustomField['position']) =>
                    setEditingField({ ...editingField, position: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_POSITIONS.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ערך ברירת מחדל</Label>
                {editingField.type === 'textarea' ? (
                  <Textarea
                    value={editingField.value}
                    onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                    placeholder="ערך התחלתי (אופציונלי)"
                    rows={2}
                  />
                ) : editingField.type === 'date' ? (
                  <Input
                    type="date"
                    value={editingField.value}
                    onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                  />
                ) : editingField.type === 'number' ? (
                  <Input
                    type="number"
                    value={editingField.value}
                    onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                    placeholder="ערך התחלתי (אופציונלי)"
                  />
                ) : (
                  <Input
                    value={editingField.value}
                    onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                    placeholder="ערך התחלתי (אופציונלי)"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label>הצג במסמך</Label>
                <Switch
                  checked={editingField.visible}
                  onCheckedChange={(v) => setEditingField({ ...editingField, visible: v })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={saveField}>
              {isNew ? 'הוסף שדה' : 'שמור שינויים'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CustomFieldsEditor;
