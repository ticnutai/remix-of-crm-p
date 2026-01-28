// App Layout - Full width content with overlay sidebar
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppHeader } from './AppHeader';
import { FloatingTimer } from '@/components/timer/FloatingTimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { OverlaySidebar } from './OverlaySidebar';
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
  Upload,
  Bell,
  FileSpreadsheet,
  Wallet,
  X,
  Mail,
  HardDrive,
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
  { title: 'משימות ופגישות', url: '/tasks-meetings', icon: Calendar },
  { title: 'תזכורות', url: '/reminders', icon: Bell },
  { title: 'הצעות מחיר', url: '/quotes', icon: FileSpreadsheet },
  { title: 'כספים', url: '/finance', icon: Wallet },
  { title: 'דוחות', url: '/reports', icon: FileSpreadsheet },
  { title: 'לוח שנה', url: '/calendar', icon: Calendar },
  { title: 'Gmail', url: '/gmail', icon: Mail },
  { title: 'קבצים', url: '/files', icon: HardDrive },
];

const systemNavItems = [
  { title: 'מרכז נתונים', url: '/data-hub', icon: Database },
  { title: 'היסטוריה', url: '/history', icon: History },
  { title: 'הגדרות', url: '/settings', icon: Settings },
  { title: 'עזרה', url: '/help', icon: HelpCircle },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { tables } = useCustomTables();
  
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

  // Content margin adjusts when sidebar is pinned OR showing
  const contentMarginRight = !isMobile && (sidebarPinned || sidebarShowing) ? sidebarWidth : 0;

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* Main Content - Adjusts margin when sidebar is pinned */}
      <div 
        className="flex flex-col min-h-screen w-full max-w-full transition-all duration-300 ease-out"
        style={{ marginRight: contentMarginRight }}
      >
        <AppHeader 
          title={title} 
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-auto relative w-full max-w-full z-0">
          {children}
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
                      e-control
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
      
      {/* Floating Timer Button */}
      <FloatingTimer />
    </div>
  );
}
