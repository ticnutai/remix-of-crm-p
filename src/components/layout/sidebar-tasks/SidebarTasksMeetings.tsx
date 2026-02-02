// SidebarTasksMeetings - Main Tasks & Meetings Widget for Sidebar
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasksOptimized as useTasks, Task, TaskInsert } from '@/hooks/useTasksOptimized';
import { useMeetingsOptimized as useMeetings, Meeting, MeetingInsert } from '@/hooks/useMeetingsOptimized';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  CheckSquare,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Bell,
  Loader2,
} from 'lucide-react';
import { 
  isToday, 
  isTomorrow, 
  isThisWeek, 
  parseISO, 
  startOfDay, 
  endOfDay,
  startOfWeek,
  endOfWeek,
  differenceInMinutes,
} from 'date-fns';

// Sub-components
import { SidebarTaskItem } from './SidebarTaskItem';
import { SidebarMeetingItem } from './SidebarMeetingItem';
import { QuickAddTask } from './QuickAddTask';
import { QuickAddMeeting } from './QuickAddMeeting';

// Sidebar colors
const sidebarColors = {
  navy: '#162C58',
  gold: '#D4A843',
  goldLight: '#E8D1B4',
  goldDark: '#B8923A',
  navyLight: '#1E3A6E',
  navyDark: '#0F1F3D',
};

type FilterType = 'today' | 'week' | 'all';

interface SidebarTasksMeetingsProps {
  isCollapsed?: boolean;
}

