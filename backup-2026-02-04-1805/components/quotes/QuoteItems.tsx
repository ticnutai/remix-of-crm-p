import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface QuoteItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface QuoteItemsProps {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
  readOnly?: boolean;
}

export function QuoteItems({ items, onChange, readOnly = false }: QuoteItemsProps) {
  const addItem = () => {
    onChange([...items, { name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate total
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }
    
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">פריטים</Label>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 ml-1" />
            הוסף פריט
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
          <div className="col-span-4">תיאור</div>
          <div className="col-span-2 text-center">כמות</div>
          <div className="col-span-2 text-center">מחיר יחידה</div>
          <div className="col-span-3 text-center">סה"כ</div>
          {!readOnly && <div className="col-span-1"></div>}
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            לא נוספו פריטים עדיין
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className={cn(
                "grid grid-cols-12 gap-2 p-3 items-center",
                index % 2 === 0 ? "bg-background" : "bg-muted/30"
              )}
            >
              <div className="col-span-4">
                {readOnly ? (
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Input
                      placeholder="שם הפריט"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="תיאור (אופציונלי)"
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
              <div className="col-span-2">
                {readOnly ? (
                  <div className="text-center">{item.quantity}</div>
                ) : (
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="text-center"
                  />
                )}
              </div>
              <div className="col-span-2">
                {readOnly ? (
                  <div className="text-center">{formatCurrency(item.unit_price)}</div>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="text-center"
                  />
                )}
              </div>
              <div className="col-span-3 text-center font-medium">
                {formatCurrency(item.total)}
              </div>
              {!readOnly && (
                <div className="col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
