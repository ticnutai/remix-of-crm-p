// Time Entries List - tenarch CRM Pro - Navy & Gold Theme
import React, { useEffect, useState } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Briefcase, User, Trash2, Sparkles, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTimerTheme } from './TimerThemeContext';
interface Project {
  id: string;
  name: string;
}
interface Client {
  id: string;
  name: string;
}
export function TimeEntriesList() {
  const {
    todayEntries,
    refreshEntries
  } = useTimer();
  const {
    theme: timerTheme
  } = useTimerTheme();
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');

  // Fetch project and client names
  useEffect(() => {
    async function fetchNames() {
      const [projectsRes, clientsRes] = await Promise.all([supabase.from('projects').select('id, name'), supabase.from('clients').select('id, name')]);
      if (projectsRes.data) {
        const projectMap: Record<string, string> = {};
        projectsRes.data.forEach(p => {
          projectMap[p.id] = p.name;
        });
        setProjects(projectMap);
      }
      if (clientsRes.data) {
        const clientMap: Record<string, string> = {};
        clientsRes.data.forEach(c => {
          clientMap[c.id] = c.name;
        });
        setClients(clientMap);
      }
    }
    fetchNames();
  }, []);
  const startEditing = (entryId: string, currentDescription: string) => {
    setEditingId(entryId);
    setEditingDescription(currentDescription || '');
  };
  const cancelEditing = () => {
    setEditingId(null);
    setEditingDescription('');
  };
  const saveDescription = async (entryId: string) => {
    const {
      error
    } = await supabase.from('time_entries').update({
      description: editingDescription.trim() || null
    }).eq('id', entryId);
    if (error) {
      toast.error('שגיאה בשמירת התיאור');
    } else {
      toast.success('התיאור נשמר');
      await refreshEntries();
    }
    setEditingId(null);
    setEditingDescription('');
  };
  const formatDuration = (minutes: number | null, isRunning: boolean, startTime: string) => {
    let totalMinutes = minutes || 0;
    if (isRunning) {
      const start = new Date(startTime);
      totalMinutes = Math.floor((Date.now() - start.getTime()) / 60000);
    }
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}:${mins}`;
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${date.getMinutes()}`;
  };
  const handleDelete = async (id: string) => {
    const {
      error
    } = await supabase.from('time_entries').delete().eq('id', id);
    if (!error) {
      await refreshEntries();
    }
  };
  if (todayEntries.length === 0) {
    return <div className="flex flex-col items-center justify-center py-8 text-center" dir="rtl">
        
        <p className="text-[hsl(45,50%,65%)] text-base font-semibold">אין רישומי זמן להיום</p>
        <p className="text-[hsl(220,30%,55%)] text-sm mt-1">התחל את הטיימר כדי לתעד את העבודה שלך</p>
      </div>;
  }
  return <div className="space-y-2" dir="rtl">
      {todayEntries.map(entry => <div key={entry.id} className={cn("group p-4 rounded-xl transition-all duration-200", "bg-[hsl(220,60%,20%)] hover:bg-[hsl(220,60%,24%)]", "border-2 border-[hsl(45,80%,50%)]/20 hover:border-[hsl(45,80%,50%)]/40", "hover:shadow-lg hover:shadow-[hsl(45,80%,50%)]/10", entry.is_running && "border-[hsl(45,80%,55%)] bg-[hsl(220,60%,22%)] shadow-md shadow-[hsl(45,80%,50%)]/20")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Description - Editable */}
              {editingId === entry.id ? <div className="flex items-center gap-2">
                  <Input value={editingDescription} onChange={e => setEditingDescription(e.target.value)} className="h-8 text-sm bg-white/10 border-[hsl(45,80%,50%)]/50 text-white" placeholder="הזן תיאור..." autoFocus onKeyDown={e => {
              if (e.key === 'Enter') saveDescription(entry.id);
              if (e.key === 'Escape') cancelEditing();
            }} />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/20" onClick={() => saveDescription(entry.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={cancelEditing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div> : <button onClick={() => startEditing(entry.id, entry.description || '')} className={cn("font-semibold truncate text-right w-full flex items-center gap-2 group/desc", "hover:opacity-80 transition-opacity cursor-pointer")} style={{
            color: entry.description ? timerTheme.entryTextColor || 'rgba(255,255,255,0.9)' : timerTheme.labelsColor || 'hsl(45,40%,55%)',
            fontSize: `${timerTheme.entryFontSize || 14}px`,
            fontFamily: timerTheme.entryFontFamily ? `"${timerTheme.entryFontFamily}", sans-serif` : undefined,
            fontStyle: entry.description ? 'normal' : 'italic'
          }}>
                  <span className="truncate">{entry.description || 'ללא תיאור'}</span>
                  <Edit2 className="h-3 w-3 opacity-0 group-hover/desc:opacity-60 transition-opacity shrink-0" />
                </button>}

              {/* Project & Client */}
              <div className="flex flex-wrap gap-2 mt-2">
                {entry.project_id && projects[entry.project_id] && <Badge className="text-xs bg-[hsl(220,60%,30%)] text-[hsl(45,70%,65%)] border border-[hsl(45,80%,50%)]/30 hover:bg-[hsl(220,60%,35%)]">
                    <Briefcase className="h-3 w-3 ml-1" />
                    {projects[entry.project_id]}
                  </Badge>}
                {entry.client_id && clients[entry.client_id] && <Badge className="text-xs bg-[hsl(220,60%,30%)] text-[hsl(45,70%,65%)] border border-[hsl(45,80%,50%)]/30 hover:bg-[hsl(220,60%,35%)]">
                    <User className="h-3 w-3 ml-1" />
                    {clients[entry.client_id]}
                  </Badge>}
                {entry.is_billable && <Badge className="text-xs bg-gradient-to-r from-[hsl(45,80%,50%)] to-[hsl(45,90%,45%)] text-[hsl(220,60%,15%)] font-semibold">
                    לחיוב
                  </Badge>}
              </div>

              {/* Time range */}
              <p className="text-xs text-[hsl(220,40%,55%)] mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(entry.start_time)}
                {entry.end_time ? ` - ${formatTime(entry.end_time)}` : ' - פעיל...'}
              </p>
            </div>

            {/* Duration & Actions */}
            <div className="flex flex-col items-end gap-2">
              <div className={cn("font-mono text-xl font-bold", entry.is_running ? "text-[hsl(45,90%,60%)] drop-shadow-[0_0_8px_rgba(200,160,60,0.5)]" : "text-[hsl(45,70%,60%)]")}>
                {formatDuration(entry.duration_minutes, entry.is_running ?? false, entry.start_time)}
              </div>

              {!entry.is_running && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[hsl(220,30%,50%)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDelete(entry.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>}
            </div>
          </div>
        </div>)}
    </div>;
}