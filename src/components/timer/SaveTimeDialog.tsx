/**
 * SaveTimeDialog - דיאלוג שמירת זמן חדש ונקי
 * עם כל הפונקציות עובדות: בחירה, הוספה, עריכה, מחיקה
 * 
 * ✅ שודרג לסנכרון ענן - הכותרות וההערות נשמרות ב-Supabase!
 */
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Save, 
  Plus, 
  Check, 
  Edit2, 
  Trash2, 
  FileText,
  Clock,
  ListPlus,
  Cloud
} from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';

// Storage keys (for fallback only)
const QUICK_TITLES_KEY = 'timer-quick-titles';
const QUICK_NOTES_KEY = 'timer-quick-notes';

// Defaults
const DEFAULT_TITLES = ['תכנון', 'עיצוב', 'פגישה', 'בדיקות', 'תיעוד', 'פיתוח', 'תיאום', 'שיחה'];
const DEFAULT_NOTES = ['לחשבונית', 'המשך מחר', 'דחוף', 'ממתין לאישור', 'הושלם', 'בבדיקה'];

// Cloud settings interface
interface QuickOptionsSettings {
  titles: string[];
  notes: string[];
}

interface SaveTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elapsedTime: number;
  onSave: (title: string, notes: string) => void;
  onCancel?: () => void;  // Called when user cancels (to resume timer)
}

