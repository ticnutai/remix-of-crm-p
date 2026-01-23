// Enhanced Import Progress Panel with detailed tracking and resume capability
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  FolderKanban,
  Timer,
  CheckSquare,
  Calendar,
  FileText,
  FileSpreadsheet,
  UserCheck,
  Settings2,
  Shield,
  PauseCircle,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';

export interface ImportPhase {
  id: string;
  label: string;
  icon: React.ElementType;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  status: 'pending' | 'active' | 'completed' | 'error' | 'paused';
  color: string;
}

interface ImportProgressPanelProps {
  phases: ImportPhase[];
  currentPhaseId: string;
  overallProgress: number;
  message: string;
  isImporting: boolean;
  isPaused?: boolean;
  canResume?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

const getIconBgClass = (color: string) => {
  switch (color) {
    case 'secondary': return 'bg-secondary/10 text-secondary';
    case 'primary': return 'bg-primary/10 text-primary';
    case 'green-500': return 'bg-green-500/10 text-green-500';
    case 'blue-500': return 'bg-blue-500/10 text-blue-500';
    case 'purple-500': return 'bg-purple-500/10 text-purple-500';
    case 'orange-500': return 'bg-orange-500/10 text-orange-500';
    case 'emerald-500': return 'bg-emerald-500/10 text-emerald-500';
    case 'indigo-500': return 'bg-indigo-500/10 text-indigo-500';
    case 'cyan-500': return 'bg-cyan-500/10 text-cyan-500';
    case 'amber-500': return 'bg-amber-500/10 text-amber-500';
    case 'slate-500': return 'bg-slate-500/10 text-slate-500';
    case 'rose-500': return 'bg-rose-500/10 text-rose-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: ImportPhase['status']) => {
  switch (status) {
    case 'pending': return Clock;
    case 'active': return Loader2;
    case 'completed': return CheckCircle2;
    case 'error': return XCircle;
    case 'paused': return PauseCircle;
    default: return Clock;
  }
};

export function ImportProgressPanel({
  phases,
  currentPhaseId,
  overallProgress,
  message,
  isImporting,
  isPaused = false,
  canResume = false,
  onPause,
  onResume,
  onCancel,
}: ImportProgressPanelProps) {
  // Calculate totals
  const totalItems = phases.reduce((sum, p) => sum + p.total, 0);
  const totalImported = phases.reduce((sum, p) => sum + p.imported, 0);
  const totalUpdated = phases.reduce((sum, p) => sum + p.updated, 0);
  const totalSkipped = phases.reduce((sum, p) => sum + p.skipped, 0);
  const totalErrors = phases.reduce((sum, p) => sum + p.errors, 0);

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <div className="text-center space-y-3">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center bg-card">
            {isImporting && !isPaused ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : isPaused ? (
              <PauseCircle className="h-10 w-10 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            )}
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <Badge 
              variant={isPaused ? "outline" : isImporting ? "default" : "secondary"} 
              className={cn(
                "text-lg font-bold px-3",
                isPaused && "border-amber-500 text-amber-600"
              )}
            >
              {Math.round(overallProgress)}%
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {message}
        </p>
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>התקדמות כללית</span>
          <span>{totalImported + totalUpdated} / {totalItems} רשומות</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </div>

      {/* Phase Details */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {phases.map((phase) => {
          const Icon = phase.icon;
          const StatusIcon = getStatusIcon(phase.status);
          const phaseProgress = phase.total > 0 
            ? ((phase.imported + phase.updated + phase.skipped + phase.errors) / phase.total) * 100 
            : 0;
          const isActive = phase.id === currentPhaseId && isImporting;
          
          // Skip phases with 0 items
          if (phase.total === 0) return null;
          
          return (
            <Card
              key={phase.id}
              className={cn(
                "p-3 transition-all",
                isActive && "ring-2 ring-primary/50 bg-primary/5",
                phase.status === 'completed' && "bg-green-500/5",
                phase.status === 'error' && "bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={cn("p-2 rounded-lg", getIconBgClass(phase.color))}>
                  <Icon className="h-4 w-4" />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{phase.label}</span>
                    <StatusIcon 
                      className={cn(
                        "h-3.5 w-3.5",
                        phase.status === 'active' && "animate-spin text-primary",
                        phase.status === 'completed' && "text-green-500",
                        phase.status === 'error' && "text-destructive",
                        phase.status === 'pending' && "text-muted-foreground",
                        phase.status === 'paused' && "text-amber-500"
                      )}
                    />
                  </div>
                  
                  {/* Stats row */}
                  <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                    {phase.imported > 0 && (
                      <span className="text-green-600">✓ {phase.imported} יובאו</span>
                    )}
                    {phase.updated > 0 && (
                      <span className="text-blue-600">↻ {phase.updated} עודכנו</span>
                    )}
                    {phase.skipped > 0 && (
                      <span className="text-muted-foreground">⊘ {phase.skipped} דולגו</span>
                    )}
                    {phase.errors > 0 && (
                      <span className="text-destructive">✕ {phase.errors} שגיאות</span>
                    )}
                    {phase.status === 'pending' && (
                      <span className="text-muted-foreground">{phase.total} ממתין</span>
                    )}
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="w-16 text-left">
                  <span className="text-xs font-medium">{Math.round(phaseProgress)}%</span>
                </div>
              </div>
              
              {/* Phase progress bar */}
              {(isActive || phase.status === 'completed' || phase.status === 'error') && (
                <Progress value={phaseProgress} className="h-1 mt-2" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{totalImported}</p>
          <p className="text-xs text-muted-foreground">יובאו</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">{totalUpdated}</p>
          <p className="text-xs text-muted-foreground">עודכנו</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-muted-foreground">{totalSkipped}</p>
          <p className="text-xs text-muted-foreground">דולגו</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-destructive">{totalErrors}</p>
          <p className="text-xs text-muted-foreground">שגיאות</p>
        </div>
      </div>

      {/* Control Buttons */}
      {(onPause || onResume || onCancel) && isImporting && (
        <div className="flex justify-center gap-2">
          {isPaused && onResume && (
            <Button variant="default" size="sm" onClick={onResume} className="gap-2">
              <PlayCircle className="h-4 w-4" />
              המשך
            </Button>
          )}
          {!isPaused && onPause && (
            <Button variant="outline" size="sm" onClick={onPause} className="gap-2">
              <PauseCircle className="h-4 w-4" />
              השהה
            </Button>
          )}
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive gap-2">
              <XCircle className="h-4 w-4" />
              ביטול
            </Button>
          )}
        </div>
      )}

      {/* Resume indicator */}
      {canResume && !isImporting && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              יש התקדמות שמורה - ניתן להמשיך מאותו מקום
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to create phases from import options and backup data
export function createImportPhases(
  backupData: { data: Record<string, unknown[] | undefined> },
  importOptions: Record<string, boolean>
): ImportPhase[] {
  const phaseConfigs: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    dataKey: string;
    color: string;
    optionKey: string;
  }> = [
    { id: 'clients', label: 'לקוחות', icon: Users, dataKey: 'Client', color: 'secondary', optionKey: 'clients' },
    { id: 'projects', label: 'פרויקטים', icon: FolderKanban, dataKey: 'Project', color: 'primary', optionKey: 'projects' },
    { id: 'tasks', label: 'משימות', icon: CheckSquare, dataKey: 'Task', color: 'blue-500', optionKey: 'tasks' },
    { id: 'time_entries', label: 'רישומי זמן', icon: Timer, dataKey: 'TimeLog', color: 'green-500', optionKey: 'time_entries' },
    { id: 'meetings', label: 'פגישות', icon: Calendar, dataKey: 'Meeting', color: 'purple-500', optionKey: 'meetings' },
    { id: 'quotes', label: 'הצעות מחיר', icon: FileText, dataKey: 'Quote', color: 'orange-500', optionKey: 'quotes' },
    { id: 'invoices', label: 'חשבוניות', icon: FileSpreadsheet, dataKey: 'Invoice', color: 'emerald-500', optionKey: 'invoices' },
    { id: 'team_members', label: 'עובדים', icon: UserCheck, dataKey: 'TeamMember', color: 'indigo-500', optionKey: 'team_members' },
    { id: 'custom_spreadsheets', label: 'טבלאות', icon: FileSpreadsheet, dataKey: 'CustomSpreadsheet', color: 'cyan-500', optionKey: 'custom_spreadsheets' },
    { id: 'documents', label: 'מסמכים', icon: FileText, dataKey: 'Document', color: 'amber-500', optionKey: 'documents' },
    { id: 'user_preferences', label: 'הגדרות', icon: Settings2, dataKey: 'UserPreferences', color: 'slate-500', optionKey: 'user_preferences' },
    { id: 'access_control', label: 'הרשאות', icon: Shield, dataKey: 'AccessControl', color: 'rose-500', optionKey: 'access_control' },
  ];

  return phaseConfigs
    .filter(config => importOptions[config.optionKey])
    .map(config => ({
      id: config.id,
      label: config.label,
      icon: config.icon,
      total: (backupData.data[config.dataKey] as unknown[] | undefined)?.length || 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      status: 'pending' as const,
      color: config.color,
    }));
}
