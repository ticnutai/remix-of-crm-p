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
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, Square, Clock, Target, Briefcase, User, 
  Pause, RotateCcw, Save, FileText,
  Check, X, ChevronDown, ChevronUp
} from 'lucide-react';
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
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [editingTabValue, setEditingTabValue] = useState('');

  // Save quick titles to localStorage
  useEffect(() => {
    localStorage.setItem(QUICK_TITLES_KEY, JSON.stringify(quickTitles));
  }, [quickTitles]);

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
    <div className="relative">
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
              <Popover open={showSavePanel} onOpenChange={setShowSavePanel}>
                <PopoverTrigger asChild>
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
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[280px] bg-gradient-to-br from-[hsl(220,60%,18%)] to-[hsl(220,60%,22%)] border-[hsl(45,80%,50%)] text-white p-3 shadow-xl rounded-xl"
                  side="top"
                  align="end"
                >
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-[hsl(45,80%,60%)] flex items-center gap-2">
                      <Save className="h-3.5 w-3.5" />
                      שמירת רישום
                    </h4>
                    
                    {/* Quick Titles */}
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {quickTitles.slice(0, 4).map((title) => (
                          <button
                            key={title}
                            onClick={() => selectQuickTitle(title)}
                            className={cn(
                              "px-2 py-1 text-[10px] rounded border transition-all",
                              description === title
                                ? "bg-[hsl(45,80%,50%)] text-[hsl(220,60%,15%)] border-[hsl(45,80%,60%)]"
                                : "bg-[hsl(220,60%,30%)] border-white/20 hover:border-[hsl(45,80%,50%)]/50"
                            )}
                          >
                            {title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes Input */}
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="הערות..."
                      className="h-8 bg-[hsl(220,60%,30%)] border-white/20 text-white text-xs rounded-lg"
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="flex-1 h-8 text-xs bg-gradient-to-r from-[hsl(45,80%,50%)] to-[hsl(45,90%,45%)] text-[hsl(220,60%,15%)] hover:from-[hsl(45,80%,55%)] hover:to-[hsl(45,90%,50%)] rounded-lg"
                      >
                        <Check className="h-3.5 w-3.5 ml-1" />
                        שמור
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSavePanel(false)}
                        className="h-8 w-8 p-0 border-white/30 text-white hover:bg-white/10 rounded-lg"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
      </div>
    </div>
  );
}
