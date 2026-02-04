// Field selection component for contact import
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ContactImportField, IMPORT_FIELDS } from './types';
import { User, Mail, MapPin, Briefcase } from 'lucide-react';

interface FieldSelectorProps {
  selectedFields: string[];
  onChange: (fields: string[]) => void;
}

const CATEGORY_INFO = {
  basic: { label: 'פרטים בסיסיים', icon: User, color: 'bg-blue-100 text-blue-700' },
  contact: { label: 'פרטי התקשרות', icon: Mail, color: 'bg-green-100 text-green-700' },
  address: { label: 'כתובת', icon: MapPin, color: 'bg-orange-100 text-orange-700' },
  work: { label: 'עבודה', icon: Briefcase, color: 'bg-purple-100 text-purple-700' },
};

export function FieldSelector({ selectedFields, onChange }: FieldSelectorProps) {
  const toggleField = (key: string) => {
    if (selectedFields.includes(key)) {
      onChange(selectedFields.filter(f => f !== key));
    } else {
      onChange([...selectedFields, key]);
    }
  };

  const toggleCategory = (category: string, checked: boolean) => {
    const categoryFields = IMPORT_FIELDS.filter(f => f.category === category).map(f => f.key);
    if (checked) {
      onChange([...new Set([...selectedFields, ...categoryFields])]);
    } else {
      onChange(selectedFields.filter(f => !categoryFields.includes(f)));
    }
  };

  const groupedFields = IMPORT_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ContactImportField[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">בחר שדות לייבוא</h4>
        <Badge variant="secondary">
          {selectedFields.length} נבחרו
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(groupedFields).map(([category, fields]) => {
          const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
          const Icon = info.icon;
          const allSelected = fields.every(f => selectedFields.includes(f.key));
          const someSelected = fields.some(f => selectedFields.includes(f.key));

          return (
            <div key={category} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleCategory(category, !!checked)}
                  className={someSelected && !allSelected ? 'opacity-50' : ''}
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium cursor-pointer" onClick={() => toggleCategory(category, !allSelected)}>
                  {info.label}
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-1 pr-6">
                {fields.map(field => (
                  <div key={field.key} className="flex items-center gap-2">
                    <Checkbox
                      id={field.key}
                      checked={selectedFields.includes(field.key)}
                      onCheckedChange={() => toggleField(field.key)}
                    />
                    <Label 
                      htmlFor={field.key} 
                      className="text-sm cursor-pointer"
                    >
                      {field.hebrewLabel}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
