// Column mapping component for CSV import
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ColumnMapping, IMPORT_FIELDS } from './types';
import { ArrowRight, Check } from 'lucide-react';

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  selectedFields: string[];
  onChange: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({ headers, mapping, selectedFields, onChange }: ColumnMapperProps) {
  const updateMapping = (fieldKey: string, column: string) => {
    onChange({
      ...mapping,
      [fieldKey]: column === '__none__' ? '' : column,
    });
  };

  // Filter to only show fields that are selected for import
  const fieldsToMap = IMPORT_FIELDS.filter(f => selectedFields.includes(f.key));

  const mappedCount = Object.values(mapping).filter(v => v).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">מיפוי עמודות</h4>
        <Badge variant="secondary">
          {mappedCount} / {fieldsToMap.length} ממופים
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        בחר איזו עמודה מהקובץ תואמת לכל שדה
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {fieldsToMap.map(field => {
          const isMapped = !!mapping[field.key];
          
          return (
            <div 
              key={field.key} 
              className={`flex items-center gap-3 p-2 rounded-lg border ${
                isMapped ? 'bg-accent/50 border-primary/20' : 'bg-muted/30'
              }`}
            >
              <div className="flex-1 min-w-[120px]">
                <Label className="text-sm font-medium">{field.hebrewLabel}</Label>
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              
              <div className="flex-1">
                <Select
                  value={mapping[field.key] || '__none__'}
                  onValueChange={(value) => updateMapping(field.key, value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="בחר עמודה..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">לא ממופה</span>
                    </SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isMapped && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
