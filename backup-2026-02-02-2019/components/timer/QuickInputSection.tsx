// Quick Input Section - Editable preset buttons for titles and notes
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, X, Settings2, Check, ListPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface QuickOption {
  id: string;
  label: string;
  color?: string;
}

interface QuickInputSectionProps {
  type: 'title' | 'note';
  onSelect: (value: string) => void;
  selectedValue?: string;
}

// Default quick options stored in localStorage
const STORAGE_KEY = 'timer-quick-options';

const defaultTitleOptions: QuickOption[] = [
  { id: '1', label: 'תכנון', color: '#3B82F6' },
  { id: '2', label: 'עיצוב', color: '#8B5CF6' },
  { id: '3', label: 'פגישה', color: '#10B981' },
  { id: '4', label: 'בדיקות', color: '#F59E0B' },
  { id: '5', label: 'תיעוד', color: '#EC4899' },
  { id: '6', label: 'פיתוח', color: '#6366F1' },
  { id: '7', label: 'תיאום', color: '#14B8A6' },
  { id: '8', label: 'שיחה', color: '#F97316' },
];

const defaultNoteOptions: QuickOption[] = [
  { id: '1', label: 'לחשבונית', color: '#10B981' },
  { id: '2', label: 'המשך מחר', color: '#3B82F6' },
  { id: '3', label: 'דחוף', color: '#EF4444' },
  { id: '4', label: 'ממתין לאישור', color: '#F59E0B' },
  { id: '5', label: 'הושלם', color: '#22C55E' },
  { id: '6', label: 'בבדיקה', color: '#8B5CF6' },
];

function getStoredOptions(): { titles: QuickOption[]; notes: QuickOption[] } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Fall through to default
  }
  return { titles: defaultTitleOptions, notes: defaultNoteOptions };
}

function saveOptions(titles: QuickOption[], notes: QuickOption[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ titles, notes }));
}

