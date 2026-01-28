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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Underline,
  Palette,
  StickyNote,
  Bell,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Trash2,
  Copy,
  ClipboardPaste,
} from 'lucide-react';

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface CellNote {
  id: string;
  text: string;
  createdAt: Date;
}

export interface CellReminder {
  id: string;
  text: string;
  dueDate: Date;
  completed: boolean;
}

interface CellContextMenuProps {
  children: React.ReactNode;
  cellId: string;
  cellStyle?: CellStyle;
  cellNote?: CellNote;
  cellReminders?: CellReminder[];
  onStyleChange?: (style: CellStyle) => void;
  onNoteChange?: (note: CellNote | null) => void;
  onReminderAdd?: (reminder: Omit<CellReminder, 'id'>) => void;
  onReminderUpdate?: (reminder: CellReminder) => void;
  onReminderDelete?: (reminderId: string) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
}

const COLORS = [
  { name: 'שחור', value: '#000000' },
  { name: 'אדום', value: '#ef4444' },
  { name: 'כתום', value: '#f97316' },
  { name: 'צהוב', value: '#eab308' },
  { name: 'ירוק', value: '#22c55e' },
  { name: 'כחול', value: '#3b82f6' },
  { name: 'סגול', value: '#a855f7' },
  { name: 'ורוד', value: '#ec4899' },
];

const BG_COLORS = [
  { name: 'ללא', value: 'transparent' },
  { name: 'צהוב בהיר', value: '#fef9c3' },
  { name: 'ירוק בהיר', value: '#dcfce7' },
  { name: 'כחול בהיר', value: '#dbeafe' },
  { name: 'אדום בהיר', value: '#fee2e2' },
  { name: 'סגול בהיר', value: '#f3e8ff' },
  { name: 'כתום בהיר', value: '#ffedd5' },
];

