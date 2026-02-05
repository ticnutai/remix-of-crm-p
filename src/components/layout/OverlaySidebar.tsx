import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Database,
  History,
  UserCog,
  Clock,
  Table,
  Pin,
  PinOff,
  Upload,
  Bell,
  FileSpreadsheet,
  Wallet,
  Building2,
  Mail,
  HardDrive,
  TestTube,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCustomTables } from '@/hooks/useCustomTables';
import { cn } from '@/lib/utils';
import { SidebarTasksMeetings } from './sidebar-tasks';

// Navigation items - SIMPLIFIED
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
  { title: 'תשלומים', url: '/payments', icon: Wallet },
  { title: 'דוחות', url: '/reports', icon: FileSpreadsheet },
  { title: 'לוח שנה', url: '/calendar', icon: Calendar },
  { title: 'Gmail', url: '/gmail', icon: Mail },
  { title: '📁 קבצים', url: '/files', icon: HardDrive },
  { title: '🤖 כלים חכמים', url: '/smart-tools', icon: Bot },
];

const systemNavItems = [
  { title: 'גיבויים וייבוא', url: '/backups', icon: Database },
  { title: 'היסטוריה', url: '/history', icon: History },
  { title: 'הגדרות', url: '/settings', icon: Settings },
  { title: '🧪 בדיקות', url: '/tests', icon: TestTube },
];

