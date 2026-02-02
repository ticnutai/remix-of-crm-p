// Quick Input Tabs - טאבים מהירים לבחירת כותרות והערות
// e-control CRM Pro

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Plus, X, Settings2, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuickOption {
  id: string;
  label: string;
  color?: string;
}

interface QuickInputTabsProps {
  onSelectTitle?: (title: string) => void;
  onSelectNote?: (note: string) => void;
  selectedTitle?: string;
  selectedNote?: string;
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

export function QuickInputTabs({
  onSelectTitle,
  onSelectNote,
  selectedTitle,
  selectedNote,
}: QuickInputTabsProps) {
  const [options, setOptions] = useState(() => getStoredOptions());
  const [isEditing, setIsEditing] = useState(false);
  const [newTitleLabel, setNewTitleLabel] = useState('');
  const [newNoteLabel, setNewNoteLabel] = useState('');
  const [showTitleAdd, setShowTitleAdd] = useState(false);
  const [showNoteAdd, setShowNoteAdd] = useState(false);

  const handleSelectTitle = (label: string) => {
    onSelectTitle?.(label);
  };

  const handleSelectNote = (label: string) => {
    onSelectNote?.(label);
  };

  const addTitleOption = () => {
    if (!newTitleLabel.trim()) return;
    const newOption: QuickOption = {
      id: Date.now().toString(),
      label: newTitleLabel.trim(),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    const newTitles = [...options.titles, newOption];
    setOptions({ ...options, titles: newTitles });
    saveOptions(newTitles, options.notes);
    setNewTitleLabel('');
    setShowTitleAdd(false);
  };

  const addNoteOption = () => {
    if (!newNoteLabel.trim()) return;
    const newOption: QuickOption = {
      id: Date.now().toString(),
      label: newNoteLabel.trim(),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    const newNotes = [...options.notes, newOption];
    setOptions({ ...options, notes: newNotes });
    saveOptions(options.titles, newNotes);
    setNewNoteLabel('');
    setShowNoteAdd(false);
  };

  const removeTitleOption = (id: string) => {
    const newTitles = options.titles.filter(t => t.id !== id);
    setOptions({ ...options, titles: newTitles });
    saveOptions(newTitles, options.notes);
  };

  const removeNoteOption = (id: string) => {
    const newNotes = options.notes.filter(n => n.id !== id);
    setOptions({ ...options, notes: newNotes });
    saveOptions(options.titles, newNotes);
  };

  const resetToDefaults = () => {
    setOptions({ titles: defaultTitleOptions, notes: defaultNoteOptions });
    saveOptions(defaultTitleOptions, defaultNoteOptions);
  };

  return (
    <div className="space-y-3">
      <Tabs defaultValue="titles" className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="titles" className="text-xs px-3">
              כותרות
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs px-3">
              הערות
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'סיום עריכה' : 'עריכת אפשרויות'}
          >
            {isEditing ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Title Options */}
        <TabsContent value="titles" className="mt-0">
          <div className="flex flex-wrap gap-1.5">
            {options.titles.map((option) => (
              <div key={option.id} className="relative group">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all text-xs py-1 px-2.5 hover:scale-105",
                    selectedTitle === option.label
                      ? "ring-2 ring-[#D4AF37] ring-offset-1 bg-[#D4AF37]/10"
                      : "hover:bg-muted"
                  )}
                  style={{
                    borderColor: option.color,
                    color: selectedTitle === option.label ? '#D4AF37' : option.color,
                  }}
                  onClick={() => !isEditing && handleSelectTitle(option.label)}
                >
                  {option.label}
                  {selectedTitle === option.label && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                </Badge>
                {isEditing && (
                  <button
                    onClick={() => removeTitleOption(option.id)}
                    className="absolute -top-1.5 -left-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
            
            {/* Add new title */}
            <Popover open={showTitleAdd} onOpenChange={setShowTitleAdd}>
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
                  <Label className="text-xs">הוסף כותרת חדשה</Label>
                  <Input
                    value={newTitleLabel}
                    onChange={(e) => setNewTitleLabel(e.target.value)}
                    placeholder="שם הכותרת..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addTitleOption()}
                  />
                  <Button size="sm" className="w-full h-7 text-xs" onClick={addTitleOption}>
                    הוסף
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TabsContent>

        {/* Note Options */}
        <TabsContent value="notes" className="mt-0">
          <div className="flex flex-wrap gap-1.5">
            {options.notes.map((option) => (
              <div key={option.id} className="relative group">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all text-xs py-1 px-2.5 hover:scale-105",
                    selectedNote === option.label
                      ? "ring-2 ring-[#D4AF37] ring-offset-1 bg-[#D4AF37]/10"
                      : "hover:bg-muted"
                  )}
                  style={{
                    borderColor: option.color,
                    color: selectedNote === option.label ? '#D4AF37' : option.color,
                  }}
                  onClick={() => !isEditing && handleSelectNote(option.label)}
                >
                  {option.label}
                  {selectedNote === option.label && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                </Badge>
                {isEditing && (
                  <button
                    onClick={() => removeNoteOption(option.id)}
                    className="absolute -top-1.5 -left-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
            
            {/* Add new note */}
            <Popover open={showNoteAdd} onOpenChange={setShowNoteAdd}>
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
                  <Label className="text-xs">הוסף הערה חדשה</Label>
                  <Input
                    value={newNoteLabel}
                    onChange={(e) => setNewNoteLabel(e.target.value)}
                    placeholder="שם ההערה..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addNoteOption()}
                  />
                  <Button size="sm" className="w-full h-7 text-xs" onClick={addNoteOption}>
                    הוסף
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reset to defaults (only show when editing) */}
      {isEditing && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground h-7"
          onClick={resetToDefaults}
        >
          איפוס לברירת מחדל
        </Button>
      )}
    </div>
  );
}

export default QuickInputTabs;
