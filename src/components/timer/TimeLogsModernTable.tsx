// Modern Time Logs Table - Clean & Functional
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Play,
  DollarSign,
  Calendar as CalendarIcon,
  User,
  Briefcase,
  FileText,
  Copy,
  ChevronDown,
  ChevronRight,
  Tag,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_billable: boolean | null;
  hourly_rate: number | null;
  is_running: boolean | null;
  tags: string[] | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string | null;
}

interface UserInfo {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

interface TimeLogsModernTableProps {
  timeEntries: TimeEntry[];
  clients: Client[];
  projects: Project[];
  users?: UserInfo[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (entry: TimeEntry) => void;
  loading?: boolean;
  canDelete?: boolean;
}

export function TimeLogsModernTable({
  timeEntries,
  clients,
  projects,
  users = [],
  onEdit,
  onDelete,
  onDuplicate,
  loading = false,
  canDelete = false,
}: TimeLogsModernTableProps) {
  console.log('🔍 [TimeLogsModernTable] Component rendered', { 
    canDelete, 
    entriesCount: timeEntries.length,
    hasOnDelete: !!onDelete 
  });
  
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);

  // Group entries by date
  const entriesByDate = timeEntries.reduce((acc, entry) => {
    const date = format(new Date(entry.start_time), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const dates = Object.keys(entriesByDate).sort().reverse();

  // Auto-expand first date
  useEffect(() => {
    if (dates.length > 0 && expandedDates.size === 0) {
      setExpandedDates(new Set([dates[0]]));
    }
  }, [dates, expandedDates.size]);

  // Helper functions
  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'לא משויך';
    return clients.find(c => c.id === clientId)?.name || 'לא ידוע';
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId)?.name || 'לא ידוע';
  };

  const getUserInfo = (userId: string | null) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes || minutes === 0) return '0 דק\'';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    // Under 1 hour: show minutes only
    if (hours === 0) return `${mins} דק'`;
    // Full hours: show H:00
    if (mins === 0) return `${hours}:00`;
    // Hours + minutes: show H:MM
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${date.getMinutes()}`;
  };

  const formatDateFull = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, dd MMMM yyyy', { locale: he });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  if (loading) {
    return (
      <Card dir="rtl" className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (timeEntries.length === 0) {
    return (
      <Card dir="rtl" className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Clock className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">אין רישומי זמן</h3>
          <p className="text-sm text-muted-foreground">
            התחל לעקוב אחר הזמן שלך כדי לראות רישומים כאן
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Bulk Actions */}
      {selectedEntries.size > 0 && (
        <Card dir="rtl" className="p-4 border-yellow-500/50 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-yellow-500 text-white">
                {selectedEntries.size} נבחרו
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEntries(new Set())}
              >
                בטל בחירה
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 ml-2" />
                סמן כלחיוב
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 ml-2" />
                ייצא
              </Button>
              {canDelete && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    console.log('🗑️ [TimeLogsModernTable] Bulk delete clicked', { 
                      selectedCount: selectedEntries.size,
                      selectedIds: Array.from(selectedEntries) 
                    });
                    // Delete all selected entries
                    const idsToDelete = Array.from(selectedEntries);
                    idsToDelete.forEach(id => onDelete(id));
                    setSelectedEntries(new Set());
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Entries by Date */}
      {dates.map(date => {
        const dateEntries = entriesByDate[date];
        const totalMinutes = dateEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
        const billableMinutes = dateEntries.reduce((sum, e) => 
          sum + (e.is_billable ? (e.duration_minutes || 0) : 0), 0
        );

        return (
          <div key={date} className="space-y-3">
            {/* Date Header - Collapsible */}
            <div 
              className="flex items-center justify-between px-1 cursor-pointer hover:bg-muted/30 rounded-lg p-2 transition-colors group"
              onClick={() => toggleDateExpansion(date)}
            >
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  {expandedDates.has(date) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  {formatDateFull(dateEntries[0].start_time)}
                </h3>
                <Badge variant="secondary" className="mr-2">
                  {dateEntries.length} רישומים
                </Badge>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-mono font-semibold text-blue-500">
                    {formatDuration(totalMinutes)}
                  </span>
                  <span className="text-muted-foreground">סה"כ</span>
                </div>
                {billableMinutes > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-mono font-semibold text-green-500">
                      {formatDuration(billableMinutes)}
                    </span>
                    <span className="text-muted-foreground">לחיוב</span>
                  </div>
                )}
              </div>
            </div>

            {/* Entries - Collapsible */}
            {expandedDates.has(date) && (
              <Card dir="rtl" className="overflow-hidden border-l-4 border-l-primary/20">
                <div className="divide-y divide-border">
                  {dateEntries.map((entry) => {
                    const projectName = getProjectName(entry.project_id);
                    const isSelected = selectedEntries.has(entry.id);
                    const isRunning = entry.is_running;
                    const isHovered = hoveredEntry === entry.id;

                    return (
                      <div
                        key={entry.id}
                        onMouseEnter={() => setHoveredEntry(entry.id)}
                        onMouseLeave={() => setHoveredEntry(null)}
                        className={cn(
                          "group relative p-5 transition-all",
                          isSelected && "bg-yellow-500/10 border-r-4 border-yellow-500",
                          isRunning && "bg-green-500/5 border-r-4 border-green-500",
                          !isSelected && !isRunning && "hover:bg-muted/50",
                          isHovered && "shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className={cn(
                            "pt-1 transition-opacity",
                            isHovered || isSelected ? "opacity-100" : "opacity-30"
                          )}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(entry.id)}
                            />
                          </div>

                          {/* Time */}
                          <div className="flex flex-col items-center gap-1 min-w-[80px] p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-1.5">
                              {isRunning ? (
                                <Play className="h-3.5 w-3.5 text-green-500 animate-pulse" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="text-sm font-mono font-medium">
                                {formatTime(entry.start_time)}
                              </span>
                            </div>
                            {entry.end_time && (
                              <>
                                <div className="w-full h-px bg-border my-0.5" />
                                <span className="text-sm font-mono text-muted-foreground">
                                  {formatTime(entry.end_time)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Client & Project & User Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="gap-1.5 font-medium">
                                <User className="h-3.5 w-3.5" />
                                {getClientName(entry.client_id)}
                              </Badge>
                              {projectName && (
                                <Badge variant="outline" className="gap-1.5 bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400">
                                  <Briefcase className="h-3.5 w-3.5" />
                                  {projectName}
                                </Badge>
                              )}
                              {/* User Badge */}
                              {(() => {
                                const userInfo = getUserInfo(entry.user_id);
                                if (!userInfo) return null;
                                return (
                                  <Badge variant="outline" className="gap-1.5 bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400">
                                    {userInfo.avatar_url ? (
                                      <img 
                                        src={userInfo.avatar_url} 
                                        alt={userInfo.name} 
                                        className="h-3.5 w-3.5 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-3.5 w-3.5 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] font-bold">
                                        {userInfo.name.charAt(0)}
                                      </div>
                                    )}
                                    {userInfo.name}
                                  </Badge>
                                );
                              })()}
                              {entry.is_billable && (
                                <Badge className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  לחיוב
                                </Badge>
                              )}
                              {isRunning && (
                                <Badge className="gap-1.5 bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 animate-pulse">
                                  <Timer className="h-3.5 w-3.5" />
                                  פעיל
                                </Badge>
                              )}
                            </div>

                            {/* Tags Row */}
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                {entry.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs py-0 h-5">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Description */}
                            {entry.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {entry.description}
                              </p>
                            )}
                          </div>

                          {/* Duration & Value */}
                          <div className="flex flex-col items-end gap-2">
                            <div className={cn(
                              "text-3xl font-mono font-bold tracking-tight",
                              isRunning ? "text-green-500" : "text-foreground"
                            )}>
                              {formatDuration(entry.duration_minutes)}
                            </div>
                            {entry.hourly_rate && entry.is_billable && (
                              <div className="flex items-center gap-1 text-xs bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded-md font-medium">
                                <TrendingUp className="h-3 w-3" />
                                ₪{((entry.duration_minutes || 0) / 60 * entry.hourly_rate).toFixed(0)}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className={cn(
                            "transition-all",
                            isHovered || isSelected ? "opacity-100" : "opacity-0",
                            isHovered ? "scale-100" : "scale-95"
                          )}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 hover:bg-primary/10"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent dir="rtl" align="end" className="w-48">
                                <DropdownMenuItem onClick={() => onEdit(entry)}>
                                  <Edit2 className="h-4 w-4 ml-2" />
                                  ערוך רישום
                                </DropdownMenuItem>
                                {onDuplicate && (
                                  <DropdownMenuItem onClick={() => onDuplicate(entry)}>
                                    <Copy className="h-4 w-4 ml-2" />
                                    שכפל רישום
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log('🗑️ [TimeLogsModernTable] Delete clicked', { entryId: entry.id, canDelete });
                                      onDelete(entry.id);
                                    }}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    מחק רישום
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
