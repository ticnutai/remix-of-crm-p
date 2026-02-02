// Client Deadlines Tab - טאב זמנים בתיק לקוח
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  Timer,
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { useClientDeadlines, ClientDeadline } from '@/hooks/useClientDeadlines';
import { formatRemainingDays } from '@/hooks/useIsraeliWorkdays';
import { AddDeadlineDialog } from './AddDeadlineDialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ClientDeadlinesTabProps {
  clientId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  submission: 'הגשה',
  response: 'המתנה לתשובה',
  appeal: 'ערעור',
  permit: 'היתר',
  custom: 'אחר',
};

const CATEGORY_COLORS: Record<string, string> = {
  submission: 'bg-blue-100 text-blue-700 border-blue-200',
  response: 'bg-purple-100 text-purple-700 border-purple-200',
  appeal: 'bg-orange-100 text-orange-700 border-orange-200',
  permit: 'bg-green-100 text-green-700 border-green-200',
  custom: 'bg-gray-100 text-gray-700 border-gray-200',
};

const URGENCY_STYLES = {
  safe: {
    border: 'border-green-200 dark:border-green-800',
    bg: 'bg-green-50 dark:bg-green-950/20',
    progress: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    icon: CheckCircle2,
  },
  warning: {
    border: 'border-yellow-200 dark:border-yellow-800',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    progress: 'bg-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: Clock,
  },
  danger: {
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950/20',
    progress: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    icon: AlertTriangle,
  },
  overdue: {
    border: 'border-red-400 dark:border-red-600',
    bg: 'bg-red-100 dark:bg-red-950/40',
    progress: 'bg-red-600',
    text: 'text-red-700 dark:text-red-300',
    icon: XCircle,
  },
};

export function ClientDeadlinesTab({ clientId }: ClientDeadlinesTabProps) {
  const {
    deadlines,
    loading,
    completeDeadline,
    cancelDeadline,
    reactivateDeadline,
    deleteDeadline,
    getStats,
  } = useClientDeadlines(clientId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<ClientDeadline | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const stats = getStats();
  const activeDeadlines = deadlines.filter(d => d.status === 'active' || d.status === 'overdue');
  const completedDeadlines = deadlines.filter(d => d.status === 'completed' || d.status === 'cancelled');

  const handleDelete = async () => {
    if (selectedDeadline) {
      await deleteDeadline(selectedDeadline.id);
      setDeleteDialogOpen(false);
      setSelectedDeadline(null);
    }
  };

  const DeadlineCard = ({ deadline }: { deadline: ClientDeadline }) => {
    const urgency = deadline.urgency || 'safe';
    const styles = URGENCY_STYLES[urgency];
    const UrgencyIcon = styles.icon;
    const progress = deadline.deadline_days > 0 
      ? Math.min(100, ((deadline.days_passed || 0) / deadline.deadline_days) * 100)
      : 100;

    return (
      <Card className={cn(
        "transition-all hover:shadow-md",
        styles.border,
        styles.bg,
        deadline.status === 'completed' && "opacity-60",
        deadline.status === 'cancelled' && "opacity-40"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left side - Icon and Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                urgency === 'overdue' ? "bg-red-500" : 
                urgency === 'danger' ? "bg-red-400" :
                urgency === 'warning' ? "bg-yellow-400" : "bg-green-400"
              )}>
                <UrgencyIcon className="h-5 w-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-[#1e3a5f] dark:text-white truncate">
                    {deadline.title}
                  </h4>
                  <Badge 
                    variant="outline" 
                    className={cn("shrink-0 text-xs", CATEGORY_COLORS[deadline.category])}
                  >
                    {CATEGORY_LABELS[deadline.category]}
                  </Badge>
                </div>
                
                {deadline.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                    {deadline.description}
                  </p>
                )}

                {/* Dates */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    התחלה: {format(new Date(deadline.start_date), 'd בMMMM yyyy', { locale: he })}
                  </span>
                  {deadline.deadline_date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      סיום: {format(deadline.deadline_date, 'd בMMMM yyyy', { locale: he })}
                    </span>
                  )}
                </div>

                {/* Progress */}
                {deadline.status === 'active' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        עברו {deadline.days_passed} מתוך {deadline.deadline_days} ימים
                      </span>
                      <span className={cn("font-medium", styles.text)}>
                        {formatRemainingDays(deadline.days_remaining || 0)}
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2"
                      // @ts-ignore
                      indicatorClassName={styles.progress}
                    />
                  </div>
                )}

                {/* Completed/Cancelled status */}
                {deadline.status === 'completed' && deadline.completed_at && (
                  <p className="text-xs text-green-600">
                    ✓ הושלם ב-{format(new Date(deadline.completed_at), 'd בMMMM yyyy', { locale: he })}
                  </p>
                )}
                {deadline.status === 'cancelled' && (
                  <p className="text-xs text-gray-500">
                    ✗ בוטל
                  </p>
                )}
              </div>
            </div>

            {/* Right side - Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {deadline.status === 'active' && (
                  <>
                    <DropdownMenuItem onClick={() => completeDeadline(deadline.id)}>
                      <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />
                      סמן כהושלם
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => cancelDeadline(deadline.id)}>
                      <XCircle className="h-4 w-4 ml-2 text-gray-500" />
                      בטל
                    </DropdownMenuItem>
                  </>
                )}
                {(deadline.status === 'completed' || deadline.status === 'cancelled') && (
                  <DropdownMenuItem onClick={() => reactivateDeadline(deadline.id)}>
                    <RotateCcw className="h-4 w-4 ml-2 text-blue-500" />
                    הפעל מחדש
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedDeadline(deadline);
                    setDeleteDialogOpen(true);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <Timer className="h-5 w-5 text-[#d4a843]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e3a5f] dark:text-white">מניין זמנים</h2>
            <p className="text-sm text-muted-foreground">ספירת ימי עבודה ולוחות זמנים</p>
          </div>
        </div>
        
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2 bg-[#1e3a5f] hover:bg-[#2d4a6f]">
          <Plus className="h-4 w-4" />
          הוסף מניין
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Timer className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.active}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">פעילים</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-red-200",
          stats.overdue > 0 && "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 animate-pulse"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.overdue}</p>
                <p className="text-xs text-red-600 dark:text-red-400">פג תוקף</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-yellow-200",
          stats.warning > 0 && "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.warning + stats.danger}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">דורשים תשומת לב</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
                <p className="text-xs text-green-600 dark:text-green-400">הושלמו</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Deadlines */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-[#1e3a5f] dark:text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          מניינים פעילים
        </h3>
        
        {activeDeadlines.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">אין מניינים פעילים</p>
              <Button variant="outline" onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                הוסף מניין ראשון
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {/* Sort: overdue first, then by remaining days */}
            {activeDeadlines
              .sort((a, b) => {
                if (a.status === 'overdue' && b.status !== 'overdue') return -1;
                if (b.status === 'overdue' && a.status !== 'overdue') return 1;
                return (a.days_remaining || 0) - (b.days_remaining || 0);
              })
              .map(deadline => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))
            }
          </div>
        )}
      </div>

      {/* Completed Deadlines (Collapsible) */}
      {completedDeadlines.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between text-muted-foreground hover:text-foreground"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              מניינים שהושלמו ({completedDeadlines.length})
            </span>
            {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showCompleted && (
            <div className="grid gap-3 mt-3">
              {completedDeadlines.map(deadline => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Dialog */}
      <AddDeadlineDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        clientId={clientId}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מניין</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את "{selectedDeadline?.title}"?
              פעולה זו תמחק גם את כל התזכורות הקשורות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ClientDeadlinesTab;
