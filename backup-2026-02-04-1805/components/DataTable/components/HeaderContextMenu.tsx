import React, { useState, forwardRef } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
import {
  Bold,
  Italic,
  Underline,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Pencil,
  Trash2,
  EyeOff,
  Pin,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export interface HeaderStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  align?: 'left' | 'center' | 'right';
}

interface HeaderContextMenuProps {
  children: React.ReactNode;
  columnId: string;
  columnHeader: string;
  headerStyle?: HeaderStyle;
  onStyleChange?: (columnId: string, style: HeaderStyle) => void;
  onRename?: (columnId: string, newName: string) => void;
  onDelete?: (columnId: string) => void;
  onHide?: (columnId: string) => void;
  onFreeze?: (columnId: string) => void;
  onMoveLeft?: (columnId: string) => void;
  onMoveRight?: (columnId: string) => void;
  onSortAsc?: (columnId: string) => void;
  onSortDesc?: (columnId: string) => void;
  canDelete?: boolean;
  canHide?: boolean;
  canFreeze?: boolean;
  canMove?: boolean;
}

const COLORS = [
  { name: 'שחור', value: '#000000' },
  { name: 'לבן', value: '#ffffff' },
  { name: 'אדום', value: '#ef4444' },
  { name: 'כתום', value: '#f97316' },
  { name: 'צהוב', value: '#eab308' },
  { name: 'ירוק', value: '#22c55e' },
  { name: 'כחול', value: '#3b82f6' },
  { name: 'סגול', value: '#a855f7' },
];

const BG_COLORS = [
  { name: 'ללא', value: 'transparent' },
  { name: 'צהוב', value: '#fef9c3' },
  { name: 'ירוק', value: '#dcfce7' },
  { name: 'כחול', value: '#dbeafe' },
  { name: 'אדום', value: '#fee2e2' },
  { name: 'סגול', value: '#f3e8ff' },
  { name: 'אפור', value: '#f3f4f6' },
  { name: 'זהב', value: '#fef3c7' },
];

