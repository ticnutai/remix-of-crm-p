import React, { useState } from 'react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  bgColor?: string;
  icon?: string;
}

interface EnhancedSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  onOptionsChange?: (options: SelectOption[]) => void;
  placeholder?: string;
  allowAddOptions?: boolean;
  className?: string;
  autoOpen?: boolean; // Auto open on mount
}

const PRESET_COLORS = [
  { name: 'אפור', color: '#6b7280', bgColor: '#f3f4f6' },
  { name: 'אדום', color: '#dc2626', bgColor: '#fee2e2' },
  { name: 'כתום', color: '#ea580c', bgColor: '#ffedd5' },
  { name: 'צהוב', color: '#ca8a04', bgColor: '#fef9c3' },
  { name: 'ירוק', color: '#16a34a', bgColor: '#dcfce7' },
  { name: 'כחול', color: '#2563eb', bgColor: '#dbeafe' },
  { name: 'סגול', color: '#9333ea', bgColor: '#f3e8ff' },
  { name: 'ורוד', color: '#db2777', bgColor: '#fce7f3' },
];

const COMMON_ICONS = [
  'Circle', 'Square', 'Triangle', 'Star', 'Heart', 'Flag',
  'AlertTriangle', 'CheckCircle', 'XCircle', 'Clock', 'Zap', 'Target',
];

export function EnhancedSelect({
  value,
  options,
  onChange,
  onOptionsChange,
  placeholder = 'בחר...',
  allowAddOptions = true,
  className,
  autoOpen = false,
}: EnhancedSelectProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionColor, setNewOptionColor] = useState(PRESET_COLORS[0]);
  const [newOptionIcon, setNewOptionIcon] = useState<string>('');

  const handleAddOption = () => {
    if (!newOptionLabel.trim() || !onOptionsChange) return;

    const newOption: SelectOption = {
      value: newOptionLabel.toLowerCase().replace(/\s+/g, '-'),
      label: newOptionLabel,
      color: newOptionColor.color,
      bgColor: newOptionColor.bgColor,
      icon: newOptionIcon || undefined,
    };

    onOptionsChange([...options, newOption]);
    setNewOptionLabel('');
    setNewOptionIcon('');
    setIsAddDialogOpen(false);
  };

  const handleDeleteOption = (optionValue: string) => {
    if (!onOptionsChange) return;
    onOptionsChange(options.filter(o => o.value !== optionValue));
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="h-3 w-3" />;
  };

  const selectedOption = options.find(o => o.value === value);

  return (
    <>
      <Select value={value} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
        <SelectTrigger className={cn("h-8", className)} onClick={() => setIsOpen(true)}>
          <SelectValue placeholder={placeholder}>
            {selectedOption && (
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: selectedOption.bgColor,
                  color: selectedOption.color,
                }}
              >
                {renderIcon(selectedOption.icon)}
                {selectedOption.label}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border shadow-lg z-50">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: option.bgColor || '#f3f4f6',
                    color: option.color || '#374151',
                  }}
                >
                  {renderIcon(option.icon)}
                  {option.label}
                </div>
              </div>
            </SelectItem>
          ))}
          
          {allowAddOptions && onOptionsChange && (
            <>
              <div className="border-t border-border my-1" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAddDialogOpen(true);
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded"
              >
                <Plus className="h-3 w-3" />
                הוסף אפשרות
              </button>
            </>
          )}
        </SelectContent>
      </Select>

      {/* Add Option Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף אפשרות חדשה</DialogTitle>
            <DialogDescription>
              צור אפשרות חדשה עם צבע ואייקון
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>שם האפשרות</Label>
              <Input
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                placeholder="לדוגמה: דחוף"
              />
            </div>

            <div className="space-y-2">
              <Label>צבע</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setNewOptionColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newOptionColor.name === color.name
                        ? "border-primary scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color.bgColor }}
                    title={color.name}
                  >
                    <span
                      className="block w-4 h-4 rounded-full mx-auto"
                      style={{ backgroundColor: color.color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>אייקון (אופציונלי)</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setNewOptionIcon('')}
                  className={cn(
                    "w-8 h-8 rounded border flex items-center justify-center",
                    !newOptionIcon ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  <span className="text-xs">✕</span>
                </button>
                {COMMON_ICONS.map((iconName) => {
                  const IconComp = (LucideIcons as any)[iconName];
                  return (
                    <button
                      key={iconName}
                      onClick={() => setNewOptionIcon(iconName)}
                      className={cn(
                        "w-8 h-8 rounded border flex items-center justify-center",
                        newOptionIcon === iconName
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {IconComp && <IconComp className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>תצוגה מקדימה</Label>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: newOptionColor.bgColor,
                  color: newOptionColor.color,
                }}
              >
                {newOptionIcon && renderIcon(newOptionIcon)}
                {newOptionLabel || 'אפשרות חדשה'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddOption} disabled={!newOptionLabel.trim()}>
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Enhanced cell renderer for select fields
export function EnhancedSelectCell({
  value,
  options,
}: {
  value: string;
  options: SelectOption[];
}) {
  const option = options.find(o => o.value === value);
  
  if (!option) {
    return null;
  }

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="h-3 w-3" />;
  };

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: option.bgColor || '#f3f4f6',
        color: option.color || '#374151',
      }}
    >
      {renderIcon(option.icon)}
      {option.label}
    </div>
  );
}
