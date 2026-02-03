// Clients By Stage View - Shows all clients grouped by their current stage
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Filter,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientsByStageViewProps {
  className?: string;
}

// Client Card Component
function ClientCard({ 
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

  return (
    <Card className="mb-2 shadow-sm hover:shadow-md transition-shadow">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{client.name}</span>
                    {client.company && (
                      <Badge variant="outline" className="text-xs">
                        <Building className="h-3 w-3 mr-1" />
                        {client.company}
                      </Badge>
                    )}
                  </div>
                  {totalTasks > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={client.stage_progress} className="h-1.5 w-24" />
                      <span className="text-xs text-muted-foreground">
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenClient();
                }}
                className="h-8 px-2"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3">
            {/* Contact Info */}
            <div className="flex flex-wrap gap-3 mb-3 text-sm text-muted-foreground">
              {client.phone && (
                <a 
                  href={`tel:${client.phone}`} 
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3 w-3" />
                  {client.phone}
                </a>
              )}
              {client.email && (
                <a 
                  href={`mailto:${client.email}`} 
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-3 w-3" />
                  {client.email}
                </a>
              )}
            </div>
            
            {/* Tasks */}
            {client.tasks.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">משימות בשלב:</span>
                <div className="space-y-1 mr-2">
                  {client.tasks.map(task => (
                    <div 
                      key={task.task_id} 
                      className={cn(
                        "flex items-center gap-2 text-sm py-0.5",
                        task.is_completed && "text-muted-foreground line-through"
                      )}
                    >
                      {task.is_completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {client.tasks.length === 0 && (
              <div className="text-sm text-muted-foreground italic">
                אין משימות בשלב זה
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Stage Group Component
function StageGroupSection({
  group,
  expandedClients,
  onToggleClient,
  isGroupExpanded,
  onToggleGroup,
  onOpenClient,
}: {
  group: StageGroup;
  expandedClients: Set<string>;
  onToggleClient: (clientId: string) => void;
  isGroupExpanded: boolean;
  onToggleGroup: () => void;
  onOpenClient: (clientId: string) => void;
}) {
  return (
    <Card className="mb-4">
      <Collapsible open={isGroupExpanded} onOpenChange={onToggleGroup}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isGroupExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{group.stage_name}</CardTitle>
                <Badge variant="secondary" className="mr-2">
                  <Users className="h-3 w-3 ml-1" />
                  {group.clients.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {group.clients.length > 0 ? (
              <div className="space-y-0">
                {group.clients.map(client => (
                  <ClientCard
                    key={`${group.stage_name}-${client.id}`}
                    client={client}
                    isExpanded={expandedClients.has(client.id)}
                    onToggle={() => onToggleClient(client.id)}
                    onOpenClient={() => onOpenClient(client.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>אין לקוחות בשלב זה</p>
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
  
  // State for filtering and expansion
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(allStageNames));
  
  // Update expanded groups when stage names load
  React.useEffect(() => {
    if (allStageNames.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(allStageNames));
    }
  }, [allStageNames]);

  // Filtered groups based on selected stage
  const filteredGroups = useMemo(() => {
    if (selectedStage === 'all') return stageGroups;
    return stageGroups.filter(g => g.stage_name === selectedStage);
  }, [stageGroups, selectedStage]);

  // Total clients count
  const totalClients = useMemo(() => {
    return filteredGroups.reduce((sum, g) => sum + g.clients.length, 0);
  }, [filteredGroups]);

  // Toggle single client
  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  // Toggle single group
  const toggleGroup = (stageName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(stageName)) {
        next.delete(stageName);
      } else {
        next.add(stageName);
      }
      return next;
    });
  };

  // Expand all clients
  const expandAll = () => {
    const allClientIds = new Set<string>();
    filteredGroups.forEach(group => {
      group.clients.forEach(client => allClientIds.add(client.id));
    });
    setExpandedClients(allClientIds);
    setExpandedGroups(new Set(filteredGroups.map(g => g.stage_name)));
  };

  // Collapse all clients
  const collapseAll = () => {
    setExpandedClients(new Set());
    // Keep groups expanded but collapse all client cards
  };

  // Collapse all groups
  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
    setExpandedClients(new Set());
  };

  // Expand all groups
  const expandAllGroups = () => {
    setExpandedGroups(new Set(filteredGroups.map(g => g.stage_name)));
  };

  // Open client profile
  const openClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  if (loading) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          {/* Stage Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="בחר שלב" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל השלבים</SelectItem>
                {allStageNames.map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <Badge variant="outline" className="text-sm">
            <Users className="h-3.5 w-3.5 ml-1" />
            {totalClients} לקוחות
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Layers className="h-3.5 w-3.5 ml-1" />
            {filteredGroups.length} שלבים
          </Badge>
        </div>

        {/* Expand/Collapse Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            רענן
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={expandAllGroups}
            className="gap-1"
          >
            <Maximize2 className="h-4 w-4" />
            פתח קבוצות
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAllGroups}
            className="gap-1"
          >
            <Minimize2 className="h-4 w-4" />
            סגור קבוצות
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="gap-1"
          >
            <Maximize2 className="h-4 w-4" />
            פתח כרטיסים
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="gap-1"
          >
            <Minimize2 className="h-4 w-4" />
            סגור כרטיסים
          </Button>
        </div>
      </div>

      {/* Stage Groups */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-4 pl-4">
          {filteredGroups.length > 0 ? (
            filteredGroups.map(group => (
              <StageGroupSection
                key={group.stage_name}
                group={group}
                expandedClients={expandedClients}
                onToggleClient={toggleClient}
                isGroupExpanded={expandedGroups.has(group.stage_name)}
                onToggleGroup={() => toggleGroup(group.stage_name)}
                onOpenClient={openClient}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">אין לקוחות בשלבים</p>
                <p className="text-sm">הוסף שלבים ללקוחות כדי לראות אותם כאן</p>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