export function QuickInputSection({ type, onSelect, selectedValue }: Readonly<QuickInputSectionProps>) {
  const [allOptions, setAllOptions] = useState(() => getStoredOptions());
  const [isEditing, setIsEditing] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  const debugEnabled = (() => {
    try {
      return Boolean(import.meta.env.DEV) && localStorage.getItem('debug-quick-input') === '1';
    } catch {
      return false;
    }
  })();

  const debug = (...args: unknown[]) => {
    if (!debugEnabled) return;
    console.log('[QuickInputSection]', ...args);
  };

  const options = type === 'title' ? allOptions.titles : allOptions.notes;

  const handleSelect = (label: string) => {
    debug('select', { type, label });
    onSelect(label);
  };

  const addOption = () => {
    debug('addOption click/enter', { type, newLabel });
    if (!newLabel.trim()) return;

    const newOption: QuickOption = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };

    if (type === 'title') {
      const newTitles = [...allOptions.titles, newOption];
      setAllOptions({ ...allOptions, titles: newTitles });
      saveOptions(newTitles, allOptions.notes);
    } else {
      const newNotes = [...allOptions.notes, newOption];
      setAllOptions({ ...allOptions, notes: newNotes });
      saveOptions(allOptions.titles, newNotes);
    }

    setNewLabel('');
    setShowAdd(false);
  };

  // הוספה מרובה - כל שורה הופכת לכפתור
  const addBulkOptions = () => {
    const lines = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    debug('addBulkOptions', { type, lines });
    
    if (lines.length === 0) return;

    const existingLabels = options.map(o => o.label);
    const newOptions: QuickOption[] = lines
      .filter(label => !existingLabels.includes(label))
      .map(label => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        label,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      }));

    if (newOptions.length === 0) {
      setBulkInput('');
      setShowBulkAdd(false);
      return;
    }

    if (type === 'title') {
      const newTitles = [...allOptions.titles, ...newOptions];
      setAllOptions({ ...allOptions, titles: newTitles });
      saveOptions(newTitles, allOptions.notes);
    } else {
      const newNotes = [...allOptions.notes, ...newOptions];
      setAllOptions({ ...allOptions, notes: newNotes });
      saveOptions(allOptions.titles, newNotes);
    }

    setBulkInput('');
    setShowBulkAdd(false);
  };

  const removeOption = (id: string) => {
    debug('removeOption', { type, id });
    if (type === 'title') {
      const newTitles = allOptions.titles.filter(t => t.id !== id);
      setAllOptions({ ...allOptions, titles: newTitles });
      saveOptions(newTitles, allOptions.notes);
    } else {
      const newNotes = allOptions.notes.filter(n => n.id !== id);
      setAllOptions({ ...allOptions, notes: newNotes });
      saveOptions(allOptions.titles, newNotes);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {type === 'title' ? 'אפשרויות כותרות:' : 'אפשרויות הערות:'}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const nextIsEditing = isEditing ? false : true;
            debug('toggle edit', { type, next: nextIsEditing });
            setIsEditing(nextIsEditing);
          }}
          title={isEditing ? 'סיום עריכה' : 'עריכת אפשרויות'}
        >
          {isEditing ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Settings2 className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <div key={option.id} className="relative group">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-all text-xs py-1 px-2.5 hover:scale-105",
                selectedValue?.includes(option.label)
                  ? "ring-2 ring-[#D4AF37] ring-offset-1 bg-[#D4AF37]/10"
                  : "hover:bg-muted"
              )}
              style={{
                borderColor: option.color,
                color: selectedValue?.includes(option.label) ? '#D4AF37' : option.color,
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isEditing) {
                  debug('click ignored - editing mode', { type, label: option.label });
                  return;
                }
                handleSelect(option.label);
              }}
            >
              {selectedValue?.includes(option.label) && (
                <Check className="h-3 w-3 mr-1" />
              )}
              {option.label}
            </Badge>
            {isEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeOption(option.id);
                }}
                className="absolute -top-1.5 -left-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}

        {/* Add new option - Using direct input instead of Popover for better reliability */}
        {showAdd ? (
          <div className="flex gap-1 items-center">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={type === 'title' ? 'כותרת חדשה...' : 'הערה חדשה...'}
              className="h-7 w-28 text-xs"
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addOption();
                }
                if (e.key === 'Escape') {
                  setShowAdd(false);
                  setNewLabel('');
                }
              }}
              autoFocus
            />
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded bg-green-500 text-white hover:bg-green-400"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                debug('add button click', { type, newLabel });
                addOption();
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded bg-gray-400 text-white hover:bg-gray-300"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAdd(false);
                setNewLabel('');
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : showBulkAdd ? (
          /* הוספה מרובה - כל שורה הופכת לכפתור */
          <div className="w-full space-y-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">
              הכנס כל {type === 'title' ? 'כותרת' : 'הערה'} בשורה נפרדת:
            </div>
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={type === 'title' 
                ? "פגישה\nתכנון\nבדיקות\n..." 
                : "לחשבונית\nדחוף\nהושלם\n..."}
              className="min-h-[80px] text-sm resize-none"
              onKeyDown={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 h-7 flex items-center justify-center gap-1 rounded bg-amber-500 text-white hover:bg-amber-400 text-xs font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addBulkOptions();
                }}
              >
                <Plus className="h-3 w-3" />
                הוסף הכל
              </button>
              <button
                type="button"
                className="h-7 px-3 flex items-center justify-center rounded bg-gray-300 text-gray-700 hover:bg-gray-200 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowBulkAdd(false);
                  setBulkInput('');
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          /* כפתורי הוספה */
          <div className="flex gap-1">
            <button
              type="button"
              className="h-7 px-2.5 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                debug('plus button click to show input', { type });
                setShowAdd(true);
              }}
              title="הוסף אחד"
            >
              <Plus className="h-3.5 w-3.5 text-gray-500" />
            </button>
            <button
              type="button"
              className="h-7 px-2 flex items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-xs text-gray-500"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                debug('bulk add button click', { type });
                setShowBulkAdd(true);
              }}
              title="הוספה מרובה"
            >
              <ListPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickInputSection;
