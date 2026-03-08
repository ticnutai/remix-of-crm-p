import React, { useState } from 'react';
import { Plus, GripVertical, Copy, Trash2, ChevronDown, ChevronUp, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { DocumentItem } from './types';

interface ItemsEditorProps {
  items: DocumentItem[];
  currency?: string;
  onAddItem: (item: Omit<DocumentItem, 'id' | 'order'>) => void;
  onUpdateItem: (id: string, updates: Partial<DocumentItem>) => void;
  onRemoveItem: (id: string) => void;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onDuplicateItem: (id: string) => void;
}

const UNIT_OPTIONS = [
  { value: 'יחידה', label: 'יחידה' },
  { value: 'שעות', label: 'שעות' },
  { value: 'ימים', label: 'ימים' },
  { value: 'חודש', label: 'חודש' },
  { value: 'פרויקט', label: 'פרויקט' },
  { value: 'מ"ר', label: 'מ"ר' },
  { value: 'מ.א', label: 'מ.א' },
  { value: 'ק"מ', label: 'ק"מ' },
];

const formatCurrency = (amount: number, currency: string = 'ILS') => {
  const currencyMap: Record<string, string> = {
    ILS: '₪',
    USD: '$',
    EUR: '€',
  };
  const symbol = currencyMap[currency] || '₪';
  return `${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${symbol}`;
};

const defaultNewItem: Omit<DocumentItem, 'id' | 'order'> = {
  description: '',
  details: '',
  quantity: 1,
  unit: 'יחידה',
  unitPrice: 0,
  total: 0,
};

export function ItemsEditor({
  items,
  currency = 'ILS',
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
  onDuplicateItem,
}: ItemsEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Omit<DocumentItem, 'id' | 'order'>>(defaultNewItem);
  const [editingItem, setEditingItem] = useState<DocumentItem | null>(null);

  const handleAddItem = () => {
    if (!newItem.description.trim()) return;
    onAddItem({
      ...newItem,
      total: newItem.quantity * newItem.unitPrice,
    });
    setNewItem(defaultNewItem);
    setIsAddDialogOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    onUpdateItem(editingItem.id, {
      ...editingItem,
      total: editingItem.quantity * editingItem.unitPrice,
    });
    setEditingItem(null);
  };

  const handleQuickUpdate = (id: string, field: keyof DocumentItem, value: string | number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const updates: Partial<DocumentItem> = { [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : item.quantity;
      const unitPrice = field === 'unitPrice' ? Number(value) : item.unitPrice;
      updates.total = quantity * unitPrice;
    }

    onUpdateItem(id, updates);
  };

  const ItemDialog = ({
    item,
    setItem,
    onSave,
    title,
  }: {
    item: Omit<DocumentItem, 'id' | 'order'>;
    setItem: (item: Omit<DocumentItem, 'id' | 'order'>) => void;
    onSave: () => void;
    title: string;
  }) => (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="description">תיאור</Label>
          <Input
            id="description"
            value={item.description}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
            placeholder="תיאור הפריט"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="details">פרטים נוספים</Label>
          <Textarea
            id="details"
            value={item.details || ''}
            onChange={(e) => setItem({ ...item, details: e.target.value })}
            placeholder="פרטים נוספים (אופציונלי)"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="quantity">כמות</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={item.quantity}
              onChange={(e) =>
                setItem({
                  ...item,
                  quantity: Number(e.target.value),
                  total: Number(e.target.value) * item.unitPrice,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unit">יחידה</Label>
            <Select
              value={item.unit}
              onValueChange={(value) => setItem({ ...item, unit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unitPrice">מחיר ליחידה</Label>
            <Input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) =>
                setItem({
                  ...item,
                  unitPrice: Number(e.target.value),
                  total: item.quantity * Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-lg font-semibold">סה"כ:</span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(item.quantity * item.unitPrice, currency)}
          </span>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={!item.description.trim()}>
          שמור
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">פריטים</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                הוסף פריט
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ItemDialog
                item={newItem}
                setItem={setNewItem}
                onSave={handleAddItem}
                title="הוספת פריט חדש"
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>אין פריטים</p>
            <p className="text-sm mt-1">לחץ על "הוסף פריט" כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="border rounded-lg bg-background transition-shadow hover:shadow-sm"
              >
                {/* Compact View */}
                <div className="flex items-center gap-2 p-2">
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={index === 0}
                      onClick={() => onMoveItem(index, index - 1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={index === items.length - 1}
                      onClick={() => onMoveItem(index, index + 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                    </p>
                  </div>
                  <span className="font-semibold text-primary whitespace-nowrap">
                    {formatCurrency(item.total, currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setExpandedId(expandedId === item.id ? null : item.id)
                      }
                    >
                      {expandedId === item.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Dialog
                      open={editingItem?.id === item.id}
                      onOpenChange={(open) =>
                        setEditingItem(open ? item : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {editingItem && (
                          <ItemDialog
                            item={editingItem}
                            setItem={(i) =>
                              setEditingItem({
                                ...editingItem,
                                ...i,
                              } as DocumentItem)
                            }
                            onSave={handleSaveEdit}
                            title="עריכת פריט"
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDuplicateItem(item.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחיקת פריט</AlertDialogTitle>
                          <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הפריט "{item.description}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onRemoveItem(item.id)}>
                            מחק
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Expanded View */}
                {expandedId === item.id && (
                  <div className="px-4 pb-3 pt-1 border-t bg-muted/20">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">כמות</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuickUpdate(item.id, 'quantity', Number(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">יחידה</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(v) => handleQuickUpdate(item.id, 'unit', v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">מחיר</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleQuickUpdate(item.id, 'unitPrice', Number(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                    {item.details && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {item.details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {items.length > 0 && (
          <div className="mt-4 pt-3 border-t flex items-center justify-between">
            <span className="text-muted-foreground">
              סה"כ {items.length} פריטים
            </span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(
                items.reduce((sum, item) => sum + item.total, 0),
                currency
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
