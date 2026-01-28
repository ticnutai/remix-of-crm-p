// Column Options Menu - popup with edit/delete/style options
import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MoreVertical,
  Trash2,
  Pencil,
  Palette,
  Bold,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Predefined colors for column headers
const HEADER_COLORS = [
  { value: '', label: 'ברירת מחדל' },
  { value: '#ef4444', label: 'אדום' },
  { value: '#f97316', label: 'כתום' },
  { value: '#eab308', label: 'צהוב' },
  { value: '#22c55e', label: 'ירוק' },
  { value: '#3b82f6', label: 'כחול' },
  { value: '#8b5cf6', label: 'סגול' },
  { value: '#ec4899', label: 'ורוד' },
  { value: '#6b7280', label: 'אפור' },
];

interface ColumnStyle {
  color?: string;
  bold?: boolean;
}

interface ColumnOptionsMenuProps {
  columnName: string;
  columnId: string;
  onDelete: (columnId: string) => void;
  onRename?: (columnId: string, newName: string) => void;
  onStyleChange?: (columnId: string, style: ColumnStyle) => void;
  currentStyle?: ColumnStyle;
}

export function ColumnOptionsMenu({
  columnName,
  columnId,
  onDelete,
  onRename,
  onStyleChange,
  currentStyle = {},
}: ColumnOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(columnName);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(columnId);
    setIsOpen(false);
  };

  const handleRename = () => {
    if (editName.trim() && onRename) {
      onRename(columnId, editName.trim());
      setIsEditingName(false);
    }
  };

  const handleColorChange = (color: string) => {
    if (onStyleChange) {
      onStyleChange(columnId, { ...currentStyle, color });
    }
  };

  const handleBoldToggle = () => {
    if (onStyleChange) {
      onStyleChange(columnId, { ...currentStyle, bold: !currentStyle.bold });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 hover:bg-muted rounded opacity-50 hover:opacity-100 transition-opacity"
          title="אפשרויות עמודה"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2 bg-popover text-popover-foreground border border-border shadow-lg z-50" 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          {/* Edit Name */}
          {onRename && (
            <>
              {isEditingName ? (
                <div className="flex items-center gap-1 p-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleRename}>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-sm"
                >
                  <Pencil className="h-4 w-4" />
                  שנה שם
                </button>
              )}
            </>
          )}

          {/* Bold Toggle */}
          {onStyleChange && (
            <button
              onClick={handleBoldToggle}
              className={cn(
                "w-full flex items-center justify-between gap-2 p-2 rounded hover:bg-muted text-sm",
                currentStyle.bold && "bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <Bold className="h-4 w-4" />
                הדגשה
              </div>
              {currentStyle.bold && <Check className="h-4 w-4 text-primary" />}
            </button>
          )}

          {/* Color Picker */}
          {onStyleChange && (
            <div>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-sm"
              >
                <Palette className="h-4 w-4" />
                צבע כותרת
                {currentStyle.color && (
                  <div 
                    className="w-4 h-4 rounded-full border mr-auto"
                    style={{ backgroundColor: currentStyle.color }}
                  />
                )}
              </button>
              
              {showColorPicker && (
                <div className="grid grid-cols-5 gap-1 p-2 mt-1 bg-muted/50 rounded">
                  {HEADER_COLORS.map((color) => (
                    <button
                      key={color.value || 'default'}
                      onClick={() => handleColorChange(color.value)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                        currentStyle.color === color.value && "ring-2 ring-primary ring-offset-2",
                        !color.value && "bg-gradient-to-br from-gray-200 to-gray-400"
                      )}
                      style={{ backgroundColor: color.value || undefined }}
                      title={color.label}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Separator */}
          <div className="h-px bg-border my-1" />

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-destructive/10 text-destructive text-sm"
          >
            <Trash2 className="h-4 w-4" />
            מחק עמודה
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