export function SaveTimeDialog({ open, onOpenChange, elapsedTime, onSave, onCancel }: Readonly<SaveTimeDialogProps>) {
  // State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  
  // ========== CLOUD SYNC ==========
  // Get initial values from localStorage as fallback
  const getInitialTitles = (): string[] => {
    try {
      const saved = localStorage.getItem(QUICK_TITLES_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TITLES;
    } catch {
      return DEFAULT_TITLES;
    }
  };
  
  const getInitialNotes = (): string[] => {
    try {
      const saved = localStorage.getItem(QUICK_NOTES_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  };

  // Cloud settings hook - syncs to Supabase!
  const { 
    value: cloudSettings, 
    setValue: setCloudSettings, 
    isLoading: cloudLoading,
    isSaving: cloudSaving 
  } = useUserSettings<QuickOptionsSettings>({
    key: 'timer_quick_options',
    defaultValue: {
      titles: getInitialTitles(),
      notes: getInitialNotes()
    }
  });

  // Use cloud values with local fallback
  const quickTitles = cloudSettings.titles;
  const quickNotes = cloudSettings.notes;
  
  // Update functions that sync to cloud
  const setQuickTitles = (updater: string[] | ((prev: string[]) => string[])) => {
    const newTitles = typeof updater === 'function' ? updater(quickTitles) : updater;
    setCloudSettings(prev => ({ ...prev, titles: newTitles }));
    // Also save to localStorage as backup
    localStorage.setItem(QUICK_TITLES_KEY, JSON.stringify(newTitles));
  };
  
  const setQuickNotes = (updater: string[] | ((prev: string[]) => string[])) => {
    const newNotes = typeof updater === 'function' ? updater(quickNotes) : updater;
    setCloudSettings(prev => ({ ...prev, notes: newNotes }));
    // Also save to localStorage as backup
    localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify(newNotes));
  };
  
  // Edit mode
  const [editingTitle, setEditingTitle] = useState<{ index: number; value: string } | null>(null);
  const [editingNote, setEditingNote] = useState<{ index: number; value: string } | null>(null);
  
  // Add new
  const [newTitleInput, setNewTitleInput] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [showBulkTitles, setShowBulkTitles] = useState(false);
  const [showBulkNotes, setShowBulkNotes] = useState(false);
  const [bulkTitlesInput, setBulkTitlesInput] = useState('');
  const [bulkNotesInput, setBulkNotesInput] = useState('');

  // Format time display
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Handle save
  const handleSave = () => {
    onSave(title, notes);
    setTitle('');
    setNotes('');
    onOpenChange(false);
  };

  // Title functions
  const selectTitle = (t: string) => {
    console.log('[SaveTimeDialog] selectTitle:', t);
    setTitle(t);
  };

  const addTitle = () => {
    const trimmed = newTitleInput.trim();
    console.log('[SaveTimeDialog] addTitle:', trimmed);
    if (trimmed && !quickTitles.includes(trimmed)) {
      setQuickTitles(prev => [...prev, trimmed]);
      setNewTitleInput('');
    }
  };

  const removeTitle = (index: number) => {
    console.log('[SaveTimeDialog] removeTitle:', index);
    setQuickTitles(prev => prev.filter((_, i) => i !== index));
  };

  const startEditTitle = (index: number, value: string) => {
    console.log('[SaveTimeDialog] startEditTitle:', index, value);
    setEditingTitle({ index, value });
  };

  const saveEditTitle = () => {
    if (editingTitle && editingTitle.value.trim()) {
      console.log('[SaveTimeDialog] saveEditTitle:', editingTitle);
      setQuickTitles(prev => {
        const newArr = [...prev];
        newArr[editingTitle.index] = editingTitle.value.trim();
        return newArr;
      });
    }
    setEditingTitle(null);
  };

  const addBulkTitles = () => {
    const newTitles = bulkTitlesInput
      .split('\n')
      .map(t => t.trim())
      .filter(t => t && !quickTitles.includes(t));
    console.log('[SaveTimeDialog] addBulkTitles:', newTitles);
    if (newTitles.length > 0) {
      setQuickTitles(prev => [...prev, ...newTitles]);
    }
    setBulkTitlesInput('');
    setShowBulkTitles(false);
  };

  // Note functions
  const selectNote = (n: string) => {
    console.log('[SaveTimeDialog] selectNote:', n);
    setNotes(n);
  };

  const addNote = () => {
    const trimmed = newNoteInput.trim();
    console.log('[SaveTimeDialog] addNote:', trimmed);
    if (trimmed && !quickNotes.includes(trimmed)) {
      setQuickNotes(prev => [...prev, trimmed]);
      setNewNoteInput('');
    }
  };

  const removeNote = (index: number) => {
    console.log('[SaveTimeDialog] removeNote:', index);
    setQuickNotes(prev => prev.filter((_, i) => i !== index));
  };

  const startEditNote = (index: number, value: string) => {
    console.log('[SaveTimeDialog] startEditNote:', index, value);
    setEditingNote({ index, value });
  };

  const saveEditNote = () => {
    if (editingNote && editingNote.value.trim()) {
      console.log('[SaveTimeDialog] saveEditNote:', editingNote);
      setQuickNotes(prev => {
        const newArr = [...prev];
        newArr[editingNote.index] = editingNote.value.trim();
        return newArr;
      });
    }
    setEditingNote(null);
  };

  const addBulkNotes = () => {
    const newNotes = bulkNotesInput
      .split('\n')
      .map(n => n.trim())
      .filter(n => n && !quickNotes.includes(n));
    console.log('[SaveTimeDialog] addBulkNotes:', newNotes);
    if (newNotes.length > 0) {
      setQuickNotes(prev => [...prev, ...newNotes]);
    }
    setBulkNotesInput('');
    setShowBulkNotes(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        dir="rtl"
        className="max-w-lg bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500 text-white shadow-2xl rounded-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-amber-400 flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              שמירת רישום זמן
            </div>
            {/* Cloud Status Indicator */}
            {cloudLoading ? (
               <Cloud className="h-4 w-4 animate-pulse text-white/50" />
            ) : cloudSaving ? (
               <Cloud className="h-4 w-4 animate-bounce text-amber-500" />
            ) : (
               <Cloud className="h-4 w-4 text-green-500/50" />
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Time Display */}
        <div className="text-center py-4 rounded-xl bg-slate-950 border border-amber-500/30">
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">זמן שהושקע</span>
          </div>
          <div className="text-4xl font-mono font-light text-amber-300 tracking-wider">
            {formatTime(elapsedTime)}
          </div>
        </div>

        <div className="space-y-5 mt-2 max-h-[50vh] overflow-y-auto pr-1">
          {/* ===== TITLES SECTION ===== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                כותרת / תיאור
              </h3>
              <button
                type="button"
                className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 text-xs"
                onClick={() => setShowBulkTitles(!showBulkTitles)}
              >
                <ListPlus className="h-3.5 w-3.5" />
                הוספה מרובה
              </button>
            </div>

            {/* Quick Title Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickTitles.map((t, idx) => (
                editingTitle?.index === idx ? (
                  <div key={`title-edit-${idx}`} className="flex gap-1">
                    <Input
                      value={editingTitle.value}
                      onChange={(e) => setEditingTitle({ ...editingTitle, value: e.target.value })}
                      className="h-8 w-32 bg-white/10 border-amber-500 text-white text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditTitle();
                        if (e.key === 'Escape') setEditingTitle(null);
                      }}
                    />
                    <button
                      type="button"
                      className="h-8 w-8 flex items-center justify-center rounded bg-green-600 hover:bg-green-500 text-white"
                      onClick={saveEditTitle}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div key={`title-${idx}`} className="group relative">
                    <button
                      type="button"
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg border-2 transition-all font-medium",
                        title === t
                          ? "bg-amber-500 text-slate-900 border-amber-400 shadow-lg"
                          : "bg-white/5 border-white/20 hover:border-amber-500/60 hover:bg-white/10 text-white"
                      )}
                      onClick={() => selectTitle(t)}
                    >
                      {t}
                    </button>
                    <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5 z-10">
                      <button
                        type="button"
                        className="p-0.5 rounded bg-blue-500 text-white hover:bg-blue-400"
                        onClick={() => startEditTitle(idx, t)}
                      >
                        <Edit2 className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        className="p-0.5 rounded bg-red-500 text-white hover:bg-red-400"
                        onClick={() => removeTitle(idx)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                )
              ))}
              
              {/* Add single title */}
              <div className="flex gap-1 items-center">
                <Input
                  value={newTitleInput}
                  onChange={(e) => setNewTitleInput(e.target.value)}
                  placeholder="הוסף כותרת..."
                  className="h-8 w-32 bg-gray-100 border-2 border-amber-300 text-gray-800 text-xs placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTitle();
                    }
                  }}
                />
                <button
                  type="button"
                  className="h-8 w-8 flex items-center justify-center rounded-md bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-md"
                  onClick={() => {
                    console.log('[SaveTimeDialog] Plus button clicked, input:', newTitleInput);
                    addTitle();
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Bulk titles */}
            {showBulkTitles && (
              <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/60">הכנס כל כותרת בשורה נפרדת:</div>
                <Textarea
                  value={bulkTitlesInput}
                  onChange={(e) => setBulkTitlesInput(e.target.value)}
                  placeholder={"חוזה\nבקרת תכן\nתשלום לקוח"}
                  className="h-20 bg-white/5 border-white/20 text-white text-xs resize-none"
                />
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    className="h-7 text-xs bg-amber-500 text-slate-900 hover:bg-amber-400"
                    onClick={addBulkTitles}
                  >
                    <Plus className="h-3 w-3 ml-1" />
                    הוסף הכל
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs border-white/20 text-white hover:bg-white/10"
                    onClick={() => setShowBulkTitles(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}

            {/* Manual title input */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="מה עשית?"
              className="h-10 bg-white/5 border-white/20 text-white"
            />
          </div>

          {/* ===== NOTES SECTION ===== */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                הערות (אופציונלי)
              </h3>
              <button
                type="button"
                className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 text-xs"
                onClick={() => setShowBulkNotes(!showBulkNotes)}
              >
                <ListPlus className="h-3.5 w-3.5" />
                הוספה מרובה
              </button>
            </div>

            {/* Quick Note Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickNotes.map((n, idx) => (
                editingNote?.index === idx ? (
                  <div key={`note-edit-${idx}`} className="flex gap-1">
                    <Input
                      value={editingNote.value}
                      onChange={(e) => setEditingNote({ ...editingNote, value: e.target.value })}
                      className="h-8 w-32 bg-white/10 border-sky-500 text-white text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditNote();
                        if (e.key === 'Escape') setEditingNote(null);
                      }}
                    />
                    <button
                      type="button"
                      className="h-8 w-8 flex items-center justify-center rounded bg-green-600 hover:bg-green-500 text-white"
                      onClick={saveEditNote}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div key={`note-${idx}`} className="group relative">
                    <button
                      type="button"
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg border-2 transition-all font-medium",
                        notes === n
                          ? "bg-sky-500 text-white border-sky-400 shadow-lg"
                          : "bg-white/5 border-white/20 hover:border-sky-500/60 hover:bg-white/10 text-white"
                      )}
                      onClick={() => selectNote(n)}
                    >
                      {n}
                    </button>
                    <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5 z-10">
                      <button
                        type="button"
                        className="p-0.5 rounded bg-blue-500 text-white hover:bg-blue-400"
                        onClick={() => startEditNote(idx, n)}
                      >
                        <Edit2 className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        className="p-0.5 rounded bg-red-500 text-white hover:bg-red-400"
                        onClick={() => removeNote(idx)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                )
              ))}
              
              {/* Add single note */}
              <div className="flex gap-1 items-center">
                <Input
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  placeholder="הוסף הערה..."
                  className="h-8 w-32 bg-gray-100 border-2 border-sky-300 text-gray-800 text-xs placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addNote();
                    }
                  }}
                />
                <button
                  type="button"
                  className="h-8 w-8 flex items-center justify-center rounded-md bg-sky-500 text-white hover:bg-sky-400 shadow-md"
                  onClick={() => {
                    console.log('[SaveTimeDialog] Plus note button clicked, input:', newNoteInput);
                    addNote();
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Bulk notes */}
            {showBulkNotes && (
              <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/60">הכנס כל הערה בשורה נפרדת:</div>
                <Textarea
                  value={bulkNotesInput}
                  onChange={(e) => setBulkNotesInput(e.target.value)}
                  placeholder={"מיילים\nמסמכים\nפיקוח"}
                  className="h-20 bg-white/5 border-white/20 text-white text-xs resize-none"
                />
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    className="h-7 text-xs bg-sky-500 text-white hover:bg-sky-400"
                    onClick={addBulkNotes}
                  >
                    <Plus className="h-3 w-3 ml-1" />
                    הוסף הכל
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs border-white/20 text-white hover:bg-white/10"
                    onClick={() => setShowBulkNotes(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}

            {/* Manual notes input */}
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות..."
              className="min-h-[80px] bg-white/5 border-white/20 text-white resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            type="button"
            className="flex-1 h-11 text-base bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 rounded-xl font-semibold shadow-lg"
            onClick={handleSave}
          >
            <Save className="h-5 w-5 ml-2" />
            שמור
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 px-6 border-white/30 text-white hover:bg-white/10 rounded-xl"
            onClick={() => {
              // Resume timer on cancel if callback provided
              if (onCancel) {
                onCancel();
              }
              onOpenChange(false);
            }}
          >
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
