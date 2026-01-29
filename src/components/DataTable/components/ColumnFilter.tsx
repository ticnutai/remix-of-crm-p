import React, { useState, useMemo } from 'react';
import { FilterState, ColumnDef } from '../types';
import { Filter, X, Calendar, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

type FilterOperator = FilterState['operator'] | 'between' | 'in';

interface ColumnFilterProps<T> {
  column: ColumnDef<T>;
  currentFilter?: FilterState;
  onFilterChange: (filter: FilterState | null) => void;
  data: T[];
  variant?: 'default' | 'gold' | 'navy' | 'minimal';
}

// Helper to get nested value
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Detect column type from data
function detectColumnType(data: any[], accessorKey: string): 'text' | 'number' | 'date' | 'boolean' {
  for (const row of data.slice(0, 10)) {
    const value = getNestedValue(row, accessorKey);
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      // Check if it's a date string
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    }
  }
  return 'text';
}

// Get unique values for multi-select
function getUniqueValues(data: any[], accessorKey: string): string[] {
  const values = new Set<string>();
  data.forEach(row => {
    const value = getNestedValue(row, accessorKey);
    if (value !== null && value !== undefined) {
      values.add(String(value));
    }
  });
  return Array.from(values).sort();
}

const TEXT_OPERATORS = [
  { value: 'contains', label: 'מכיל' },
  { value: 'eq', label: 'שווה ל' },
  { value: 'neq', label: 'שונה מ' },
  { value: 'startsWith', label: 'מתחיל ב' },
  { value: 'endsWith', label: 'מסתיים ב' },
];

const NUMBER_OPERATORS = [
  { value: 'eq', label: 'שווה ל' },
  { value: 'neq', label: 'שונה מ' },
  { value: 'gt', label: 'גדול מ' },
  { value: 'gte', label: 'גדול או שווה ל' },
  { value: 'lt', label: 'קטן מ' },
  { value: 'lte', label: 'קטן או שווה ל' },
];

const DATE_OPERATORS = [
  { value: 'eq', label: 'בתאריך' },
  { value: 'gt', label: 'אחרי' },
  { value: 'gte', label: 'מתאריך' },
  { value: 'lt', label: 'לפני' },
  { value: 'lte', label: 'עד תאריך' },
];

