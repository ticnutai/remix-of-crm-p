// Clients By Stage View - Modern compact design with icons
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientsByStage, type ClientInStage, type StageGroup } from '@/hooks/useClientsByStage';
import {
  Users,
  ChevronDown,
  ChevronRight,
  Minimize2,
  Maximize2,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Circle,
  ExternalLink,
  Layers,
  RefreshCw,
  Clock,
  FolderOpen,
  FolderClosed,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientsByStageViewProps {
  className?: string;
}

type ViewFilter = 'all' | 'recent';

// Compact Client Row
function ClientRow({ 
  client, 
  isExpanded, 
  onToggle,
  onOpenClient,
}: { 
  client: ClientInStage; 
  isExpanded: boolean;
  onToggle: () => void;
  onOpenClient: () => void;
}) {
  const completedTasks = client.tasks.filter(t => t.is_completed).length;
  const totalTasks = client.tasks.length;
  const hasProgress = totalTasks > 0;

  return (
    <TooltipProvider>
      <div className="border-b last:border-0 hover:bg-muted/30 transition-colors">
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 py-2 px-3 cursor-pointer">
              {/* Expand Icon */}
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              
              {/* Avatar/Icon */}
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-white">
                  {client.name.charAt(0)}
                </span>
              </div>
              
              {/* Name */}
              <span className="font-medium text-sm truncate flex-1 min-w-0">
                {client.name}
              </span>
              
              {/* Progress Badge */}
              {hasProgress && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Progress value={client.stage_progress} className="h-1.5 w-12" />
                      <span className="text-[10px] text-muted-foreground w-8">
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{completedTasks} מתוך {totalTasks} משימות</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Quick Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {client.phone && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={`tel:${client.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-primary/10 rounded transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-green-600" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>{client.phone}</TooltipContent>
                  </Tooltip>
                )}
                {client.email && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={`mailto:${client.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-primary/10 rounded transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>{client.email}</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenClient();
                      }}
                      className="p-1 hover:bg-primary/10 rounded transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#d4a843]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>פתח לקוח</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-3 pb-2 mr-9 space-y-2">
              {/* Company if exists */}
              {client.company && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building className="h-3 w-3" />
                  {client.company}
                </div>
              )}
              
              {/* Tasks */}
              {client.tasks.length > 0 && (
                <div className="space-y-1">
                  {client.tasks.slice(0, 5).map(task => (
                    <div 
                      key={task.task_id} 
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        task.is_completed && "text-muted-foreground line-through"
                      )}
                    >
                      {task.is_completed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {client.tasks.length > 5 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{client.tasks.length - 5} עוד...
                    </p>
                  )}
                </div>
              )}
              
              {client.tasks.length === 0 && (
                <p className="text-xs text-muted-foreground italic">אין משימות</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  );
}

// Stage Group Card
function StageCard({
  group,
  expandedClients,
  onToggleClient,
  isExpanded,
  onToggle,
  onOpenClient,
}: {
  group: StageGroup;
  expandedClients: Set<string>;
  onToggleClient: (clientId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenClient: (clientId: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-2.5 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-[#d4a843]" />
                ) : (
                  <FolderClosed className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-semibold text-[#1e3a5f] dark:text-white">
                  {group.stage_name}
                </span>
                <Badge 
                  variant="secondary" 
                  className="h-5 px-1.5 text-[10px] font-bold"
                >
                  {group.clients.length}
                </Badge>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            {group.clients.length > 0 ? (
              <div className="divide-y">
                {group.clients.map(client => (
                  <ClientRow
                    key={`${group.stage_name}-${client.id}`}
                    client={client}
                    isExpanded={expandedClients.has(client.id)}
                    onToggle={() => onToggleClient(client.id)}
                    onOpenClient={() => onOpenClient(client.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <User className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">אין לקוחות</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function ClientsByStageView({ className }: ClientsByStageViewProps) {
  const navigate = useNavigate();
  const { stageGroups, allStageNames, loading, refresh } = useClientsByStage();
  
  // State
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(allStageNames));
  
  // Update expanded groups when stage names load
  React.useEffect(() => {
    if (allStageNames.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(allStageNames));
    }
  }, [allStageNames]);

  // Get recent clients (last 20 clients by created_at assumption)
  const recentClients = useMemo(() => {
    const allClients: (ClientInStage & { stageName: string })[] = [];
    stageGroups.forEach(group => {
      group.clients.forEach(client => {
        allClients.push({ ...client, stageName: group.stage_name });
      });
    });
    // Sort by name for now (would need created_at for true recent)
    return allClients.slice(0, 20);
  }, [stageGroups]);

  // Filter groups based on view
  const displayGroups = useMemo(() => {
    if (viewFilter === 'recent') {
      // Create a single group with recent clients
      return [{
        stage_name: 'לקוחות אחרונים',
        stage_icon: null,
        clients: recentClients,
      }] as StageGroup[];
    }
    return stageGroups;
  }, [stageGroups, recentClients, viewFilter]);

  // Stats
  const totalClients = useMemo(() => {
    return stageGroups.reduce((sum, g) => sum + g.clients.length, 0);
  }, [stageGroups]);

  // Actions
  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      next.has(clientId) ? next.delete(clientId) : next.add(clientId);
      return next;
    });
  };

  const toggleGroup = (stageName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(stageName) ? next.delete(stageName) : next.add(stageName);
      return next;
    });
  };

  const expandAllGroups = () => setExpandedGroups(new Set(displayGroups.map(g => g.stage_name)));
  const collapseAllGroups = () => { setExpandedGroups(new Set()); setExpandedClients(new Set()); };

  const openClient = (clientId: string) => navigate(`/clients/${clientId}`);

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="py-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 bg-card/50 backdrop-blur p-2 rounded-lg border sticky top-0 z-10">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('all')}
                  className={cn(
                    "h-8 px-2.5 gap-1.5",
                    viewFilter === 'all' && "bg-[#1e3a5f] hover:bg-[#2d4a6f]"
                  )}
                >
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">שלבים</span>
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-white/20">
                    {stageGroups.length}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>לפי שלבים</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewFilter === 'recent' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('recent')}
                  className={cn(
                    "h-8 px-2.5 gap-1.5",
                    viewFilter === 'recent' && "bg-[#d4a843] hover:bg-[#c49733] text-white"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">אחרונים</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>לקוחות אחרונים</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Stats */}
          <Badge variant="outline" className="h-7 gap-1 text-xs mr-2">
            <Users className="h-3 w-3" />
            {totalClients}
          </Badge>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={refresh} className="h-8 w-8 p-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>רענן</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={expandAllGroups} className="h-8 w-8 p-0">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>פתח הכל</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={collapseAllGroups} className="h-8 w-8 p-0">
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>סגור הכל</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Stage Groups */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-2 pl-1">
          {displayGroups.length > 0 ? (
            displayGroups.map(group => (
              <StageCard
                key={group.stage_name}
                group={group}
                expandedClients={expandedClients}
                onToggleClient={toggleClient}
                isExpanded={expandedGroups.has(group.stage_name)}
                onToggle={() => toggleGroup(group.stage_name)}
                onOpenClient={openClient}
              />
            ))
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="font-medium">אין לקוחות בשלבים</p>
                <p className="text-xs mt-1">הוסף שלבים ללקוחות כדי לראות אותם כאן</p>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
