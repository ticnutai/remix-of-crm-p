// טיימר פעיל - מעקב זמן בזמן אמת
// קומפוננטה צפה למעקב זמן

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Pause,
  Square,
  Clock,
  Briefcase,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ActiveTimer {
  id: string;
  project_id: string;
  project_name: string;
  description: string;
  start_time: string;
  elapsed: number; // בשניות
}

export function ActiveTimer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // שליפת פרויקטים
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-timer'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  // בדיקה אם יש טיימר פעיל
  const { data: runningEntry } = useQuery({
    queryKey: ['running-time-entry', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('time_entries')
        .select('id, project_id, description, start_time, projects(name)')
        .is('end_time', null)
        .eq('user_id', user?.id)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // רענון כל דקה
  });

  // סנכרון טיימר פעיל
  useEffect(() => {
    if (runningEntry) {
      const startTime = new Date(runningEntry.start_time);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      setActiveTimer({
        id: runningEntry.id,
        project_id: runningEntry.project_id,
        project_name: (runningEntry.projects as any)?.name || 'פרויקט לא ידוע',
        description: runningEntry.description || '',
        start_time: runningEntry.start_time,
        elapsed: elapsedSeconds,
      });
      setElapsed(elapsedSeconds);
      setDescription(runningEntry.description || '');
    } else {
      setActiveTimer(null);
    }
  }, [runningEntry]);

  // עדכון טיימר כל שניה
  useEffect(() => {
    if (!activeTimer) return;
    
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeTimer]);

  // התחלת טיימר
  const startMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject) throw new Error('יש לבחור פרויקט');
      
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user?.id,
          project_id: selectedProject.id,
          description: description || '',
          start_time: new Date().toISOString(),
        }])
        .select('id')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['running-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: 'הטיימר הופעל' });
    },
    onError: (error: any) => {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // עצירת טיימר
  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!activeTimer) return;
      
      const endTime = new Date();
      const startTime = new Date(activeTimer.start_time);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000); // דקות
      
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration: duration,
          description: description,
        })
        .eq('id', activeTimer.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setActiveTimer(null);
      setElapsed(0);
      setDescription('');
      setSelectedProject(null);
      queryClient.invalidateQueries({ queryKey: ['running-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: 'הזמן נשמר' });
    },
    onError: (error: any) => {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // עדכון תיאור
  const updateDescription = useCallback(async () => {
    if (!activeTimer) return;
    
    await supabase
      .from('time_entries')
      .update({ description })
      .eq('id', activeTimer.id);
  }, [activeTimer, description]);

  // פורמט זמן
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // אם ממוזער
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 left-4 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {activeTimer && (
            <span className="font-mono text-sm font-bold">
              {formatTime(elapsed)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 bg-card border rounded-lg shadow-xl w-80"
      dir="rtl"
    >
      {/* כותרת */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <span className="font-medium">מעקב זמן</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsMinimized(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* תצוגת זמן */}
        <div className="text-center">
          <div className={`font-mono text-4xl font-bold ${activeTimer ? 'text-primary' : 'text-muted-foreground'}`}>
            {formatTime(elapsed)}
          </div>
          {activeTimer && (
            <Badge variant="outline" className="mt-2">
              <Briefcase className="h-3 w-3 ml-1" />
              {activeTimer.project_name}
            </Badge>
          )}
        </div>

        {/* בחירת פרויקט */}
        {!activeTimer && (
          <Popover open={projectsOpen} onOpenChange={setProjectsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {selectedProject ? selectedProject.name : 'בחר פרויקט...'}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" dir="rtl">
              <Command>
                <CommandInput placeholder="חפש פרויקט..." />
                <CommandList>
                  <CommandEmpty>לא נמצאו פרויקטים</CommandEmpty>
                  <CommandGroup>
                    {projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        value={project.name}
                        onSelect={() => {
                          setSelectedProject(project);
                          setProjectsOpen(false);
                        }}
                      >
                        <Briefcase className="h-4 w-4 ml-2" />
                        {project.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* תיאור */}
        <Input
          placeholder="מה אתה עובד עליו?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={updateDescription}
        />

        {/* כפתורי פעולה */}
        <div className="flex gap-2">
          {!activeTimer ? (
            <Button
              className="flex-1"
              onClick={() => startMutation.mutate()}
              disabled={!selectedProject || startMutation.isPending}
            >
              <Play className="h-4 w-4 ml-2" />
              התחל
            </Button>
          ) : (
            <>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
              >
                <Square className="h-4 w-4 ml-2" />
                עצור ושמור
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActiveTimer;