export const HeaderContextMenu = forwardRef<HTMLTableCellElement, HeaderContextMenuProps>(function HeaderContextMenu({
  children,
  columnId,
  columnHeader,
  headerStyle = {},
  onStyleChange,
  onRename,
  onDelete,
  onHide,
  onFreeze,
  onMoveLeft,
  onMoveRight,
  onSortAsc,
  onSortDesc,
  canDelete = true,
  canHide = true,
  canFreeze = true,
  canMove = true,
}, ref) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(columnHeader);

  const handleRename = () => {
    if (onRename && newName.trim()) {
      onRename(columnId, newName.trim());
      setRenameDialogOpen(false);
    }
  };

  const toggleStyle = (key: 'bold' | 'italic' | 'underline') => {
    if (onStyleChange) {
      onStyleChange(columnId, {
        ...headerStyle,
        [key]: !headerStyle[key],
      });
    }
  };

  const setAlign = (align: 'left' | 'center' | 'right') => {
    if (onStyleChange) {
      onStyleChange(columnId, {
        ...headerStyle,
        align,
      });
    }
  };

  const setColor = (color: string) => {
    if (onStyleChange) {
      onStyleChange(columnId, {
        ...headerStyle,
        color,
      });
    }
  };

  const setBgColor = (backgroundColor: string) => {
    if (onStyleChange) {
      onStyleChange(columnId, {
        ...headerStyle,
        backgroundColor,
      });
    }
  };

  // Clone children and pass the ref directly to the th element
  // This avoids wrapping th in a div which breaks table structure
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {/* עריכת שם */}
          {onRename && (
            <ContextMenuItem onClick={() => setRenameDialogOpen(true)}>
              <Pencil className="ml-2 h-4 w-4" />
              שנה שם עמודה
            </ContextMenuItem>
          )}

          {/* מיון */}
          {(onSortAsc || onSortDesc) && (
            <>
              <ContextMenuSeparator />
              {onSortAsc && (
                <ContextMenuItem onClick={() => onSortAsc(columnId)}>
                  <ArrowUp className="ml-2 h-4 w-4" />
                  מיין עולה (א-ת)
                </ContextMenuItem>
              )}
              {onSortDesc && (
                <ContextMenuItem onClick={() => onSortDesc(columnId)}>
                  <ArrowDown className="ml-2 h-4 w-4" />
                  מיין יורד (ת-א)
                </ContextMenuItem>
              )}
            </>
          )}

          {/* עיצוב טקסט */}
          {onStyleChange && (
            <>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Bold className="ml-2 h-4 w-4" />
                  עיצוב טקסט
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onClick={() => toggleStyle('bold')}>
                    <Bold className="ml-2 h-4 w-4" />
                    מודגש {headerStyle.bold && '✓'}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => toggleStyle('italic')}>
                    <Italic className="ml-2 h-4 w-4" />
                    נטוי {headerStyle.italic && '✓'}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => toggleStyle('underline')}>
                    <Underline className="ml-2 h-4 w-4" />
                    קו תחתון {headerStyle.underline && '✓'}
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              {/* יישור */}
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <AlignRight className="ml-2 h-4 w-4" />
                  יישור
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-36">
                  <ContextMenuItem onClick={() => setAlign('right')}>
                    <AlignRight className="ml-2 h-4 w-4" />
                    ימין {headerStyle.align === 'right' && '✓'}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setAlign('center')}>
                    <AlignCenter className="ml-2 h-4 w-4" />
                    מרכז {headerStyle.align === 'center' && '✓'}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setAlign('left')}>
                    <AlignLeft className="ml-2 h-4 w-4" />
                    שמאל {headerStyle.align === 'left' && '✓'}
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              {/* צבע טקסט */}
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Palette className="ml-2 h-4 w-4" />
                  צבע טקסט
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-36">
                  {COLORS.map((color) => (
                    <ContextMenuItem
                      key={color.value}
                      onClick={() => setColor(color.value)}
                    >
                      <div
                        className="ml-2 h-4 w-4 rounded border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name} {headerStyle.color === color.value && '✓'}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>

              {/* צבע רקע */}
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <div className="ml-2 h-4 w-4 rounded border bg-yellow-100" />
                  צבע רקע
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-36">
                  {BG_COLORS.map((color) => (
                    <ContextMenuItem
                      key={color.value}
                      onClick={() => setBgColor(color.value)}
                    >
                      <div
                        className="ml-2 h-4 w-4 rounded border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name} {headerStyle.backgroundColor === color.value && '✓'}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            </>
          )}

          {/* הזזה */}
          {canMove && (onMoveLeft || onMoveRight) && (
            <>
              <ContextMenuSeparator />
              {onMoveRight && (
                <ContextMenuItem onClick={() => onMoveRight(columnId)}>
                  <ArrowRight className="ml-2 h-4 w-4" />
                  הזז ימינה
                </ContextMenuItem>
              )}
              {onMoveLeft && (
                <ContextMenuItem onClick={() => onMoveLeft(columnId)}>
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  הזז שמאלה
                </ContextMenuItem>
              )}
            </>
          )}

          {/* הקפאה */}
          {canFreeze && onFreeze && (
            <ContextMenuItem onClick={() => onFreeze(columnId)}>
              <Pin className="ml-2 h-4 w-4" />
              הקפא עמודה
            </ContextMenuItem>
          )}

          {/* הסתרה */}
          {canHide && onHide && (
            <ContextMenuItem onClick={() => onHide(columnId)}>
              <EyeOff className="ml-2 h-4 w-4" />
              הסתר עמודה
            </ContextMenuItem>
          )}

          {/* מחיקה */}
          {canDelete && onDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => onDelete(columnId)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="ml-2 h-4 w-4" />
                מחק עמודה
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* דיאלוג שינוי שם */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>שנה שם עמודה</DialogTitle>
            <DialogDescription>
              הזן שם חדש לעמודה "{columnHeader}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="columnName">שם העמודה</Label>
            <Input
              id="columnName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleRename}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default HeaderContextMenu;