interface OverlaySidebarProps {
  isPinned: boolean;
  onPinChange: (pinned: boolean) => void;
  width: number;
  onWidthChange: (width: number) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export function OverlaySidebar({ isPinned, onPinChange, width, onWidthChange, onVisibilityChange }: OverlaySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Notify parent about visibility changes
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(isPinned || isOpen);
    }
  }, [isPinned, isOpen, onVisibilityChange]);

  const location = useLocation();
  const { tables } = useCustomTables();

  // Mouse edge detection for auto-open
  useEffect(() => {
    if (isPinned) return; // Don't auto-open if pinned

    const handleMouseMove = (e: MouseEvent) => {
      const edgeThreshold = 10; // pixels from edge
      const screenWidth = window.innerWidth;
      
      // Check if mouse is near right edge
      if (screenWidth - e.clientX <= edgeThreshold) {
        setIsOpen(true);
      } else if (e.clientX < screenWidth - width - 50) {
        // Close if mouse moves away from sidebar
        setIsOpen(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPinned, width]);

  // CRITICAL: shouldShow determines visibility
  const shouldShow = isPinned || isOpen;

  // Handle resize dragging
  useEffect(() => {
    if (!isResizing) return;

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newWidth = window.innerWidth - e.clientX;
      // Limit width between 200px and 600px
      if (newWidth >= 200 && newWidth <= 600) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, onWidthChange]);

  // Remove this - margin is now handled in AppLayout.tsx
  // useEffect for padding is no longer needed

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handlePinToggle = () => {
    const newPinned = !isPinned;
    console.log('📌 PIN TOGGLE:', { from: isPinned, to: newPinned });
    onPinChange(newPinned);
    if (newPinned) {
      console.log('📌 Setting isOpen to TRUE because pinned');
      setIsOpen(true);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ========== SIDEBAR PANEL ========== */}
      <div
        className="fixed top-0 right-0 h-full shadow-2xl"
        style={{
          width: `${width}px`,
          transform: shouldShow ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out',
          zIndex: 50, // Lowered from 100 to be below Sheet (200)
          backgroundColor: '#1e293b',
          borderLeft: '3px solid #ffd700',
          borderRadius: '12px 0 0 12px',
          overflow: 'hidden',
        }}
      >
        {/* Resize Handle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute left-0 top-0 h-full w-2 cursor-ew-resize hover:bg-primary/30 transition-colors group flex items-center justify-center"
              style={{
                backgroundColor: isResizing ? 'hsl(var(--primary) / 0.5)' : 'transparent',
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            >
              {/* Visual indicator - 3 vertical dots */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-0.5 h-1 bg-muted-foreground rounded-full"></div>
                <div className="w-0.5 h-1 bg-muted-foreground rounded-full"></div>
                <div className="w-0.5 h-1 bg-muted-foreground rounded-full"></div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">גרור לשינוי רוחב הסיידבר</p>
          </TooltipContent>
        </Tooltip>
        
        <div className="flex flex-col h-full" dir="rtl">
          {/* Header with Logo & Pin */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255, 215, 0, 0.3)', backgroundColor: '#1e293b', borderRadius: '12px 0 0 0' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg shadow-md" style={{ backgroundColor: '#ffd700', color: '#1e3a8a' }}>
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg"><span style={{ color: '#ffd700' }}>ten</span><span className="text-white">arch</span></span>
                <span className="text-xs" style={{ color: '#ffd700' }}>CRM Pro Max</span>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePinToggle}
                  className={cn(
                    "transition-colors",
                    isPinned ? "hover:bg-yellow-500/30" : "text-gray-400 hover:text-white hover:bg-blue-800"
                  )}
                  style={isPinned ? { color: '#ffd700', backgroundColor: 'rgba(255, 215, 0, 0.2)' } : {}}
                >
                  {isPinned ? <Pin className="h-5 w-5" /> : <PinOff className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">
                  {isPinned 
                    ? "בטל נעיצה - הסרגל יסתתר אוטומטית" 
                    : "נעץ - הסרגל יישאר פתוח והתוכן יזוז"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-3" style={{ overflow: 'hidden' }}>
            <style>{`
              .scrollarea-viewport { scrollbar-width: none; }
              .scrollarea-viewport::-webkit-scrollbar { display: none; }
            `}</style>
            {/* Main Nav */}
            <div className="space-y-1 mb-4">
              <p className="text-xs font-semibold px-3 py-2 uppercase tracking-wider" style={{ color: '#ffd700' }}>
                ניווט ראשי
              </p>
              {mainNavItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-right",
                    isActive(item.url)
                      ? "font-medium shadow-lg"
                      : "text-gray-300 hover:bg-blue-800 hover:text-white"
                  )}
                  style={{
                    ...(isActive(item.url) ? { backgroundColor: '#ffd700', color: '#1e3a8a' } : {}),
                  }}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-right">{item.title}</span>
                </Link>
              ))}
            </div>

            {/* Tasks & Meetings Widget */}
            <div className="my-4 px-1">
              <SidebarTasksMeetings isCollapsed={false} />
            </div>

            <Separator className="my-4" />

            {/* Custom Tables */}
            {tables && tables.length > 0 && (
              <>
                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Table className="h-4 w-4" style={{ color: '#ffd700' }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#ffd700' }}>
                      טבלאות מותאמות
                    </p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-4 border-0" style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)', color: '#ffd700' }}>
                      {tables.length}
                    </Badge>
                  </div>
                  <div className="border rounded-lg p-1" style={{ borderColor: 'rgba(255, 215, 0, 0.3)', backgroundColor: 'rgba(255, 215, 0, 0.05)' }}>
                    {tables.map((table) => (
                      <Link
                        key={table.id}
                        to={`/custom-table/${table.id}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-right",
                          location.pathname === `/custom-table/${table.id}`
                            ? "font-medium shadow-lg"
                            : "hover:text-white"
                        )}
                        style={{
                          ...(location.pathname === `/custom-table/${table.id}` ? { backgroundColor: '#ffd700', color: '#1e3a8a' } : { color: '#ffd700' }),
                        }}
                        onMouseEnter={(e) => {
                          if (location.pathname !== `/custom-table/${table.id}`) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (location.pathname !== `/custom-table/${table.id}`) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <Table className="h-5 w-5 shrink-0" style={{ color: location.pathname === `/custom-table/${table.id}` ? '#1e3a8a' : '#ffd700' }} />
                        <span className="flex-1 text-right">{table.display_name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <Separator className="my-4" />
              </>
            )}

            {/* System Nav */}
            <div className="space-y-1">
              <p className="text-xs font-semibold px-3 py-2 uppercase tracking-wider" style={{ color: '#ffd700' }}>
                מערכת
              </p>
              {systemNavItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-right",
                    isActive(item.url)
                      ? "font-medium shadow-lg"
                      : "text-gray-300 hover:bg-blue-800 hover:text-white"
                  )}
                  style={{
                    ...(isActive(item.url) ? { backgroundColor: '#ffd700', color: '#1e3a8a' } : {}),
                  }}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-right">{item.title}</span>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

export default OverlaySidebar;
