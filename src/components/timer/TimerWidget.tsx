// Timer Widget - e-control CRM Pro - Unified Luxurious Design
import React, { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, Square, Clock, Target, Briefcase, User, 
  Pause, RotateCcw, Save, FileText,
  Check, X, ChevronDown, ChevronUp, Settings, Plus, Trash2, Edit, ListPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTimerTheme, TIMER_COLOR_MAP } from './TimerThemeContext';

// Get hooks outside component to use in render

interface Project {
  id: string;
  name: string;
  client_id: string | null;
}

interface Client {
  id: string;
  name: string;
}

// Default quick options - can be customized
const DEFAULT_QUICK_TITLES = [
  'פגישת לקוח',
  'עדכון פרויקט',
  'תכנון ועיצוב',
  'ביקורת באתר',
];

const QUICK_NOTES = [
  'מיילים והתכתבויות',
  'הכנת מסמכים',
  'עבודה פנימית',
  'פיקוח ובקרה',
  'מחקר ולמידה',
  'תיאום לוחות זמנים',
];

const TIMER_COLLAPSED_KEY = 'timer-widget-collapsed';
const RECENT_CLIENTS_KEY = 'timer-recent-clients';
const QUICK_TITLES_KEY = 'timer-quick-titles';
const QUICK_NOTES_KEY = 'timer-quick-notes';

interface TimerWidgetProps {
  showTimerDisplay?: boolean;
}

