import React from 'react';
import { ColumnDef } from '../types';
import { cn } from '@/lib/utils';

interface SummaryRowProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  selectable?: boolean;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function calculateSummary<T>(column: ColumnDef<T>, data: T[]): any {
  if (!column.summary) return null;

  const values = data
    .map((row) => getNestedValue(row, column.accessorKey as string))
    .filter((v) => typeof v === 'number');

  if (values.length === 0) return null;

  if (typeof column.summary === 'function') {
    return column.summary(values);
  }

  switch (column.summary) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return null;
  }
}

function formatNumber(value: number, type: string): string {
  if (type === 'avg') {
    return value.toLocaleString('he-IL', { maximumFractionDigits: 2 });
  }
  return value.toLocaleString('he-IL');
}

function getSummaryLabel(type: string): string {
  switch (type) {
    case 'sum':
      return 'סה"כ:';
    case 'avg':
      return 'ממוצע:';
    case 'count':
      return 'כמות:';
    case 'min':
      return 'מינימום:';
    case 'max':
      return 'מקסימום:';
    default:
      return '';
  }
}

export function SummaryRow<T>({
  columns,
  data,
  selectable,
}: SummaryRowProps<T>) {
  return (
    <tfoot className="bg-muted/50 border-t-2 border-table-border font-medium">
      <tr>
        {selectable && <td className="p-3" />}
        {columns.map((column) => {
          const summaryValue = calculateSummary(column, data);
          const summaryType = typeof column.summary === 'string' ? column.summary : 'custom';

          return (
            <td
              key={column.id}
              className={cn(
                'p-3 text-sm',
                column.align === 'center' && 'text-center',
                column.align === 'left' && 'text-left',
                column.align === 'right' && 'text-right',
                !column.align && 'text-right'
              )}
            >
              {summaryValue !== null && (
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-muted-foreground text-xs">
                    {getSummaryLabel(summaryType)}
                  </span>
                  <span className="font-semibold text-foreground">
                    {typeof summaryValue === 'number'
                      ? formatNumber(summaryValue, summaryType)
                      : summaryValue}
                  </span>
                </div>
              )}
            </td>
          );
        })}
      </tr>
    </tfoot>
  );
}
