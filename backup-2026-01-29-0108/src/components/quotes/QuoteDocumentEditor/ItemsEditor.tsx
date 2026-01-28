import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
} from 'lucide-react';
import { QuoteDocumentItem } from './types';

interface ItemsEditorProps {
  items: QuoteDocumentItem[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<QuoteDocumentItem>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onDuplicate: (id: string) => void;
  showNumbers?: boolean;
}

const UNITS = [
  { value: 'יח\'', label: 'יחידה' },
  { value: 'מ"ר', label: 'מ"ר' },
  { value: 'מ"א', label: 'מ"א' },
  { value: 'שעה', label: 'שעה' },
  { value: 'יום', label: 'יום' },
  { value: 'חודש', label: 'חודש' },
  { value: 'קומפלט', label: 'קומפלט' },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function ItemsEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onDuplicate,
  showNumbers = true,
}: ItemsEditorProps) {
  return (
    <div className="space-y-3" dir="rtl">
      {/* Header with Add button */}
      <div className="bg-card pb-3 pt-1 border-b">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-sm whitespace-nowrap">פריטים</h3>
          <Button onClick={onAdd} size="sm" variant="default" className="shrink-0 whitespace-nowrap">
            <Plus className="h-4 w-4 ml-1" />
            הוסף פריט
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-8"></TableHead>
              {showNumbers && <TableHead className="w-10 text-center">#</TableHead>}
              <TableHead className="min-w-[150px]">תיאור</TableHead>
              <TableHead className="w-16 text-center">כמות</TableHead>
              <TableHead className="w-20">יחידה</TableHead>
              <TableHead className="w-24">מחיר</TableHead>
              <TableHead className="w-24 text-left">סה"כ</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={showNumbers ? 8 : 7} 
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <span className="text-base">אין פריטים עדיין</span>
                    <Button onClick={onAdd} size="default" variant="default">
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף פריט ראשון
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} className="group">
                  {/* Move buttons */}
                  <TableCell className="p-1">
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onMove(item.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onMove(item.id, 'down')}
                        disabled={index === items.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Number */}
                  {showNumbers && (
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {item.number}
                    </TableCell>
                  )}

                  {/* Description */}
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        value={item.description}
                        onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                        placeholder="תיאור הפריט"
                        className="border-0 shadow-none focus-visible:ring-1 p-0 h-8"
                      />
                      <Textarea
                        value={item.details || ''}
                        onChange={(e) => onUpdate(item.id, { details: e.target.value })}
                        placeholder="פרטים נוספים (אופציונלי)"
                        className="border-0 shadow-none focus-visible:ring-1 p-0 min-h-0 h-6 text-xs text-muted-foreground resize-none"
                      />
                    </div>
                  </TableCell>

                  {/* Quantity */}
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdate(item.id, { quantity: Number.parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.1}
                      className="text-center h-8"
                    />
                  </TableCell>

                  {/* Unit */}
                  <TableCell>
                    <Select
                      value={item.unit}
                      onValueChange={(v) => onUpdate(item.id, { unit: v })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Unit Price */}
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => onUpdate(item.id, { unitPrice: Number.parseFloat(e.target.value) || 0 })}
                      min={0}
                      className="text-left h-8"
                      dir="ltr"
                    />
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-left font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDuplicate(item.id)}
                        title="שכפל פריט"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onRemove(item.id)}
                        title="מחק פריט"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {items.length > 0 && (
        <div className="flex justify-between items-center pt-2">
          <Button onClick={onAdd} size="sm" variant="ghost">
            <Plus className="h-4 w-4 ml-1" />
            הוסף פריט
          </Button>
          <div className="text-sm text-muted-foreground">
            {items.length} פריטים | סה"כ: {formatCurrency(items.reduce((sum, i) => sum + i.total, 0))}
          </div>
        </div>
      )}
    </div>
  );
}
