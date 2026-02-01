// Quick Input Section - Editable preset buttons for titles and notes
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, X, Settings2, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

export function QuickInputSection({ type, onSelect, selectedValue }: QuickInputSectionProps) {
  const [allOptions, setAllOptions] = useState(() => getStoredOptions());
  const [isEditing, setIsEditing] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const options = type === 'title' ? allOptions.titles : allOptions.notes;

  const handleSelect = (label: string) => {
    onSelect(label);
  };

  const addOption = () => {
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

  const removeOption = (id: string) => {
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
          onClick={() => setIsEditing(!isEditing)}
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
              onClick={() => !isEditing && handleSelect(option.label)}
            >
              {selectedValue?.includes(option.label) && (
                <Check className="h-3 w-3 mr-1" />
              )}
              {option.label}
            </Badge>
            {isEditing && (
              <button
                onClick={() => removeOption(option.id)}
                className="absolute -top-1.5 -left-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}

        {/* Add new option */}
        <Popover open={showAdd} onOpenChange={setShowAdd}>
          <PopoverTrigger asChild>
            <Badge
              variant="outline"
              className="cursor-pointer text-xs py-1 px-2 border-dashed hover:bg-muted"
            >
              <Plus className="h-3 w-3" />
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-2">
              <Label className="text-xs">
                {type === 'title' ? 'הוסף כותרת חדשה' : 'הוסף הערה חדשה'}
              </Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder={type === 'title' ? 'שם הכותרת...' : 'שם ההערה...'}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addOption()}
                autoFocus
              />
              <Button size="sm" className="w-full h-7 text-xs" onClick={addOption}>
                הוסף
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default QuickInputSection;
