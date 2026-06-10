// App Layout - Full width content with overlay sidebar
import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppHeader } from './AppHeader';
import { FloatingTimer } from '@/components/timer/FloatingTimer';
import { TimerPiPController } from '@/components/timer/TimerPiPController';
import { useIsMobile } from '@/hooks/use-mobile';
import { OverlaySidebar } from './OverlaySidebar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isWorkday } from '@/hooks/useIsraeliWorkdays';
// loadGesturesConfig removed for debug
import { useCustomTables } from '@/hooks/useCustomTables';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Database,
  History,
  HelpCircle,
  Building2,
  UserCog,
  Clock,
  Table,
  Bell,
  FileSpreadsheet,
  Wallet,
  X,
  Mail,
  HardDrive,
  Bot,
  MapPinned,
  AlertTriangle,
} from 'lucide-react';

// Navigation items for mobile
const mainNavItems = [
  { title: 'לוח בקרה', url: '/', icon: LayoutDashboard },
  { title: 'היום שלי', url: '/my-day', icon: Calendar },
  { title: 'לקוחות', url: '/clients', icon: Users },
  { title: 'טבלת לקוחות', url: '/datatable-pro', icon: Table },
  { title: 'עובדים', url: '/employees', icon: UserCog },
  { title: 'לוגי זמן', url: '/time-logs', icon: Clock },
  { title: 'ניתוח זמנים', url: '/time-analytics', icon: Clock },
  { title: 'משימות, פגישות ותזכורות', url: '/tasks-meetings', icon: Calendar },
  { title: 'הצעות מחיר', url: '/quotes', icon: FileSpreadsheet },
  { title: 'כספים', url: '/finance', icon: Wallet },
  { title: 'תשלומים', url: '/payments', icon: Wallet },
  { title: 'דוחות', url: '/reports', icon: FileSpreadsheet },
  { title: 'לוח שנה', url: '/calendar', icon: Calendar },
  { title: 'Gmail', url: '/gmail', icon: Mail },
  { title: '📁 קבצים', url: '/files', icon: HardDrive },
  { title: 'תכנון & GIS', url: '/planning-gis', icon: MapPinned },
  { title: '🤖 כלים חכמים', url: '/smart-tools', icon: Bot },
  { title: '🏢 פורטל לקוחות', url: '/portal-management', icon: Users },
];

const systemNavItems = [
  { title: 'גיבויים וייבוא', url: '/backups', icon: Database },
  { title: 'היסטוריה', url: '/history', icon: History },
  { title: 'הגדרות', url: '/settings', icon: Settings },
  { title: 'עזרה', url: '/help', icon: HelpCircle },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  onTitleClick?: () => void;
}