export const CellContextMenu = forwardRef<HTMLDivElement, CellContextMenuProps>(function CellContextMenu({
  children,
  cellId,
  cellStyle = {},
  cellNote,
  cellReminders = [],
  onStyleChange,
  onNoteChange,
  onReminderAdd,
  onReminderUpdate,
  onReminderDelete,
  onCopy,
  onPaste,
  onDelete,
}, ref) {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState(cellNote?.text || '');
  const [reminderText, setReminderText] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const handleStyleToggle = (key: keyof CellStyle, value?: string | boolean) => {
    if (!onStyleChange) return;
    
    const newStyle: CellStyle = { ...cellStyle };
    if (value !== undefined) {
      (newStyle as Record<keyof CellStyle, string | boolean | undefined>)[key] = value;
    } else {
      // Toggle boolean properties
      if (key === 'bold' || key === 'italic' || key === 'underline') {
        newStyle[key] = !cellStyle[key];
      }
    }
    onStyleChange(newStyle);
  };

  const handleSaveNote = () => {
    if (!onNoteChange) return;
    
    if (noteText.trim()) {
      onNoteChange({
        id: cellNote?.id || `note-${Date.now()}`,
        text: noteText,
        createdAt: cellNote?.createdAt || new Date(),
      });
    } else {
      onNoteChange(null);
    }
    setIsNoteDialogOpen(false);
  };

  const handleAddReminder = () => {
    if (!onReminderAdd || !reminderText.trim() || !reminderDate) return;
    
    const dueDate = new Date(`${reminderDate}T${reminderTime || '09:00'}`);
    onReminderAdd({
      text: reminderText,
      dueDate,
      completed: false,
    });
    setReminderText('');
    setReminderDate('');
    setReminderTime('');
    setIsReminderDialogOpen(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64 bg-popover border border-border shadow-lg z-50">
          {/* Text Formatting */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <Bold className="h-4 w-4" />
              <span>עיצוב טקסט</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 bg-popover border border-border shadow-lg">
              <ContextMenuItem
                className="flex items-center gap-2"
                onClick={() => handleStyleToggle('bold')}
              >
                <Bold className={`h-4 w-4 ${cellStyle.bold ? 'text-primary' : ''}`} />
                <span>מודגש</span>
                {cellStyle.bold && <span className="mr-auto text-primary">✓</span>}
              </ContextMenuItem>
              <ContextMenuItem
                className="flex items-center gap-2"
                onClick={() => handleStyleToggle('italic')}
              >
                <Italic className={`h-4 w-4 ${cellStyle.italic ? 'text-primary' : ''}`} />
                <span>נטוי</span>
                {cellStyle.italic && <span className="mr-auto text-primary">✓</span>}
              </ContextMenuItem>
              <ContextMenuItem
                className="flex items-center gap-2"
                onClick={() => handleStyleToggle('underline')}
              >
                <Underline className={`h-4 w-4 ${cellStyle.underline ? 'text-primary' : ''}`} />
                <span>קו תחתון</span>
                {cellStyle.underline && <span className="mr-auto text-primary">✓</span>}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Text Color */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>צבע טקסט</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 bg-popover border border-border shadow-lg">
              {COLORS.map((color) => (
                <ContextMenuItem
                  key={color.value}
                  className="flex items-center gap-2"
                  onClick={() => handleStyleToggle('color', color.value)}
                >
                  <div
                    className="h-4 w-4 rounded border border-border"
                    style={{ backgroundColor: color.value }}
                  />
                  <span>{color.name}</span>
                  {cellStyle.color === color.value && <span className="mr-auto text-primary">✓</span>}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Background Color */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border border-border bg-yellow-100" />
              <span>צבע רקע</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 bg-popover border border-border shadow-lg">
              {BG_COLORS.map((color) => (
                <ContextMenuItem
                  key={color.value}
                  className="flex items-center gap-2"
                  onClick={() => handleStyleToggle('backgroundColor', color.value)}
                >
                  <div
                    className="h-4 w-4 rounded border border-border"
                    style={{ backgroundColor: color.value === 'transparent' ? 'white' : color.value }}
                  />
                  <span>{color.name}</span>
                  {cellStyle.backgroundColor === color.value && <span className="mr-auto text-primary">✓</span>}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Text Alignment */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <AlignRight className="h-4 w-4" />
              <span>יישור</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 bg-popover border border-border shadow-lg">
              <ContextMenuItem
                className="flex items-center gap-2"
                onClick={() => handleStyleToggle('align', 'right')}
              >
                <AlignRight className="h-4 w-4" />
                <span>ימין</span>
                {cellStyle.align === 'right' && <span className="mr-auto text-primary">✓</span>}
              </ContextMenuItem>
              <ContextMenuItem
                className="flex items-center gap-2"
                onClick={() => handleStyleToggle('align', 'center')}
              >
                <AlignCenter className="h-4 w-4" />
                <span>מרכז</span>
                {cellStyle.align === 'center' && <span className="mr-auto text-primary">✓</span>}
              </ContextMenuItem>
              <ContextMenuItem
                className="flex items-center gap-2"
                onClick={() => handleStyleToggle('align', 'left')}
              >
                <AlignLeft className="h-4 w-4" />
                <span>שמאל</span>
                {cellStyle.align === 'left' && <span className="mr-auto text-primary">✓</span>}
              </ContextMenuItem>
              <ContextMenuItem
                className="flex items-center gap-2"
                onClick={() => handleStyleToggle('align', 'justify')}
              >
                <AlignJustify className="h-4 w-4" />
                <span>מוצמד (מלא)</span>
                {cellStyle.align === 'justify' && <span className="mr-auto text-primary">✓</span>}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          {/* Notes */}
          <ContextMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              setNoteText(cellNote?.text || '');
              setIsNoteDialogOpen(true);
            }}
          >
            <StickyNote className={`h-4 w-4 ${cellNote ? 'text-yellow-500' : ''}`} />
            <span>{cellNote ? 'עריכת הערה' : 'הוסף הערה'}</span>
            {cellNote && <span className="mr-auto text-xs text-muted-foreground">יש הערה</span>}
          </ContextMenuItem>

          {/* Reminders */}
          <ContextMenuItem
            className="flex items-center gap-2"
            onClick={() => setIsReminderDialogOpen(true)}
          >
            <Bell className={`h-4 w-4 ${cellReminders.length > 0 ? 'text-blue-500' : ''}`} />
            <span>תזכורת</span>
            {cellReminders.length > 0 && (
              <span className="mr-auto text-xs text-muted-foreground">{cellReminders.length}</span>
            )}
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Copy/Paste */}
          {onCopy && (
            <ContextMenuItem className="flex items-center gap-2" onClick={onCopy}>
              <Copy className="h-4 w-4" />
              <span>העתק</span>
            </ContextMenuItem>
          )}
          {onPaste && (
            <ContextMenuItem className="flex items-center gap-2" onClick={onPaste}>
              <ClipboardPaste className="h-4 w-4" />
              <span>הדבק</span>
            </ContextMenuItem>
          )}

          {/* Delete */}
          {onDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="flex items-center gap-2 text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
                <span>מחק תוכן</span>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{cellNote ? 'עריכת הערה' : 'הוספת הערה'}</DialogTitle>
            <DialogDescription>
              הוסף הערה לתא זה. ההערה תוצג כאשר תעבור מעל התא.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="כתוב את ההערה שלך..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-2">
            {cellNote && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  onNoteChange?.(null);
                  setIsNoteDialogOpen(false);
                }}
              >
                מחק הערה
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveNote}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>תזכורות</DialogTitle>
            <DialogDescription>
              הוסף תזכורת לביצוע פעולה בתא זה.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Existing Reminders */}
            {cellReminders.length > 0 && (
              <div className="space-y-2">
                <Label>תזכורות קיימות</Label>
                {cellReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-2 p-2 rounded border border-border bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={reminder.completed}
                      onChange={() =>
                        onReminderUpdate?.({ ...reminder, completed: !reminder.completed })
                      }
                      className="h-4 w-4"
                    />
                    <span className={reminder.completed ? 'line-through text-muted-foreground' : ''}>
                      {reminder.text}
                    </span>
                    <span className="text-xs text-muted-foreground mr-auto">
                      {new Date(reminder.dueDate).toLocaleDateString('he-IL')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => onReminderDelete?.(reminder.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Reminder */}
            <div className="space-y-3 pt-2 border-t border-border">
              <Label>הוסף תזכורת חדשה</Label>
              <Input
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                placeholder="תוכן התזכורת..."
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">תאריך</Label>
                  <Input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">שעה</Label>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
              סגור
            </Button>
            <Button onClick={handleAddReminder} disabled={!reminderText.trim() || !reminderDate}>
              הוסף תזכורת
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

CellContextMenu.displayName = 'CellContextMenu';
