// Clients By Stage View - Modern compact design with icons
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClientsByStage, type ClientInStage, type StageGroup } from '@/hooks/useClientsByStage';
import { useClientsByConsultant, type ConsultantGroup, type ConsultantClient } from '@/hooks/useClientsByConsultant';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
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
  UserCircle,
  Briefcase,
  Plus,
  Search,
  FolderPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// localStorage keys
const STORAGE_KEY_VIEW_FILTER = 'clientsByStage_viewFilter';
const STORAGE_KEY_EXPANDED_GROUPS = 'clientsByStage_expandedGroups';
const STORAGE_KEY_EXPANDED_CONSULTANTS = 'clientsByStage_expandedConsultants';

interface ClientsByStageViewProps {
  className?: string;
}

type ViewFilter = 'all' | 'recent' | 'consultants';

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
      <div className="border-b last:border-0 hover:bg-muted/30 transition-colors" dir="rtl">
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 py-2 px-3 cursor-pointer flex-row-reverse">
              {/* Expand Icon - use ChevronLeft for RTL */}
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
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
              
              {/* Stage Progress Info */}
              {client.total_stages > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1">
                      <Layers className="h-3 w-3" />
                      {client.completed_stages}/{client.total_stages}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{client.completed_stages} שלבים הושלמו מתוך {client.total_stages}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Task Progress Badge */}
              {hasProgress && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 flex-row-reverse">
                      <Progress value={client.stage_progress} className="h-1.5 w-12" />
                      <span className="text-[10px] text-muted-foreground w-8 text-left">
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
  onAddClients,
}: {
  group: StageGroup;
  expandedClients: Set<string>;
  onToggleClient: (clientId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenClient: (clientId: string) => void;
  onAddClients: (stageName: string) => void;
}) {
  return (
    <Card className="overflow-hidden" dir="rtl">
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
                {/* Add Clients Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-[#d4a843]/20 hover:text-[#d4a843]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddClients(group.stage_name);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>הוסף לקוחות לשלב</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
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

// Consultant Client Row - Simple version
function ConsultantClientRow({ 
  client, 
  onOpenClient,
}: { 
  client: ConsultantClient;
  onOpenClient: () => void;
}) {
  return (
    <TooltipProvider>
      <div className="border-b last:border-0 hover:bg-muted/30 transition-colors py-2 px-3" dir="rtl">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-white">
              {client.name.charAt(0)}
            </span>
          </div>
          
          {/* Name */}
          <span className="font-medium text-sm truncate flex-1 min-w-0">
            {client.name}
          </span>
          
          {/* Status */}
          {client.status && (
            <Badge variant="outline" className="text-[10px]">
              {client.status}
            </Badge>
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
                  onClick={onOpenClient}
                  className="p-1 hover:bg-primary/10 rounded transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#d4a843]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>פתח לקוח</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Consultant Group Card
function ConsultantCard({
  group,
  isExpanded,
  onToggle,
  onOpenClient,
}: {
  group: ConsultantGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenClient: (clientId: string) => void;
}) {
  const { consultant, clients } = group;
  
  return (
    <Card className="overflow-hidden" dir="rtl">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-2.5 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#d4a843] to-[#b8860b] flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1e3a5f] dark:text-white">
                      {consultant.name}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className="h-5 px-1.5 text-[10px] font-bold"
                    >
                      {clients.length} לקוחות
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span>{consultant.profession}</span>
                    {consultant.specialty && (
                      <>
                        <span>•</span>
                        <span>{consultant.specialty}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            {clients.length > 0 ? (
              <div className="divide-y">
                {clients.map(client => (
                  <ConsultantClientRow
                    key={client.id}
                    client={client}
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
  const { toast } = useToast();
  const { stageGroups, allStageNames, loading, refresh } = useClientsByStage();
  const { consultantGroups, loading: consultantsLoading, refresh: refreshConsultants } = useClientsByConsultant();
  const { clients: allClients } = useClients();
  
  // Load saved preferences from localStorage
  const [viewFilter, setViewFilter] = useState<ViewFilter>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VIEW_FILTER);
    return (saved as ViewFilter) || 'all';
  });
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPANDED_GROUPS);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [expandedConsultants, setExpandedConsultants] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPANDED_CONSULTANTS);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // Bulk add clients dialog state
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [targetStageName, setTargetStageName] = useState<string>('');
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [clientSearch, setClientSearch] = useState('');
  const [isAddingClients, setIsAddingClients] = useState(false);
  
  // New stage creation dialog state
  const [newStageDialogOpen, setNewStageDialogOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const [isNewStageMode, setIsNewStageMode] = useState(false);
  
  // Save view filter to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW_FILTER, viewFilter);
  }, [viewFilter]);
  
  // Save expanded groups to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPANDED_GROUPS, JSON.stringify(Array.from(expandedGroups)));
  }, [expandedGroups]);
  
  // Save expanded consultants to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPANDED_CONSULTANTS, JSON.stringify(Array.from(expandedConsultants)));
  }, [expandedConsultants]);
  
  // Update expanded groups when stage names load (only if no saved state)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPANDED_GROUPS);
    if (!saved && allStageNames.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(allStageNames));
    }
  }, [allStageNames, expandedGroups.size]);

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
        sort_order: 0,
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
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

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

  const expandAllGroups = () => {
    if (viewFilter === 'consultants') {
      setExpandedConsultants(new Set(consultantGroups.map(g => g.consultant.id)));
    } else {
      setExpandedGroups(new Set(displayGroups.map(g => g.stage_name)));
    }
  };
  
  const collapseAllGroups = () => { 
    setExpandedGroups(new Set()); 
    setExpandedClients(new Set()); 
    setExpandedConsultants(new Set());
  };

  const toggleConsultant = (consultantId: string) => {
    setExpandedConsultants(prev => {
      const next = new Set(prev);
      if (next.has(consultantId)) {
        next.delete(consultantId);
      } else {
        next.add(consultantId);
      }
      return next;
    });
  };

  const handleRefresh = () => {
    refresh();
    refreshConsultants();
  };

  const openClient = (clientId: string) => navigate(`/client-profile/${clientId}`);

  // Open bulk add dialog
  const openBulkAddDialog = (stageName: string) => {
    setTargetStageName(stageName);
    setSelectedClientIds(new Set());
    setClientSearch('');
    setIsNewStageMode(false);
    setBulkAddDialogOpen(true);
  };
  
  // Open new stage dialog
  const openNewStageDialog = () => {
    setNewStageName('');
    setSelectedClientIds(new Set());
    setClientSearch('');
    setIsNewStageMode(true);
    setNewStageDialogOpen(true);
  };
  
  // Create new stage and add clients
  const handleCreateNewStage = async () => {
    if (!newStageName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין שם לשלב',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if stage already exists
    if (allStageNames.includes(newStageName.trim())) {
      toast({
        title: 'שלב קיים',
        description: 'שלב בשם הזה כבר קיים. השתמש בכפתור + ליד השלב להוסיף לקוחות.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsCreatingStage(true);
    try {
      const clientsToAdd = Array.from(selectedClientIds);
      
      if (clientsToAdd.length === 0) {
        toast({
          title: 'שגיאה',
          description: 'נא לבחור לפחות לקוח אחד לשלב החדש',
          variant: 'destructive',
        });
        return;
      }
      
      // Add each client to the new stage
      for (const clientId of clientsToAdd) {
        const newStageId = `stage_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const { error } = await supabase.from('client_stages').insert({
          client_id: clientId,
          stage_id: newStageId,
          stage_name: newStageName.trim(),
          stage_icon: 'FolderOpen',
          sort_order: 0,
        });
        
        if (error) {
          console.error('Error adding client to new stage:', error);
          throw error;
        }
      }
      
      toast({
        title: 'שלב נוצר בהצלחה',
        description: `שלב "${newStageName}" נוצר עם ${clientsToAdd.length} לקוחות`,
      });
      
      setNewStageDialogOpen(false);
      setNewStageName('');
      setSelectedClientIds(new Set());
      refresh();
    } catch (error) {
      console.error('Error creating new stage:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור את השלב',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingStage(false);
    }
  };

  // Toggle client selection
  const toggleClientSelection = (clientId: string) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  // Get clients already in the target stage
  const clientsInTargetStage = useMemo(() => {
    const group = stageGroups.find(g => g.stage_name === targetStageName);
    return new Set(group?.clients.map(c => c.id) || []);
  }, [stageGroups, targetStageName]);

  // Filtered clients for the dialog
  const filteredClientsForDialog = useMemo(() => {
    return allClients.filter(client => {
      // Filter by search
      if (clientSearch) {
        const search = clientSearch.toLowerCase();
        const matchesName = client.name?.toLowerCase().includes(search);
        const matchesEmail = client.email?.toLowerCase().includes(search);
        const matchesPhone = client.phone?.includes(search);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }
      return true;
    });
  }, [allClients, clientSearch]);

  // Add selected clients to stage
  const handleAddClientsToStage = async () => {
    if (selectedClientIds.size === 0) return;
    
    setIsAddingClients(true);
    try {
      const clientsToAdd = Array.from(selectedClientIds).filter(
        id => !clientsInTargetStage.has(id)
      );
      
      if (clientsToAdd.length === 0) {
        toast({
          title: 'כל הלקוחות כבר בשלב',
          description: 'הלקוחות שבחרת כבר נמצאים בשלב זה',
        });
        return;
      }

      // Add each client to the stage
      for (const clientId of clientsToAdd) {
        const newStageId = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error } = await supabase.from('client_stages').insert({
          client_id: clientId,
          stage_id: newStageId,
          stage_name: targetStageName,
          stage_icon: 'FolderOpen',
          sort_order: 0,
        });
        
        if (error) {
          console.error('Error adding client to stage:', error);
          throw error;
        }
      }
      
      toast({
        title: 'לקוחות נוספו בהצלחה',
        description: `${clientsToAdd.length} לקוחות נוספו לשלב "${targetStageName}"`,
      });
      
      setBulkAddDialogOpen(false);
      refresh();
    } catch (error) {
      console.error('Error adding clients to stage:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף לקוחות לשלב',
        variant: 'destructive',
      });
    } finally {
      setIsAddingClients(false);
    }
  };

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
    <div className={cn("space-y-3 w-full", className)} dir="rtl" style={{ textAlign: 'right' }}>
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 bg-card/50 backdrop-blur p-2 rounded-lg border sticky top-0 z-10">
        {/* Right: Filter Buttons */}
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewFilter === 'consultants' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('consultants')}
                  className={cn(
                    "h-8 px-2.5 gap-1.5",
                    viewFilter === 'consultants' && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">יועצים</span>
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-white/20">
                    {consultantGroups.length}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>לפי יועצים (אדריכלים, מהנדסים)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Stats */}
          <Badge variant="outline" className="h-7 gap-1 text-xs">
            <Users className="h-3 w-3" />
            {totalClients}
          </Badge>
        </div>

        {/* Left: Actions */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={openNewStageDialog} 
                  className="h-8 px-2.5 gap-1.5 bg-[#d4a843] hover:bg-[#b8860b] text-white"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">שלב חדש</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>צור שלב חדש</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0">
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

      {/* Content Area */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-2 pr-1">
          {viewFilter === 'consultants' ? (
            // Consultants View
            consultantGroups.length > 0 ? (
              consultantGroups.map(group => (
                <ConsultantCard
                  key={group.consultant.id}
                  group={group}
                  isExpanded={expandedConsultants.has(group.consultant.id)}
                  onToggle={() => toggleConsultant(group.consultant.id)}
                  onOpenClient={openClient}
                />
              ))
            ) : (
              <Card className="p-6">
                <div className="text-center text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">אין יועצים</p>
                  <p className="text-xs mt-1">הוסף יועצים ללקוחות כדי לראות אותם כאן</p>
                </div>
              </Card>
            )
          ) : (
            // Stages View
            displayGroups.length > 0 ? (
              displayGroups.map(group => (
                <StageCard
                  key={group.stage_name}
                  group={group}
                  expandedClients={expandedClients}
                  onToggleClient={toggleClient}
                  isExpanded={expandedGroups.has(group.stage_name)}
                  onToggle={() => toggleGroup(group.stage_name)}
                  onOpenClient={openClient}
                  onAddClients={openBulkAddDialog}
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
            )
          )}
        </div>
      </ScrollArea>

      {/* Bulk Add Clients Dialog */}
      <Dialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#d4a843]" />
              הוסף לקוחות לשלב: <span className="text-[#d4a843]">{targetStageName}</span>
            </DialogTitle>
          </DialogHeader>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חפש לקוחות..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>
          
          {/* Selected count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filteredClientsForDialog.length} לקוחות
            </span>
            <Badge variant="secondary">
              {selectedClientIds.size} נבחרו
            </Badge>
          </div>
          
          {/* Clients list */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="divide-y">
              {filteredClientsForDialog.map(client => {
                const isInStage = clientsInTargetStage.has(client.id);
                const isSelected = selectedClientIds.has(client.id);
                
                return (
                  <div
                    key={client.id}
                    className={cn(
                      "flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      isInStage && "bg-green-50 dark:bg-green-950/20",
                      isSelected && !isInStage && "bg-[#d4a843]/10"
                    )}
                    onClick={() => !isInStage && toggleClientSelection(client.id)}
                  >
                    <Checkbox
                      checked={isSelected || isInStage}
                      disabled={isInStage}
                      onCheckedChange={() => !isInStage && toggleClientSelection(client.id)}
                    />
                    
                    {/* Avatar */}
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-white">
                        {client.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{client.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {client.email || client.phone || 'ללא פרטים'}
                      </div>
                    </div>
                    
                    {/* Status */}
                    {isInStage && (
                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                        כבר בשלב
                      </Badge>
                    )}
                  </div>
                );
              })}
              
              {filteredClientsForDialog.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>לא נמצאו לקוחות</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkAddDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleAddClientsToStage}
              disabled={selectedClientIds.size === 0 || isAddingClients}
              className="bg-[#d4a843] hover:bg-[#b8860b] text-white"
            >
              {isAddingClients ? (
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Plus className="h-4 w-4 ml-2" />
              )}
              הוסף {selectedClientIds.size > 0 ? `${selectedClientIds.size} לקוחות` : 'לקוחות'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Stage Creation Dialog */}
      <Dialog open={newStageDialogOpen} onOpenChange={setNewStageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-[#d4a843]" />
              צור שלב חדש
            </DialogTitle>
          </DialogHeader>
          
          {/* Stage Name Input */}
          <div className="space-y-2">
            <Label>שם השלב</Label>
            <Input
              placeholder="הזן שם לשלב החדש..."
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              dir="rtl"
              className="text-lg"
            />
          </div>
          
          {/* Search Clients */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חפש לקוחות להוספה לשלב..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>
          
          {/* Selected count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {allClients.length} לקוחות
            </span>
            <Badge variant="secondary">
              {selectedClientIds.size} נבחרו
            </Badge>
          </div>
          
          {/* Clients list */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="divide-y">
              {allClients
                .filter(client => {
                  if (!clientSearch) return true;
                  const search = clientSearch.toLowerCase();
                  return (
                    client.name?.toLowerCase().includes(search) ||
                    client.email?.toLowerCase().includes(search) ||
                    client.phone?.includes(search)
                  );
                })
                .map(client => {
                  const isSelected = selectedClientIds.has(client.id);
                  
                  return (
                    <div
                      key={client.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                        isSelected && "bg-[#d4a843]/10"
                      )}
                      onClick={() => toggleClientSelection(client.id)}
                      onKeyDown={(e) => e.key === 'Enter' && toggleClientSelection(client.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleClientSelection(client.id)}
                      />
                      
                      {/* Avatar */}
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-white">
                          {client.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{client.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {client.email || client.phone || 'ללא פרטים'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
              {allClients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>אין לקוחות במערכת</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNewStageDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleCreateNewStage}
              disabled={!newStageName.trim() || selectedClientIds.size === 0 || isCreatingStage}
              className="bg-[#d4a843] hover:bg-[#b8860b] text-white"
            >
              {isCreatingStage ? (
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <FolderPlus className="h-4 w-4 ml-2" />
              )}
              צור שלב עם {selectedClientIds.size > 0 ? `${selectedClientIds.size} לקוחות` : 'לקוחות'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