export function ColumnFilter<T>({
  column,
  currentFilter,
  onFilterChange,
  data,
  variant = 'default',
}: ColumnFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [operator, setOperator] = useState<FilterOperator>(currentFilter?.operator || 'contains');
  const [value, setValue] = useState<string>(String(currentFilter?.value || ''));
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [dateValue, setDateValue] = useState<Date | undefined>();

  const accessorKey = column.accessorKey as string;
  const columnType = useMemo(() => detectColumnType(data, accessorKey), [data, accessorKey]);
  const uniqueValues = useMemo(() => getUniqueValues(data, accessorKey), [data, accessorKey]);

  const operators = columnType === 'number' ? NUMBER_OPERATORS : 
                    columnType === 'date' ? DATE_OPERATORS : 
                    TEXT_OPERATORS;

  const hasActiveFilter = !!currentFilter;

  const handleApply = () => {
    if (isMultiSelect && selectedValues.size > 0) {
      // For multi-select, we'll use 'eq' and join values (handled in parent)
      onFilterChange({
        columnId: accessorKey,
        operator: 'contains',
        value: Array.from(selectedValues).join('|'),
      });
    } else if (columnType === 'date' && dateValue) {
      onFilterChange({
        columnId: accessorKey,
        operator: operator as FilterState['operator'],
        value: format(dateValue, 'yyyy-MM-dd'),
      });
    } else if (value) {
      onFilterChange({
        columnId: accessorKey,
        operator: operator as FilterState['operator'],
        value: columnType === 'number' ? Number(value) : value,
      });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onFilterChange(null);
    setValue('');
    setSelectedValues(new Set());
    setDateValue(undefined);
    setOperator('contains');
    setIsOpen(false);
  };

  const toggleMultiSelectValue = (val: string) => {
    const newSelected = new Set(selectedValues);
    if (newSelected.has(val)) {
      newSelected.delete(val);
    } else {
      newSelected.add(val);
    }
    setSelectedValues(newSelected);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'p-1 rounded-sm hover:bg-primary/10 transition-colors',
            hasActiveFilter && 'text-secondary bg-secondary/20'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className={cn('h-3.5 w-3.5', hasActiveFilter && 'fill-current')} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-3 bg-card border-border z-50" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">סינון: {column.header}</h4>
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-6 px-2">
                <X className="h-3 w-3 ml-1" />
                נקה
              </Button>
            )}
          </div>

          {/* Filter type toggle */}
          {uniqueValues.length <= 20 && columnType === 'text' && (
            <div className="flex gap-2">
              <Button
                variant={!isMultiSelect ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setIsMultiSelect(false)}
                className="flex-1 h-7 text-xs"
              >
                חיפוש
              </Button>
              <Button
                variant={isMultiSelect ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setIsMultiSelect(true)}
                className="flex-1 h-7 text-xs"
              >
                בחירה מרובה
              </Button>
            </div>
          )}

          {/* Multi-select mode */}
          {isMultiSelect && columnType === 'text' ? (
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
              {uniqueValues.map((val) => (
                <label
                  key={val}
                  className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                >
                  <Checkbox
                    checked={selectedValues.has(val)}
                    onCheckedChange={() => toggleMultiSelectValue(val)}
                  />
                  <span className="text-sm truncate">{val}</span>
                </label>
              ))}
            </div>
          ) : columnType === 'date' ? (
            /* Date filter */
            <div className="space-y-2">
              <Select value={operator} onValueChange={(v) => setOperator(v as FilterOperator)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CalendarComponent
                mode="single"
                selected={dateValue}
                onSelect={setDateValue}
                locale={he}
                className="rounded-md border"
              />
            </div>
          ) : (
            /* Text/Number filter */
            <div className="space-y-2">
              <Select value={operator} onValueChange={(v) => setOperator(v as FilterOperator)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type={columnType === 'number' ? 'number' : 'text'}
                placeholder="הזן ערך..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-8"
                dir="rtl"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleApply} size="sm" className="flex-1 h-8">
              <Check className="h-3 w-3 ml-1" />
              החל
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="h-8">
              ביטול
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Active filters badge display
interface ActiveFiltersProps {
  filters: FilterState[];
  columns: ColumnDef<any>[];
  onRemoveFilter: (columnId: string) => void;
  onClearAll: () => void;
  embedded?: boolean;
}

export function ActiveFilters({ filters, columns, onRemoveFilter, onClearAll, embedded = false }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  const getColumnHeader = (columnId: string) => {
    return columns.find(c => c.accessorKey === columnId)?.header || columnId;
  };

  const getOperatorLabel = (operator: FilterState['operator']) => {
    const labels: Record<string, string> = {
      eq: '=',
      neq: '≠',
      gt: '>',
      gte: '≥',
      lt: '<',
      lte: '≤',
      contains: '⊃',
      startsWith: '^',
      endsWith: '$',
    };
    return labels[operator] || operator;
  };

  return (
    <div
      className={cn(
        'flex items-center',
        embedded ? 'flex-nowrap whitespace-nowrap min-w-max gap-1.5 py-0' : 'flex-wrap gap-2 py-2'
      )}
    >
      {!embedded && (
        <span className="text-sm text-muted-foreground">פילטרים פעילים:</span>
      )}
      {filters.map((filter) => (
        <Badge
          key={filter.columnId}
          variant="secondary"
          className={cn(
            'flex items-center gap-1 pl-1',
            embedded && 'h-6 text-[11px]'
          )}
        >
          <span>{getColumnHeader(filter.columnId)}</span>
          <span className="text-muted-foreground">{getOperatorLabel(filter.operator)}</span>
          <span className="font-medium">{String(filter.value).substring(0, embedded ? 10 : 15)}</span>
          <button
            onClick={() => onRemoveFilter(filter.columnId)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className={cn('h-6', embedded ? 'px-2 text-[11px]' : 'text-xs')}
      >
        נקה הכל
      </Button>
    </div>
  );
}