export function TimerWidget({ showTimerDisplay = true }: TimerWidgetProps) {
  const { theme, getInputBgStyle, getInputTextStyle, getIconStyle, getFrameStyle, getTimerDisplayStyle } = useTimerTheme();
  const { 
    timerState, 
    startTimer, 
    stopTimer, 
    pauseTimer, 
    resumeTimer,
    updateDescription, 
    todayTotal, 
    weekTotal,
    resetTimer,
    saveEntry,
    updateTags
  } = useTimer();
  
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(TIMER_COLLAPSED_KEY);
    return saved === 'true';
  });
  const [recentClients, setRecentClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(RECENT_CLIENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [quickTitles, setQuickTitles] = useState<string[]>(() => {
    const saved = localStorage.getItem(QUICK_TITLES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_TITLES;
  });
  const [quickNotes, setQuickNotes] = useState<string[]>(() => {
    const saved = localStorage.getItem(QUICK_NOTES_KEY);
    return saved ? JSON.parse(saved) : QUICK_NOTES;
  });
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [editingTabValue, setEditingTabValue] = useState('');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [bulkTitlesInput, setBulkTitlesInput] = useState('');
  const [bulkNotesInput, setBulkNotesInput] = useState('');
  const [showBulkTitles, setShowBulkTitles] = useState(false);
  const [showBulkNotes, setShowBulkNotes] = useState(false);
  const [editingTitleIndex, setEditingTitleIndex] = useState<number | null>(null);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [editingNoteValue, setEditingNoteValue] = useState('');

  // Save quick titles to localStorage
  useEffect(() => {
    localStorage.setItem(QUICK_TITLES_KEY, JSON.stringify(quickTitles));
  }, [quickTitles]);

  // Save quick notes to localStorage
  useEffect(() => {
    localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify(quickNotes));
  }, [quickNotes]);

  // Functions to manage quick titles
  const addQuickTitle = () => {
    if (newTitleInput.trim() && !quickTitles.includes(newTitleInput.trim())) {
      setQuickTitles([...quickTitles, newTitleInput.trim()]);
      setNewTitleInput('');
    }
  };

  const removeQuickTitle = (index: number) => {
    setQuickTitles(quickTitles.filter((_, i) => i !== index));
  };

  // Functions to manage quick notes
  const addQuickNote = () => {
    if (newNoteInput.trim() && !quickNotes.includes(newNoteInput.trim())) {
      setQuickNotes([...quickNotes, newNoteInput.trim()]);
      setNewNoteInput('');
    }
  };

  const removeQuickNote = (index: number) => {
    setQuickNotes(quickNotes.filter((_, i) => i !== index));
  };

  const selectQuickNote = (note: string) => {
    setNotes(note);
  };

  // Add bulk titles (multiple lines)
  const addBulkTitles = () => {
    if (bulkTitlesInput.trim()) {
      const newTitles = bulkTitlesInput
        .split('\n')
        .map(t => t.trim())
        .filter(t => t && !quickTitles.includes(t));
      if (newTitles.length > 0) {
        setQuickTitles([...quickTitles, ...newTitles]);
      }
      setBulkTitlesInput('');
      setShowBulkTitles(false);
    }
  };

  // Add bulk notes (multiple lines)
  const addBulkNotes = () => {
    if (bulkNotesInput.trim()) {
      const newNotes = bulkNotesInput
        .split('\n')
        .map(n => n.trim())
        .filter(n => n && !quickNotes.includes(n));
      if (newNotes.length > 0) {
        setQuickNotes([...quickNotes, ...newNotes]);
      }
      setBulkNotesInput('');
      setShowBulkNotes(false);
    }
  };

  // Edit title
  const startEditTitle = (index: number, value: string) => {
    setEditingTitleIndex(index);
    setEditingTitleValue(value);
  };

  const saveEditTitle = () => {
    if (editingTitleIndex !== null && editingTitleValue.trim()) {
      const newTitles = [...quickTitles];
      newTitles[editingTitleIndex] = editingTitleValue.trim();
      setQuickTitles(newTitles);
    }
    setEditingTitleIndex(null);
    setEditingTitleValue('');
  };

  // Edit note
  const startEditNote = (index: number, value: string) => {
    setEditingNoteIndex(index);
    setEditingNoteValue(value);
  };

  const saveEditNote = () => {
    if (editingNoteIndex !== null && editingNoteValue.trim()) {
      const newNotes = [...quickNotes];
      newNotes[editingNoteIndex] = editingNoteValue.trim();
      setQuickNotes(newNotes);
    }
    setEditingNoteIndex(null);
    setEditingNoteValue('');
  };

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem(TIMER_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Fetch projects and clients
  useEffect(() => {
    async function fetchData() {
      const [projectsRes, clientsRes] = await Promise.all([
        supabase.from('projects').select('id, name, client_id').order('name'),
        supabase.from('clients').select('id, name').order('name'),
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
    }
    fetchData();
  }, []);

  // Sync description with current entry
  useEffect(() => {
    if (timerState.currentEntry?.description) {
      setDescription(timerState.currentEntry.description);
    }
    if (timerState.currentEntry?.tags) {
      setSelectedTags(timerState.currentEntry.tags);
    }
  }, [timerState.currentEntry]);

  // Auto-select client when project is selected
  useEffect(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject);
      if (project?.client_id) {
        setSelectedClient(project.client_id);
      }
    }
  }, [selectedProject, projects]);

  // Get selected client name
  const selectedClientName = clients.find(c => c.id === selectedClient)?.name;
  const selectedProjectName = projects.find(p => p.id === selectedProject)?.name;

  // Add client to recent list when selected
  const addToRecentClients = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const filtered = recentClients.filter(c => c.id !== clientId);
    const updated = [client, ...filtered].slice(0, 5);
    setRecentClients(updated);
    localStorage.setItem(RECENT_CLIENTS_KEY, JSON.stringify(updated));
  };

  const handleClientSelect = async (val: string) => {
    const clientId = val === "__none__" ? "" : val;
    setSelectedClient(clientId);
    if (clientId) {
      addToRecentClients(clientId);
      // Start timer immediately when client is selected
      if (!timerState.isRunning) {
        await startTimer(
          selectedProject || undefined,
          clientId,
          description || undefined,
          selectedTags.length > 0 ? selectedTags : undefined
        );
        toast.success('הטיימר התחיל לרוץ');
      }
    }
  };

  const handleStart = async () => {
    if (!selectedClient) {
      toast.error('יש לבחור לקוח לפני הפעלת הטיימר');
      return;
    }
    await startTimer(
      selectedProject || undefined,
      selectedClient || undefined,
      description || undefined,
      selectedTags.length > 0 ? selectedTags : undefined
    );
  };

  const handleStop = async () => {
    await stopTimer();
    setDescription('');
    setNotes('');
    setSelectedProject('');
    setSelectedClient('');
    setSelectedTags([]);
    setShowSavePanel(false);
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    resumeTimer();
  };

  const handleReset = () => {
    if (resetTimer) {
      resetTimer();
    }
    setDescription('');
    setNotes('');
    setSelectedTags([]);
  };

  const handleSave = async () => {
    if (saveEntry) {
      await saveEntry(notes);
    }
    setShowSavePanel(false);
    setNotes('');
  };

  const handleDescriptionBlur = () => {
    if (timerState.isRunning && description !== timerState.currentEntry?.description) {
      updateDescription(description);
    }
  };

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    
    if (timerState.isRunning && updateTags) {
      updateTags(newTags);
    }
  };

  const selectQuickTitle = (title: string) => {
    setDescription(title);
    if (timerState.isRunning) {
      updateDescription(title);
    }
  };

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  const isPaused = !timerState.isRunning && timerState.currentEntry && timerState.elapsed > 0;

  return (
    <div className="relative" dir="rtl">
      {/* Main Content - Transparent background to blend with FloatingTimer */}
      <div className="flex flex-col gap-3">
        {/* Client Selection - Always Visible */}
        {!timerState.isRunning && (
          <div className="flex items-center gap-2">
            <Select
              value={selectedClient || "__none__"}
              onValueChange={handleClientSelect}
              disabled={timerState.isRunning}
            >
              <SelectTrigger 
                className={cn(
                  "flex-1 h-9 text-xs rounded-xl shadow-sm",
                  !selectedClient ? "border-[hsl(45,80%,50%)]/50 ring-1 ring-[hsl(45,80%,50%)]/30" : ""
                )}
                style={{
                  ...getInputBgStyle(),
                  ...getInputTextStyle(),
                }}
              >
                <User className="h-3.5 w-3.5 ml-1" style={getIconStyle()} />
                <SelectValue placeholder="בחר לקוח *" />
              </SelectTrigger>
              <SelectContent 
                className="z-[9999]"
                style={{
                  ...getInputBgStyle(),
                  ...getInputTextStyle(),
                }}
              >
                <SelectItem value="__none__" style={getInputTextStyle()}>בחר לקוח</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id} style={getInputTextStyle()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Timer Display + Control Buttons - Only shown if showTimerDisplay is true */}
        {showTimerDisplay && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col flex-1">
            <div 
              className={cn(
                "font-mono font-bold tracking-widest transition-all duration-300",
                timerState.isRunning && "drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]"
              )}
              style={{
                ...getTimerDisplayStyle(),
                // Override color based on state
                color: timerState.isRunning 
                  ? 'hsl(45, 85%, 65%)' 
                  : isPaused 
                    ? 'hsl(30, 90%, 60%)' // Orange for paused
                    : getTimerDisplayStyle().color, // Use contrast color when not running
              }}
            >
              {formatTime(timerState.elapsed)}
            </div>
            
            {/* Show selected client/project when running */}
            {(timerState.isRunning || isPaused) && (selectedClientName || selectedProjectName) && (
              <div className="flex items-center gap-2 mt-1.5">
                {selectedClientName && (
                  <div className="flex items-center gap-1 text-[10px] bg-[hsl(45,80%,50%)]/20 text-[hsl(45,80%,70%)] px-2 py-0.5 rounded-full border border-[hsl(45,80%,50%)]/30">
                    <User className="h-2.5 w-2.5" />
                    <span>{selectedClientName}</span>
                  </div>
                )}
                {selectedProjectName && (
                  <div className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <Briefcase className="h-2.5 w-2.5" />
                    <span className="truncate max-w-[80px]">{selectedProjectName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 transition-all"
              style={{
                color: timerState.isRunning 
                  ? (theme.controlButtonsActiveColor || 'hsl(45, 85%, 65%)') 
                  : (theme.controlButtonsIdleColor || 'hsl(45, 80%, 55%)'),
              }}
              onClick={timerState.isRunning ? handlePause : isPaused ? handleResume : handleStart}
            >
              {timerState.isRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            {/* Stop Button */}
            {(timerState.isRunning || isPaused) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 transition-all"
                style={{
                  color: timerState.isRunning 
                    ? (theme.controlButtonsActiveColor || 'hsl(45, 85%, 65%)') 
                    : (theme.controlButtonsIdleColor || 'hsl(45, 80%, 55%)'),
                }}
                onClick={handleStop}
              >
                <Square className="h-4 w-4" />
              </Button>
            )}

            {/* Reset Button */}
            {timerState.elapsed > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 transition-all"
                style={{
                  color: timerState.isRunning 
                    ? (theme.controlButtonsActiveColor || 'hsl(45, 85%, 65%)') 
                    : (theme.controlButtonsIdleColor || 'hsl(45, 80%, 55%)'),
                }}
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}

            {/* Save Button */}
            {timerState.elapsed > 0 && (
              <Dialog open={showSavePanel} onOpenChange={setShowSavePanel}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 w-10 rounded-xl p-0 backdrop-blur-sm transition-all"
                    style={{
                      borderColor: timerState.isRunning 
                        ? `${theme.controlButtonsActiveColor || 'hsl(45, 80%, 50%)'}80` 
                        : 'rgba(255,255,255,0.3)',
                      color: timerState.isRunning 
                        ? (theme.controlButtonsActiveColor || 'hsl(45, 80%, 60%)') 
                        : 'white',
                    }}
                    onClick={async () => {
                      // Stop timer first, then dialog opens automatically
                      if (timerState.isRunning) {
                        await stopTimer();
                      }
                    }}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  dir="rtl"
                  className="max-w-lg bg-gradient-to-br from-[hsl(220,60%,15%)] to-[hsl(220,60%,20%)] border-2 border-[hsl(45,80%,50%)] text-white shadow-2xl rounded-2xl"
                  onPointerDownOutside={(e) => e.preventDefault()}
                  onInteractOutside={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle className="text-[hsl(45,80%,60%)] flex items-center gap-2 text-lg">
                      <Save className="h-5 w-5" />
                      שמירת רישום זמן
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-5 mt-4">
                    {/* TITLES SECTION */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[hsl(45,80%,65%)] flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          כותרת
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowBulkTitles(!showBulkTitles);
                          }}
                          className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 text-xs"
                          title="הוספה מרובה"
                        >
                          <ListPlus className="h-3.5 w-3.5" />
                          הוספה מרובה
                        </button>
                      </div>
                      
                      {/* Quick Title Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {quickTitles.map((title, index) => (
                          editingTitleIndex === index ? (
                            <div key={index} className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editingTitleValue}
                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                className="h-8 w-32 bg-white/10 border-[hsl(45,80%,50%)] text-white text-xs"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); saveEditTitle(); } if (e.key === 'Escape') setEditingTitleIndex(null); }}
                              />
                              <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); e.preventDefault(); saveEditTitle(); }} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-500">
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div key={index} className="group relative">
                              <button
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  e.preventDefault();
                                  console.log('Title selected:', title);
                                  selectQuickTitle(title); 
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className={cn(
                                  "px-3 py-1.5 text-xs rounded-lg border-2 transition-all font-medium",
                                  description === title
                                    ? "bg-[hsl(45,80%,50%)] text-[hsl(220,60%,15%)] border-[hsl(45,80%,60%)] shadow-lg"
                                    : "bg-white/5 border-white/20 hover:border-[hsl(45,80%,50%)]/60 hover:bg-white/10"
                                )}
                              >
                                {title}
                              </button>
                              <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); startEditTitle(index, title); }}
                                  className="p-0.5 rounded bg-blue-500 text-white hover:bg-blue-400"
                                >
                                  <Edit className="h-2.5 w-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeQuickTitle(index); }}
                                  className="p-0.5 rounded bg-red-500 text-white hover:bg-red-400"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </div>
                          )
                        ))}
                        {/* Add single title */}
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={newTitleInput}
                            onChange={(e) => setNewTitleInput(e.target.value)}
                            placeholder="הוסף כותרת..."
                            className="h-8 w-28 bg-white/5 border-white/20 text-white text-xs"
                            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); addQuickTitle(); } }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              e.preventDefault(); 
                              console.log('Plus button clicked for title'); 
                              addQuickTitle(); 
                            }} 
                            onMouseDown={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0 bg-[hsl(45,80%,50%)] text-[hsl(220,60%,15%)] hover:bg-[hsl(45,80%,60%)]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Bulk titles input */}
                      {showBulkTitles && (
                        <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-[10px] text-white/60">הכנס כל כותרת בשורה נפרדת:</div>
                          <Textarea
                            value={bulkTitlesInput}
                            onChange={(e) => setBulkTitlesInput(e.target.value)}
                            placeholder="חוזה&#10;בקרת תכן&#10;תשלום לקוח&#10;..."
                            className="h-20 bg-white/5 border-white/20 text-white text-xs resize-none"
                          />
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); e.preventDefault(); addBulkTitles(); }} className="h-7 text-xs bg-[hsl(45,80%,50%)] text-[hsl(220,60%,15%)]">
                              <Plus className="h-3 w-3 ml-1" />
                              הוסף הכל
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setShowBulkTitles(false); }} className="h-7 text-xs border-white/20 text-white hover:bg-white/10">
                              ביטול
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Manual title input */}
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="או הקלד כותרת ידנית..."
                        className="h-9 bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>

                    {/* NOTES SECTION */}
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[hsl(200,70%,60%)] flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          הערות
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowBulkNotes(!showBulkNotes);
                          }}
                          className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 text-xs"
                          title="הוספה מרובה"
                        >
                          <ListPlus className="h-3.5 w-3.5" />
                          הוספה מרובה
                        </button>
                      </div>
                      
                      {/* Quick Note Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {quickNotes.map((note, index) => (
                          editingNoteIndex === index ? (
                            <div key={index} className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editingNoteValue}
                                onChange={(e) => setEditingNoteValue(e.target.value)}
                                className="h-8 w-32 bg-white/10 border-[hsl(200,70%,50%)] text-white text-xs"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); saveEditNote(); } if (e.key === 'Escape') setEditingNoteIndex(null); }}
                              />
                              <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); e.preventDefault(); saveEditNote(); }} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-500">
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div key={index} className="group relative">
                              <button
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  e.preventDefault();
                                  console.log('Note selected:', note);
                                  selectQuickNote(note); 
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className={cn(
                                  "px-3 py-1.5 text-xs rounded-lg border-2 transition-all font-medium",
                                  notes === note
                                    ? "bg-[hsl(200,70%,50%)] text-white border-[hsl(200,70%,60%)] shadow-lg"
                                    : "bg-white/5 border-white/20 hover:border-[hsl(200,70%,50%)]/60 hover:bg-white/10"
                                )}
                              >
                                {note}
                              </button>
                              <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); startEditNote(index, note); }}
                                  className="p-0.5 rounded bg-blue-500 text-white hover:bg-blue-400"
                                >
                                  <Edit className="h-2.5 w-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeQuickNote(index); }}
                                  className="p-0.5 rounded bg-red-500 text-white hover:bg-red-400"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </div>
                          )
                        ))}
                        {/* Add single note */}
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={newNoteInput}
                            onChange={(e) => setNewNoteInput(e.target.value)}
                            placeholder="הוסף הערה..."
                            className="h-8 w-28 bg-white/5 border-white/20 text-white text-xs"
                            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); addQuickNote(); } }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              e.preventDefault(); 
                              console.log('Plus button clicked for note'); 
                              addQuickNote(); 
                            }} 
                            onMouseDown={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0 bg-[hsl(200,70%,50%)] text-white hover:bg-[hsl(200,70%,60%)]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Bulk notes input */}
                      {showBulkNotes && (
                        <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-[10px] text-white/60">הכנס כל הערה בשורה נפרדת:</div>
                          <Textarea
                            value={bulkNotesInput}
                            onChange={(e) => setBulkNotesInput(e.target.value)}
                            placeholder="מיילים&#10;מסמכים&#10;פיקוח&#10;..."
                            className="h-20 bg-white/5 border-white/20 text-white text-xs resize-none"
                          />
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); e.preventDefault(); addBulkNotes(); }} className="h-7 text-xs bg-[hsl(200,70%,50%)] text-white">
                              <Plus className="h-3 w-3 ml-1" />
                              הוסף הכל
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setShowBulkNotes(false); }} className="h-7 text-xs border-white/20 text-white hover:bg-white/10">
                              ביטול
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Manual notes input */}
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="או הקלד הערה ידנית..."
                        className="h-9 bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-3 border-t border-white/10">
                      <Button
                        onClick={handleSave}
                        className="flex-1 h-11 text-base bg-gradient-to-r from-[hsl(45,80%,50%)] to-[hsl(45,90%,45%)] text-[hsl(220,60%,15%)] hover:from-[hsl(45,80%,55%)] hover:to-[hsl(45,90%,50%)] rounded-xl font-semibold shadow-lg"
                      >
                        <Check className="h-5 w-5 ml-2" />
                        שמור רישום
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowSavePanel(false)}
                        className="h-11 px-5 border-white/30 text-white hover:bg-white/10 rounded-xl"
                      >
                        <X className="h-4 w-4 ml-1" />
                        ביטול
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        )}

        {/* Collapsible Section with proper trigger */}
        <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
          {/* Collapse Toggle Header */}
          <div className="flex items-center justify-between py-1.5 border-t border-white/10">
            <span className="text-[10px] text-white flex items-center gap-1">
              <FileText className="h-2.5 w-2.5" />
              פרטים נוספים
            </span>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded gap-0.5"
              >
                <span className="text-[10px]">{isCollapsed ? 'הצג' : 'הסתר'}</span>
                {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-3 overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            {/* Description Input */}
            <Input
              placeholder="על מה אתה עובד?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              className="w-full px-3 h-9 text-xs rounded-lg shadow-inner"
              style={{
                ...getInputBgStyle(),
                ...getInputTextStyle(),
              }}
              disabled={timerState.isRunning && !!timerState.currentEntry}
            />

            {/* Quick Topic Tabs - Editable */}
            <div className="grid grid-cols-2 gap-2">
              {quickTitles.map((title, index) => (
                editingTabIndex === index ? (
                  <input
                    key={index}
                    type="text"
                    value={editingTabValue}
                    onChange={(e) => setEditingTabValue(e.target.value)}
                    onBlur={() => {
                      if (editingTabValue.trim()) {
                        const newTitles = [...quickTitles];
                        newTitles[index] = editingTabValue.trim();
                        setQuickTitles(newTitles);
                      }
                      setEditingTabIndex(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingTabValue.trim()) {
                          const newTitles = [...quickTitles];
                          newTitles[index] = editingTabValue.trim();
                          setQuickTitles(newTitles);
                        }
                        setEditingTabIndex(null);
                      } else if (e.key === 'Escape') {
                        setEditingTabIndex(null);
                      }
                    }}
                    autoFocus
                    className="px-2 py-1.5 text-[10px] text-white bg-[hsl(45,80%,50%)]/20 border border-[hsl(45,80%,50%)]/50 rounded-lg outline-none"
                  />
                ) : (
                  <button
                    key={index}
                    onClick={() => selectQuickTitle(title)}
                    onDoubleClick={() => {
                      setEditingTabIndex(index);
                      setEditingTabValue(title);
                    }}
                    className="px-2 py-1.5 text-[10px] text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[hsl(45,80%,50%)]/30 rounded-lg transition-all"
                    title="לחיצה כפולה לעריכה"
                  >
                    {title}
                  </button>
                )
              ))}
            </div>

            {/* Quick Notes Tabs */}
            <div className="grid grid-cols-2 gap-2">
              {quickNotes.slice(0, 6).map((note, index) => (
                <button
                  key={index}
                  onClick={() => selectQuickNote(note)}
                  className={cn(
                    "px-2 py-1.5 text-[10px] text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[hsl(200,70%,50%)]/30 rounded-lg transition-all",
                    notes === note && "bg-[hsl(200,70%,50%)]/20 border-[hsl(200,70%,50%)]/50 text-white"
                  )}
                >
                  {note}
                </button>
              ))}
            </div>

            {/* Project Selector */}
            <Select
              value={selectedProject || "__none__"}
              onValueChange={(val) => setSelectedProject(val === "__none__" ? "" : val)}
              disabled={timerState.isRunning}
            >
              <SelectTrigger 
                className="w-full h-8 text-[10px] rounded-lg shadow-sm"
                style={{
                  ...getInputBgStyle(),
                  color: 'white',
                }}
              >
                <Briefcase className="h-3 w-3 ml-1" style={{ color: 'white' }} />
                <SelectValue placeholder="פרויקט" />
              </SelectTrigger>
              <SelectContent 
                className="z-[9999]"
                style={{
                  ...getInputBgStyle(),
                  ...getInputTextStyle(),
                }}
              >
                <SelectItem value="__none__" style={getInputTextStyle()}>ללא פרויקט</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id} style={getInputTextStyle()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>

        {/* Settings Icon - Bottom Left */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogTrigger asChild>
            <button
              className="absolute bottom-1 left-1 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
              title="הגדרות כותרות והערות"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent 
            dir="rtl"
            className="max-w-md bg-gradient-to-br from-[hsl(220,60%,18%)] to-[hsl(220,60%,22%)] border-[hsl(45,80%,50%)] text-white"
          >
            <DialogHeader>
              <DialogTitle className="text-[hsl(45,80%,60%)] flex items-center gap-2">
                <Settings className="h-5 w-5" />
                הגדרות כותרות והערות מוצעות
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="titles" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="titles" className="data-[state=active]:bg-[hsl(45,80%,50%)] data-[state=active]:text-[hsl(220,60%,15%)]">
                  כותרות
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-[hsl(45,80%,50%)] data-[state=active]:text-[hsl(220,60%,15%)]">
                  הערות
                </TabsTrigger>
              </TabsList>
              
              {/* Titles Tab */}
              <TabsContent value="titles" className="space-y-3 mt-4">
                <div className="flex gap-2">
                  <Input
                    value={newTitleInput}
                    onChange={(e) => setNewTitleInput(e.target.value)}
                    placeholder="הוסף כותרת חדשה..."
                    className="flex-1 h-9 bg-white/10 border-white/20 text-white text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addQuickTitle()}
                  />
                  <Button
                    size="sm"
                    onClick={addQuickTitle}
                    className="h-9 bg-[hsl(45,80%,50%)] text-[hsl(220,60%,15%)] hover:bg-[hsl(45,80%,60%)]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {quickTitles.map((title, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-sm">{title}</span>
                      <button
                        onClick={() => removeQuickTitle(index)}
                        className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/40">* לחיצה כפולה על כותרת בווידג'ט מאפשרת עריכה ישירה</p>
              </TabsContent>
              
              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-3 mt-4">
                <div className="flex gap-2">
                  <Input
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="הוסף הערה חדשה..."
                    className="flex-1 h-9 bg-white/10 border-white/20 text-white text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addQuickNote()}
                  />
                  <Button
                    size="sm"
                    onClick={addQuickNote}
                    className="h-9 bg-[hsl(45,80%,50%)] text-[hsl(220,60%,15%)] hover:bg-[hsl(45,80%,60%)]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {quickNotes.map((note, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-sm">{note}</span>
                      <button
                        onClick={() => removeQuickNote(index)}
                        className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/40">* ההערות יופיעו כטאבים לבחירה מהירה</p>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