export const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>(function AppLayout({ children, title, onTitleClick }, ref) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin, isManager, isSuperManager } = useAuth();
  const { tables } = useCustomTables();

  const [missingHoursAlertOpen, setMissingHoursAlertOpen] = useState(false);
  const [missingHoursAlert, setMissingHoursAlert] = useState<{
    date: string;
    reason: 'missing_checkout' | 'missing_day';
  } | null>(null);
  
  // Sidebar state - restored with auto-hide support
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('sidebar-pinned');
    return saved === 'true';
  });
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved) : 260;
  });

  // Track if sidebar is actually showing (open OR pinned)
  const [sidebarShowing, setSidebarShowing] = useState(false);

  // Callback for OverlaySidebar to report its visibility
  const handleSidebarVisibilityChange = useCallback((isShowing: boolean) => {
    setSidebarShowing(isShowing);
  }, []);

  const handlePinChange = (pinned: boolean) => {
    setSidebarPinned(pinned);
    localStorage.setItem('sidebar-pinned', String(pinned));
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (url: string) => {
    navigate(url);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    let cancelled = false;

    const checkMissingHoursForYesterday = async () => {
      if (authLoading || !user?.id) return;
      if (isAdmin || isManager || isSuperManager) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // Skip non-working days (Friday/Saturday + configured Israeli holidays).
      if (!isWorkday(yesterday)) return;

      const ymdDate = yesterday.toISOString().slice(0, 10);
      const loginMarker = user.last_sign_in_at || 'unknown-login';
      const seenKey = `missing-hours-popup-seen:${user.id}:${loginMarker}:${ymdDate}`;
      if (sessionStorage.getItem(seenKey)) return;

      const { data: byWorkDate, error: byWorkDateError } = await supabase
        .from('attendance_records' as any)
        .select('id, work_date, clock_in, clock_out, day_type')
        .eq('user_id', user.id)
        .eq('work_date', ymdDate);

      if (byWorkDateError) {
        console.error('Failed checking attendance by work_date:', byWorkDateError);
        return;
      }

      let records = (byWorkDate || []) as Array<{
        id: string;
        work_date: string | null;
        clock_in: string;
        clock_out: string | null;
        day_type: string | null;
      }>;

      // Backward compatibility for older rows without work_date.
      if (records.length === 0) {
        const dayStart = new Date(yesterday);
        const nextDayStart = new Date(yesterday);
        nextDayStart.setDate(nextDayStart.getDate() + 1);

        const { data: legacyRows, error: legacyError } = await supabase
          .from('attendance_records' as any)
          .select('id, work_date, clock_in, clock_out, day_type')
          .eq('user_id', user.id)
          .gte('clock_in', dayStart.toISOString())
          .lt('clock_in', nextDayStart.toISOString());

        if (legacyError) {
          console.error('Failed checking attendance by clock_in:', legacyError);
          return;
        }

        records = (legacyRows || []) as Array<{
          id: string;
          work_date: string | null;
          clock_in: string;
          clock_out: string | null;
          day_type: string | null;
        }>;
      }

      const hasNonWorkDayRecord = records.some((row) => {
        const dayType = row.day_type || 'work';
        return dayType !== 'work' && dayType !== 'wfh';
      });
      if (hasNonWorkDayRecord) return;

      let reason: 'missing_checkout' | 'missing_day' | null = null;
      if (records.length === 0) {
        reason = 'missing_day';
      } else if (records.some((row) => !row.clock_out)) {
        reason = 'missing_checkout';
      }

      if (!reason || cancelled) return;

      sessionStorage.setItem(seenKey, '1');
      setMissingHoursAlert({ date: ymdDate, reason });
      setMissingHoursAlertOpen(true);
    };

    void checkMissingHoursForYesterday();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, user?.last_sign_in_at, isAdmin, isManager, isSuperManager]);

  const goToYesterdayTimesheet = useCallback(() => {
    if (!missingHoursAlert) return;
    const params = new URLSearchParams({
      tab: 'timesheet',
      focusDate: missingHoursAlert.date,
    });
    setMissingHoursAlertOpen(false);
    navigate(`/attendance?${params.toString()}`);
  }, [missingHoursAlert, navigate]);

  // Sidebar visibility state
  const sidebarVisible = !isMobile && (sidebarPinned || sidebarShowing);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir="rtl">
      {/* Main Content - Uses paddingRight instead of width calc to avoid scrollbar issues */}
      <div 
        className="flex flex-col min-h-screen transition-all duration-300 ease-out"
        style={{ 
          paddingRight: sidebarVisible ? sidebarWidth + 16 : 0,
        }}
      >
        <AppHeader 
          title={title}
          onTitleClick={onTitleClick}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          isMobile={isMobile}
        />
        <main className="flex-1 relative z-0 overflow-x-hidden overflow-y-auto">
          <div className="w-full h-full px-4 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Desktop: Overlay Sidebar */}
      {!isMobile && (
        <OverlaySidebar 
          isPinned={sidebarPinned}
          onPinChange={handlePinChange}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          onVisibilityChange={handleSidebarVisibilityChange}
        />
      )}
      
      {/* Mobile Sidebar - Inline Sheet */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="right"
            hideClose
            className="w-[85vw] max-w-[320px] p-0 overflow-hidden"
            dir="rtl"
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/30 rounded-full z-10" />
            
            <SheetHeader className="border-b border-border/50 p-3 pt-5 bg-gradient-to-b from-primary/5 to-transparent">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center flex-row-reverse gap-2 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(220,60%,25%)] text-white shadow-md">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-end flex-1 min-w-0">
                    <SheetTitle className="font-bold tracking-tight text-base truncate">
                      <span className="text-primary">ten</span><span>arch</span>
                    </SheetTitle>
                    <span className="text-[10px] text-muted-foreground truncate">
                      CRM Pro Max
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 border-2 border-muted-foreground/30 hover:bg-destructive/10 hover:border-destructive shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-2 space-y-3">
                {/* Main Navigation */}
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/70 mb-2 px-2 text-right">ניווט ראשי</p>
                  <div className="space-y-0.5">
                    {mainNavItems.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => handleNavClick(item.url)}
                        className={cn(
                          "flex items-center flex-row-reverse gap-2 w-full rounded-lg px-2 py-2 text-xs transition-all duration-200 text-right",
                          "hover:bg-accent/50 active:scale-[0.98]",
                          isActive(item.url) && "bg-primary/10 font-medium border-r-2 border-primary"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className={cn("truncate flex-1", isActive(item.url) && "text-primary")}>
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Tables */}
                {tables.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-primary mb-2 px-2 flex items-center flex-row-reverse gap-1.5">
                      <Table className="h-3.5 w-3.5" />
                      <span className="flex-1 text-right">טבלאות מותאמות</span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-primary/20 text-primary">
                        {tables.length}
                      </Badge>
                    </p>
                    <div className="space-y-0.5 rounded-lg border-2 border-primary/40 bg-primary/5 p-1">
                      {tables.map((table) => (
                        <button
                          key={table.id}
                          onClick={() => handleNavClick(`/custom-table/${table.id}`)}
                          className={cn(
                            "flex items-center flex-row-reverse gap-2 w-full rounded-lg px-2 py-2 text-xs transition-all duration-200 text-right",
                            "hover:bg-primary/10 active:scale-[0.98]",
                            location.pathname === `/custom-table/${table.id}` && "bg-primary/20 font-medium border-r-2 border-primary"
                          )}
                        >
                          <Table className="h-4 w-4 shrink-0 text-[hsl(45,80%,45%)]" />
                          <span className="truncate font-medium flex-1">{table.display_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Navigation */}
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/70 mb-2 px-2 text-right">מערכת</p>
                  <div className="space-y-0.5">
                    {systemNavItems.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => handleNavClick(item.url)}
                        className={cn(
                          "flex items-center flex-row-reverse gap-2 w-full rounded-lg px-2 py-2 text-xs transition-all duration-200 text-right",
                          "hover:bg-accent/50 active:scale-[0.98]",
                          isActive(item.url) && "bg-[hsl(45,80%,45%)]/10 font-medium border-r-2 border-[hsl(45,80%,45%)]"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className={cn("truncate flex-1", isActive(item.url) && "text-[hsl(45,80%,45%)]")}>
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-2 bg-background">
              <p className="text-[10px] text-muted-foreground text-center">גרסה 1.0.0</p>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Floating Timer Button + Document Picture-in-Picture window */}
      <Dialog open={missingHoursAlertOpen} onOpenChange={setMissingHoursAlertOpen}>
        <DialogContent dir="rtl" className="max-w-2xl border-2 border-red-500">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-7 w-7" />
              אנא השלם שעות עבודה חסרים
            </DialogTitle>
            <DialogDescription className="text-base leading-7 pt-2">
              {missingHoursAlert?.reason === 'missing_checkout'
                ? 'אתמול נרשמה כניסה לעבודה ללא יציאה. חשוב להשלים את הדיווח.'
                : 'לא נמצא דיווח נוכחות ליום העבודה הקודם. חשוב להשלים את שעות העבודה החסרות.'}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm">
            תאריך לבדיקה: {missingHoursAlert?.date ?? '—'}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setMissingHoursAlertOpen(false)}>
              הבנתי
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={goToYesterdayTimesheet}>
              מעבר לעריכה ידנית של אתמול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FloatingTimer />
      <TimerPiPController />
    </div>
  );
});