export function SidebarTasksMeetings({ isCollapsed = false }: SidebarTasksMeetingsProps) {
  const navigate = useNavigate();
  
  // Hooks
  const { tasks, loading: tasksLoading, fetchTasks, createTask, updateTask, deleteTask } = useTasks();
  const { meetings, loading: meetingsLoading, fetchMeetings, createMeeting, updateMeeting, deleteMeeting } = useMeetings();
  
  // Clients state
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  
  // State
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-tasks-open');
    return saved !== 'false';
  });
  const [activeTab, setActiveTab] = useState<'tasks' | 'meetings'>('tasks');
  const [filter, setFilter] = useState<FilterType>('today');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'task' | 'meeting'; item: Task | Meeting } | null>(null);
  const [upcomingMeetingsCount, setUpcomingMeetingsCount] = useState(0);
  
  // Fetch clients
  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');
    if (data) setClients(data);
  }, []);
  
  // Save open state
  useEffect(() => {
    localStorage.setItem('sidebar-tasks-open', String(isOpen));
  }, [isOpen]);
  
  // Fetch data on mount
  useEffect(() => {
    fetchTasks();
    fetchMeetings();
    fetchClients();
  }, [fetchTasks, fetchMeetings, fetchClients]);
  
  // Check for upcoming meetings (within 15 minutes)
  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      const upcoming = meetings.filter(m => {
        if (m.status !== 'scheduled') return false;
        const meetingStartTime = parseISO(m.start_time);
        const mins = differenceInMinutes(meetingStartTime, now);
        return mins >= 0 && mins <= 15;
      });
      setUpcomingMeetingsCount(upcoming.length);
    };
    
    checkUpcoming();
    const interval = setInterval(checkUpcoming, 30000);
    return () => clearInterval(interval);
  }, [meetings]);
  
  // Filter tasks based on selected filter
  const filteredTasks = useMemo(() => {
    const now = new Date();
    
    return tasks.filter(task => {
      // Don't show completed tasks in today/week view
      if (task.status === 'completed' && filter !== 'all') return false;
      
      if (filter === 'all') return true;
      
      if (!task.due_date) {
        // Tasks without due date show in all filters except "today"
        return filter === 'week';
      }
      
      const dueDate = parseISO(task.due_date);
      
      if (filter === 'today') {
        return isToday(dueDate);
      }
      
      if (filter === 'week') {
        return isThisWeek(dueDate, { weekStartsOn: 0 });
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by priority (high first), then by due date
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return a.due_date ? -1 : 1;
    });
  }, [tasks, filter]);
  
  // Filter meetings based on selected filter
  const filteredMeetings = useMemo(() => {
    const now = new Date();
    
    return meetings.filter(meeting => {
      // Don't show cancelled meetings
      if (meeting.status === 'cancelled') return false;
      
      // Don't show completed in today/week view
      if (meeting.status === 'completed' && filter !== 'all') return false;
      
      if (filter === 'all') return true;
      
      const startTime = parseISO(meeting.start_time);
      
      if (filter === 'today') {
        return isToday(startTime);
      }
      
      if (filter === 'week') {
        return isThisWeek(startTime, { weekStartsOn: 0 });
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by start time
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
  }, [meetings, filter]);
  
  // Counts for badges
  const pendingTasksCount = filteredTasks.filter(t => t.status !== 'completed').length;
  const scheduledMeetingsCount = filteredMeetings.filter(m => m.status === 'scheduled').length;
  
  // Handlers
  const handleToggleTaskComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, { status: newStatus });
  };
  
  const handleEditTask = (task: Task) => {
    // Navigate to tasks page with edit state
    navigate('/tasks-meetings', { state: { editTask: task } });
  };
  
  const handleDeleteTask = async () => {
    if (deleteConfirm?.type === 'task') {
      await deleteTask(deleteConfirm.item.id);
      setDeleteConfirm(null);
    }
  };
  
  const handleEditMeeting = (meeting: Meeting) => {
    navigate('/tasks-meetings', { state: { editMeeting: meeting } });
  };
  
  const handleMarkMeetingComplete = async (meeting: Meeting) => {
    await updateMeeting(meeting.id, { status: 'completed' });
  };
  
  const handleDeleteMeeting = async () => {
    if (deleteConfirm?.type === 'meeting') {
      await deleteMeeting(deleteConfirm.item.id);
      setDeleteConfirm(null);
    }
  };
  
  const handleCreateTask = async (task: TaskInsert) => {
    await createTask(task);
  };
  
  const handleCreateMeeting = async (meeting: MeetingInsert) => {
    await createMeeting(meeting);
  };
  
  // Client list for dropdowns
  const clientsList = useMemo(() => {
    return clients.map(c => ({ id: c.id, name: c.name }));
  }, [clients]);
  
  // Filter labels
  const filterLabels: Record<FilterType, string> = {
    today: 'היום',
    week: 'השבוע',
    all: 'הכל',
  };
  
  // If collapsed, show minimal view
  if (isCollapsed) {
    return (
      <div className="px-2 py-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-all"
              style={{ 
                background: `${sidebarColors.gold}20`,
                color: sidebarColors.gold,
              }}
            >
              <CheckSquare className="h-5 w-5" />
              {(pendingTasksCount > 0 || upcomingMeetingsCount > 0) && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full"
                  style={{ 
                    background: upcomingMeetingsCount > 0 ? sidebarColors.gold : '#ef4444',
                    color: sidebarColors.navy,
                  }}
                >
                  {pendingTasksCount + scheduledMeetingsCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            משימות ופגישות
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
  
  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button 
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all hover:bg-[#D4A843]/10"
            style={{ color: sidebarColors.goldLight }}
          >
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" style={{ color: sidebarColors.gold }} />
              ) : (
                <ChevronDown className="h-4 w-4" style={{ color: sidebarColors.gold }} />
              )}
              
              {/* Counts badges */}
              <div className="flex items-center gap-1.5">
                <Badge 
                  variant="outline" 
                  className="h-5 px-1.5 text-[10px]"
                  style={{ 
                    borderColor: `${sidebarColors.gold}50`,
                    color: sidebarColors.gold,
                    background: `${sidebarColors.gold}15`,
                  }}
                >
                  <CheckSquare className="h-3 w-3 ml-1" />
                  {pendingTasksCount}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "h-5 px-1.5 text-[10px]",
                    upcomingMeetingsCount > 0 && "animate-pulse"
                  )}
                  style={{ 
                    borderColor: upcomingMeetingsCount > 0 ? sidebarColors.gold : `${sidebarColors.gold}50`,
                    color: sidebarColors.gold,
                    background: upcomingMeetingsCount > 0 ? `${sidebarColors.gold}30` : `${sidebarColors.gold}15`,
                  }}
                >
                  <Calendar className="h-3 w-3 ml-1" />
                  {scheduledMeetingsCount}
                  {upcomingMeetingsCount > 0 && (
                    <Bell className="h-3 w-3 mr-1 animate-bounce" />
                  )}
                </Badge>
              </div>
            </div>
            
            <span className="font-medium text-sm">משימות ופגישות</span>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div 
            className="mt-2 rounded-lg overflow-hidden"
            style={{ 
              background: `${sidebarColors.navyDark}80`,
              border: `1px solid ${sidebarColors.gold}20`,
            }}
          >
            {/* Tabs Header */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tasks' | 'meetings')} dir="rtl">
              <div 
                className="flex items-center justify-between px-2 py-2"
                style={{ borderBottom: `1px solid ${sidebarColors.gold}20` }}
              >
                <TabsList 
                  className="h-8 p-0.5 gap-1"
                  style={{ background: `${sidebarColors.navyLight}50` }}
                >
                  <TabsTrigger 
                    value="tasks" 
                    className="h-7 px-3 text-xs data-[state=active]:text-[#162C58]"
                    style={{ 
                      color: activeTab === 'tasks' ? sidebarColors.navy : sidebarColors.goldLight,
                      background: activeTab === 'tasks' ? sidebarColors.gold : 'transparent',
                    }}
                  >
                    <CheckSquare className="h-3.5 w-3.5 ml-1.5" />
                    משימות
                  </TabsTrigger>
                  <TabsTrigger 
                    value="meetings" 
                    className="h-7 px-3 text-xs data-[state=active]:text-[#162C58]"
                    style={{ 
                      color: activeTab === 'meetings' ? sidebarColors.navy : sidebarColors.goldLight,
                      background: activeTab === 'meetings' ? sidebarColors.gold : 'transparent',
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5 ml-1.5" />
                    פגישות
                  </TabsTrigger>
                </TabsList>
                
                {/* Add button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      style={{ 
                        color: sidebarColors.gold,
                        background: `${sidebarColors.gold}20`,
                      }}
                      onClick={() => {
                        if (activeTab === 'tasks') {
                          setIsAddTaskOpen(true);
                        } else {
                          setIsAddMeetingOpen(true);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {activeTab === 'tasks' ? 'משימה חדשה' : 'פגישה חדשה'}
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Filter row */}
              <div 
                className="flex items-center justify-between px-2 py-1.5"
                style={{ background: `${sidebarColors.navyLight}30` }}
              >
                <div className="flex items-center gap-1">
                  {(Object.keys(filterLabels) as FilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                        filter === f 
                          ? "text-[#162C58]" 
                          : "text-[#E8D1B4] hover:text-[#D4A843]"
                      )}
                      style={{
                        background: filter === f ? sidebarColors.gold : 'transparent',
                      }}
                    >
                      {filterLabels[f]}
                    </button>
                  ))}
                </div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/tasks-meetings')}
                      className="p-1 rounded hover:bg-[#D4A843]/20 transition-all"
                      style={{ color: sidebarColors.goldLight }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    פתח בעמוד מלא
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Content */}
              <TabsContent value="tasks" className="m-0">
                <ScrollArea className="h-[280px]">
                  <div className="p-2 space-y-1.5">
                    {tasksLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: sidebarColors.gold }} />
                      </div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: sidebarColors.gold }} />
                        <p className="text-xs" style={{ color: `${sidebarColors.goldLight}60` }}>
                          אין משימות {filter === 'today' ? 'להיום' : filter === 'week' ? 'לשבוע' : ''}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs h-7"
                          style={{ color: sidebarColors.gold }}
                          onClick={() => setIsAddTaskOpen(true)}
                        >
                          <Plus className="h-3.5 w-3.5 ml-1" />
                          הוסף משימה
                        </Button>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <SidebarTaskItem
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleTaskComplete}
                          onEdit={handleEditTask}
                          onDelete={(t) => setDeleteConfirm({ type: 'task', item: t })}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="meetings" className="m-0">
                <ScrollArea className="h-[280px]">
                  <div className="p-2 space-y-1.5">
                    {meetingsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: sidebarColors.gold }} />
                      </div>
                    ) : filteredMeetings.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: sidebarColors.gold }} />
                        <p className="text-xs" style={{ color: `${sidebarColors.goldLight}60` }}>
                          אין פגישות {filter === 'today' ? 'להיום' : filter === 'week' ? 'לשבוע' : ''}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs h-7"
                          style={{ color: sidebarColors.gold }}
                          onClick={() => setIsAddMeetingOpen(true)}
                        >
                          <Plus className="h-3.5 w-3.5 ml-1" />
                          הוסף פגישה
                        </Button>
                      </div>
                    ) : (
                      filteredMeetings.map((meeting) => (
                        <SidebarMeetingItem
                          key={meeting.id}
                          meeting={meeting}
                          onEdit={handleEditMeeting}
                          onDelete={(m) => setDeleteConfirm({ type: 'meeting', item: m })}
                          onMarkComplete={handleMarkMeetingComplete}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Quick Add Dialogs */}
      <QuickAddTask
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onSubmit={handleCreateTask}
        clients={clientsList}
      />
      
      <QuickAddMeeting
        open={isAddMeetingOpen}
        onOpenChange={setIsAddMeetingOpen}
        onSubmit={handleCreateMeeting}
        clients={clientsList}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              האם למחוק את {deleteConfirm?.type === 'task' ? 'המשימה' : 'הפגישה'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו לא ניתנת לביטול. {deleteConfirm?.type === 'task' ? 'המשימה' : 'הפגישה'} "{deleteConfirm?.item?.title}" תימחק לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConfirm?.type === 'task' ? handleDeleteTask : handleDeleteMeeting}
              className="bg-red-500 hover:bg-red-600"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SidebarTasksMeetings;
