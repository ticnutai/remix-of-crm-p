// App Sidebar - TEN Arch CRM Pro with Auto-hide and Pin functionality
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileSpreadsheet,
  Calendar,
  Settings,
  Database,
  History,
  HelpCircle,
  Building2,
  UserCog,
  Clock,
  Table,
  Pin,
  PinOff,
  Upload,
  Bell,
  Plus,
  Wallet,
  Link2,
  Palette,
  GripVertical,
  X,
  Hand,
  MousePointerClick,
  Mail,
  HardDrive,
  Zap,
  FileBarChart,
  Phone,
  Files,
  LayoutGrid,
  Gauge,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomTables } from '@/hooks/useCustomTables';
import { CreateTableDialog } from '@/components/custom-tables/CreateTableDialog';
import { SidebarTasksMeetings } from './sidebar-tasks';
import { DataTypeManager } from '@/components/tables/DataTypeManager';
import { SidebarSettingsDialog, SidebarTheme, defaultSidebarTheme } from './SidebarSettingsDialog';
import {
  SidebarGesturesDialog,
  SidebarGesturesConfig,
  loadGesturesConfig,
  saveGesturesConfig,
} from './SidebarGesturesSettings';
import {
  ButtonGesturesDialog,
  ButtonGesturesConfig,
  loadButtonGesturesConfig,
  saveButtonGesturesConfig,
} from './ButtonGesturesSettings';

// Icon color scheme - luxurious navy and gold
const iconColors = {
  navy: 'text-[#162C58]',
  gold: 'text-[#d8ac27]',
  gray: 'text-[#8B8D94]',
};

// Luxury sidebar colors
const sidebarColors = {
  navy: '#162C58',
  gold: '#d8ac27',
  goldLight: '#e8c85a',
  goldDark: '#b8941f',
  navyLight: '#1E3A6E',
  navyDark: '#0F1F3D',
};

const mainNavItems = [
  { title: 'לוח בקרה', url: '/', icon: LayoutDashboard, color: iconColors.navy },
  { title: 'דשבורד מנהל', url: '/dashboard', icon: Gauge, color: iconColors.gold },
  { title: 'היום שלי', url: '/my-day', icon: Calendar, color: iconColors.gold },
  { title: 'לקוחות', url: '/clients', icon: Users, color: iconColors.gold, canAddTable: true },
  { title: 'טבלת לקוחות', url: '/datatable-pro', icon: Table, color: iconColors.navy, canAddTable: true },
  { title: 'עובדים', url: '/employees', icon: UserCog, color: iconColors.gold, canAddTable: true },
  { title: 'לוגי זמן', url: '/time-logs', icon: Clock, color: iconColors.navy },
  { title: 'ניתוח זמנים', url: '/time-analytics', icon: Clock, color: iconColors.navy },
  { title: 'משימות ופגישות', url: '/tasks-meetings', icon: Calendar, color: iconColors.gold },
  { title: 'לוח קנבן', url: '/kanban', icon: LayoutGrid, color: iconColors.navy },
  { title: 'תזכורות', url: '/reminders', icon: Bell, color: iconColors.gold },
  { title: 'הצעות מחיר', url: '/quotes', icon: FileSpreadsheet, color: iconColors.gold },
  { title: 'כספים', url: '/finance', icon: Wallet, color: iconColors.gold },
  { title: 'דוחות', url: '/reports', icon: FileSpreadsheet, color: iconColors.gray },
  { title: 'דוחות מותאמים', url: '/custom-reports', icon: FileBarChart, color: iconColors.gold },
  { title: 'לוח שנה', url: '/calendar', icon: Calendar, color: iconColors.gold },
  { title: 'Gmail', url: '/gmail', icon: Mail, color: iconColors.gold },
  { title: 'קבצים', url: '/files', icon: HardDrive, color: iconColors.gold },
  { title: 'מסמכים', url: '/documents', icon: Files, color: iconColors.navy },
  { title: 'שיחות', url: '/calls', icon: Phone, color: iconColors.gold },
];

const systemNavItems = [
  { title: 'אוטומציות', url: '/workflows', icon: Zap, color: iconColors.gold },
  { title: 'אנליטיקס', url: '/analytics', icon: FileSpreadsheet, color: iconColors.gold },
  { title: 'לוג שינויים', url: '/audit-log', icon: History, color: iconColors.navy },
  { title: 'תבניות הצעות', url: '/quote-templates', icon: FileSpreadsheet, color: iconColors.gold },
  { title: 'מרכז נתונים', url: '/data-hub', icon: Database, color: iconColors.navy },
  { title: 'היסטוריה', url: '/history', icon: History, color: iconColors.gold },
  { title: 'הגדרות', url: '/settings', icon: Settings, color: iconColors.navy },
  { title: 'עזרה', url: '/help', icon: HelpCircle, color: iconColors.gray },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const isCollapsed = state === 'collapsed';
  
  // Custom tables
  const { tables, canManage, fetchTables } = useCustomTables();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDataTypeManagerOpen, setIsDataTypeManagerOpen] = useState(false);
  const [isSidebarSettingsOpen, setIsSidebarSettingsOpen] = useState(false);
  const [isGesturesSettingsOpen, setIsGesturesSettingsOpen] = useState(false);
  const [isButtonGesturesOpen, setIsButtonGesturesOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isWidgetSettingsOpen, setIsWidgetSettingsOpen] = useState(false);
  const [widgetEditMode, setWidgetEditMode] = useState(() => {
    const saved = localStorage.getItem('widget-edit-mode');
    return saved === 'true';
  });
  
  // Save widget edit mode to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem('widget-edit-mode', String(widgetEditMode));
    window.dispatchEvent(new CustomEvent('widgetEditModeChanged', { detail: { enabled: widgetEditMode } }));
  }, [widgetEditMode]);
  
  // Sidebar theme
  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(() => {
    const saved = localStorage.getItem('sidebar-theme');
    return saved ? JSON.parse(saved) : defaultSidebarTheme;
  });
  
  // Gestures configuration
  const [gesturesConfig, setGesturesConfig] = useState<SidebarGesturesConfig>(() => loadGesturesConfig());
  
  // Button gestures configuration
  const [buttonGesturesConfig, setButtonGesturesConfig] = useState<ButtonGesturesConfig>(() => loadButtonGesturesConfig());
  
  // Sidebar resizing
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved) : gesturesConfig.minWidth + (gesturesConfig.maxWidth - gesturesConfig.minWidth) / 2;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Pin state - when pinned, sidebar stays open
  const [isPinned, setIsPinned] = useState(() => {
    if (!gesturesConfig.pinRememberState) return false;
    const saved = localStorage.getItem('sidebar-pinned');
    return saved === 'true';
  });
  
  // Track if mouse is hovering over sidebar or edge trigger
  const [isHovering, setIsHovering] = useState(false);
  const [showEdgeTrigger, setShowEdgeTrigger] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Save pin state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-pinned', String(isPinned));
  }, [isPinned]);
  
  // Save sidebar theme to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-theme', JSON.stringify(sidebarTheme));
  }, [sidebarTheme]);
  
  // Save sidebar width to localStorage and update CSS variable
  useEffect(() => {
    localStorage.setItem('sidebar-width', String(sidebarWidth));
    // Update the CSS variable on the SidebarProvider wrapper
    const wrapper = document.querySelector('.group\\/sidebar-wrapper');
    if (wrapper) {
      (wrapper as HTMLElement).style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    }
  }, [sidebarWidth]);
  
  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);
  
  useEffect(() => {
    if (!gesturesConfig.resizeEnabled) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setSidebarWidth(Math.max(gesturesConfig.minWidth, Math.min(gesturesConfig.maxWidth, newWidth)));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, gesturesConfig.resizeEnabled, gesturesConfig.minWidth, gesturesConfig.maxWidth]);

  // Save pin state to localStorage
  useEffect(() => {
    if (gesturesConfig.pinRememberState) {
      localStorage.setItem('sidebar-pinned', String(isPinned));
    }
  }, [isPinned, gesturesConfig.pinRememberState]);

  // Handle auto-hide logic with configurable delay
  useEffect(() => {
    if (!gesturesConfig.autoHideEnabled) return;
    
    if (!isPinned && !isHovering) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, gesturesConfig.autoHideDelay);
      return () => clearTimeout(timer);
    }
    if (isHovering && !isPinned && gesturesConfig.hoverEnabled) {
      setOpen(true);
    }
  }, [isPinned, isHovering, setOpen, gesturesConfig.autoHideEnabled, gesturesConfig.autoHideDelay, gesturesConfig.hoverEnabled]);

  // Initialize sidebar state based on pin
  useEffect(() => {
    if (isPinned) {
      setOpen(true);
    }
  }, [isPinned, setOpen]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const togglePin = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  // Track transition state to prevent premature closing
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleEdgeMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (gesturesConfig.hoverEnabled) {
      setShowEdgeTrigger(true);
      setIsHovering(true);
      setOpen(true);
    }
  }, [gesturesConfig.hoverEnabled, setOpen]);

  const handleEdgeMouseLeave = useCallback(() => {
    setShowEdgeTrigger(false);
    setIsTransitioning(true);
    
    // Grace period before checking if we should close
    hoverTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, []);

  return (
    <>
      {/* Hover buffer zone - extended area for smoother interaction */}
      {gesturesConfig.edgeTriggerEnabled && (isHovering || showEdgeTrigger || isTransitioning) && (
        <div
          className="fixed top-0 right-0 h-full z-[5] pointer-events-auto"
          style={{ width: `${sidebarWidth + 50}px` }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setIsHovering(true);
          }}
          onMouseLeave={() => {
            if (!isPinned) {
              setIsHovering(false);
            }
          }}
        />
      )}

      {/* Edge trigger - invisible area on the right edge that shows pin button on hover */}
      {gesturesConfig.edgeTriggerEnabled && (
        <div
          className="fixed top-0 right-0 h-full z-[6] group"
          style={{ width: `${gesturesConfig.edgeTriggerWidth}px` }}
          onMouseEnter={handleEdgeMouseEnter}
          onMouseLeave={handleEdgeMouseLeave}
        >
          {/* Pin button that appears on edge hover */}
          {gesturesConfig.pinEnabled && (
            <div
              className={cn(
                "absolute top-4 right-0 transition-all transform",
                showEdgeTrigger || isHovering ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
              )}
              style={{ transitionDuration: `${gesturesConfig.animationSpeed}ms` }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={togglePin}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-l-lg shadow-lg transition-all",
                      "bg-sidebar border border-border border-r-0",
                      "hover:bg-accent",
                      isPinned && "bg-primary/10 text-primary"
                    )}
                    style={{ transitionDuration: `${gesturesConfig.animationSpeed}ms` }}
                  >
                    {isPinned ? (
                      <Pin className="h-5 w-5" />
                    ) : (
                      <PinOff className="h-5 w-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {isPinned ? 'בטל הצמדה' : 'הצמד סיידבר'}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      )}

      <Sidebar
        ref={sidebarRef}
        side="right"
        collapsible="icon"
        style={{ 
          '--sidebar-width': `${sidebarWidth}px`,
          background: sidebarColors.navy,
          color: '#FFFFFF',
          fontFamily: sidebarTheme.fontFamily || 'Heebo',
          fontSize: `${sidebarTheme.fontSize || 14}px`,
          fontWeight: sidebarTheme.fontWeight || '400',
          transitionDuration: `${gesturesConfig.animationSpeed}ms`,
          willChange: 'transform, opacity',
        } as React.CSSProperties}
        className={cn(
          "z-[100]",
          "transition-all ease-out",
          "border-2 border-[#D4A843] rounded-2xl m-2",
          // Use transform for GPU acceleration instead of opacity+pointer-events
          isPinned || isHovering || isTransitioning
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-full opacity-0 pointer-events-none",
          isResizing && "transition-none"
        )}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          setIsHovering(true);
        }}
        onMouseLeave={() => {
          if (!isPinned) {
            // Add grace period before hiding
            hoverTimeoutRef.current = setTimeout(() => {
              setIsHovering(false);
            }, 150);
          }
        }}
      >
        {/* Resize Handle on the left - Luxury Gold Grip */}
        {gesturesConfig.resizeEnabled && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize z-50 flex items-center justify-center",
              "transition-all"
            )}
            style={{ 
              background: `linear-gradient(to right, ${sidebarColors.gold}20, transparent)`,
              transitionDuration: `${gesturesConfig.animationSpeed}ms` 
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Visible grip handle */}
            <div 
              className={cn(
                "flex flex-col gap-1 items-center justify-center h-16 w-3 rounded-full transition-all",
                isResizing && "scale-110"
              )}
              style={{ 
                background: `${sidebarColors.gold}40`,
                border: `1px solid ${sidebarColors.gold}60`,
                transitionDuration: `${gesturesConfig.animationSpeed}ms` 
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: sidebarColors.gold }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: sidebarColors.gold }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: sidebarColors.gold }} />
            </div>
          </div>
        )}
        {/* Header with Logo and Pin Button - Clean Design */}
        <SidebarHeader 
          className="p-4 relative"
          style={{ 
            borderBottom: `1px solid ${sidebarColors.gold}40`,
          }}
        >
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            isCollapsed && "justify-center"
          )}>
            {/* Pin button on the left */}
            {!isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={togglePin}
                    className="flex items-center justify-center w-8 h-8 transition-all duration-200"
                    style={{ 
                      color: isPinned ? sidebarColors.gold : sidebarColors.goldLight,
                    }}
                  >
                    {isPinned ? (
                      <Pin className="h-4 w-4" />
                    ) : (
                      <PinOff className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {isPinned ? 'בטל הצמדה' : 'הצמד סיידבר'}
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Title and subtitle in the middle */}
            {!isCollapsed && (
              <div className="flex flex-col flex-1 text-right">
                <span 
                  className="font-bold tracking-wide"
                  style={{ 
                    fontSize: `${sidebarTheme.titleFontSize || 18}px`,
                    color: '#FFFFFF',
                  }}
                >
                  e-control
                </span>
                <span 
                  className="text-xs font-medium"
                  style={{ color: sidebarColors.goldLight }}
                >
                  CRM Pro Max
                </span>
              </div>
            )}
            
            {/* Logo on the right */}
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ 
                background: sidebarColors.gold,
              }}
            >
              <Building2 className="h-5 w-5" style={{ color: sidebarColors.navy }} />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent 
          className="px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent" 
          style={{ 
            maxHeight: 'calc(100vh - 160px)',
            scrollbarColor: `${sidebarColors.gold}40 transparent`,
          }}
        >
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel 
              className={cn(
                "font-medium mb-3 text-xs text-right pr-2",
                isCollapsed && "sr-only"
              )} 
              style={{ 
                fontSize: `${sidebarTheme.labelFontSize || 11}px`,
                color: sidebarColors.goldLight,
              }}
            >
              ניווט ראשי
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {mainNavItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <div className="flex items-center">
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                          className="flex-1"
                        >
                          <NavLink
                            to={item.url}
                            className="flex items-center justify-end gap-3 rounded-lg transition-all duration-200"
                            style={{ 
                              padding: '10px 12px',
                              color: active ? sidebarColors.gold : sidebarColors.goldLight,
                              background: active ? `${sidebarColors.gold}20` : 'transparent',
                            }}
                          >
                            {!isCollapsed && (
                              <span className="whitespace-nowrap overflow-hidden text-ellipsis font-medium text-right flex-1">
                                {item.title}
                              </span>
                            )}
                            <item.icon 
                              style={{ 
                                width: `${sidebarTheme.iconSize || 20}px`, 
                                height: `${sidebarTheme.iconSize || 20}px`,
                                color: sidebarColors.gold,
                              }} 
                              className="shrink-0" 
                            />
                          </NavLink>
                        </SidebarMenuButton>
                        {/* Plus button for adding custom tables */}
                        {!isCollapsed && item.canAddTable && canManage && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setIsCreateDialogOpen(true)}
                                className="p-1.5 rounded-lg transition-all duration-200"
                                style={{ 
                                  color: sidebarColors.goldLight,
                                  background: 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = sidebarColors.gold;
                                  e.currentTarget.style.background = `${sidebarColors.gold}20`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = sidebarColors.goldLight;
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              הוסף טבלה מותאמת אישית
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Tasks & Meetings Widget */}
          <SidebarGroup className="mt-2">
            <SidebarTasksMeetings isCollapsed={isCollapsed} />
          </SidebarGroup>

          {/* System Navigation - at the bottom of main nav */}

          {/* System Navigation - Hidden for cleaner look like the image */}
        </SidebarContent>

        {/* Footer with Settings Button - Clean Design */}
        <SidebarFooter 
          className="p-4"
          style={{ 
            borderTop: `1px solid ${sidebarColors.gold}40`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            {/* Settings Icon on the left */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsQuickSettingsOpen(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300"
                  style={{ 
                    border: `2px solid ${sidebarColors.gold}`,
                    background: 'transparent',
                    color: sidebarColors.gold,
                  }}
                >
                  <Settings className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                הגדרות מהירות
              </TooltipContent>
            </Tooltip>
            
            {/* Version on the right */}
            <div className={cn(
              "transition-all text-right",
              isCollapsed && "sr-only"
            )} style={{ 
              fontSize: '11px',
              color: sidebarColors.goldLight,
            }}>
              <p className="font-medium">גרסה 1.0.0</p>
            </div>
          </div>
        </SidebarFooter>
        
        {/* Quick Settings Sheet */}
        <Sheet open={isQuickSettingsOpen} onOpenChange={setIsQuickSettingsOpen}>
          <SheetContent side="right" className="w-[340px] p-0 overflow-hidden" dir="rtl">
            <SheetHeader className="border-b border-border/50 p-4 bg-gradient-to-b from-[hsl(45,80%,50%)]/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[hsl(45,80%,50%)] text-[hsl(45,80%,50%)]">
                  <Settings className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <SheetTitle className="font-bold tracking-tight text-lg">
                    הגדרות מהירות
                  </SheetTitle>
                  <span className="text-xs text-muted-foreground">
                    התאמה אישית של התצוגה
                  </span>
                </div>
              </div>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-4 space-y-4">
                {/* Design Settings */}
                <button
                  onClick={() => {
                    setIsQuickSettingsOpen(false);
                    setIsSidebarSettingsOpen(true);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                    "border-2 border-[hsl(45,80%,50%)]/30 hover:border-[hsl(45,80%,50%)]",
                    "bg-[hsl(45,80%,50%)]/5 hover:bg-[hsl(45,80%,50%)]/10"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(45,80%,50%)]/20 text-[hsl(45,80%,50%)]">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-medium">הגדרות עיצוב</p>
                    <p className="text-xs text-muted-foreground">צבעים, פונטים וסגנון הסיידבר</p>
                  </div>
                </button>
                
                {/* Widget Settings */}
                <button
                  onClick={() => {
                    setIsQuickSettingsOpen(false);
                    setIsWidgetSettingsOpen(true);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                    "border-2 border-primary/30 hover:border-primary",
                    "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-medium">הגדרות וידג'טים</p>
                    <p className="text-xs text-muted-foreground">הזזה, שינוי גודל והסתרת רכיבים</p>
                  </div>
                </button>
                
                {/* Gestures Settings */}
                <button
                  onClick={() => {
                    setIsQuickSettingsOpen(false);
                    setIsGesturesSettingsOpen(true);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                    "border-2 border-muted hover:border-primary/50",
                    "bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Hand className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-medium">הגדרות מחוות סיידבר</p>
                    <p className="text-xs text-muted-foreground">הצמדה, מעבר ואנימציות</p>
                  </div>
                </button>
                
                {/* Button Gestures */}
                <button
                  onClick={() => {
                    setIsQuickSettingsOpen(false);
                    setIsButtonGesturesOpen(true);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                    "border-2 border-muted hover:border-primary/50",
                    "bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <MousePointerClick className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-medium">הגדרות מחוות כפתורים</p>
                    <p className="text-xs text-muted-foreground">התנהגות לחיצות ארוכות</p>
                  </div>
                </button>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
        
        {/* Widget Settings Sheet */}
        <Sheet open={isWidgetSettingsOpen} onOpenChange={setIsWidgetSettingsOpen}>
          <SheetContent side="right" className="w-[340px] p-0 overflow-hidden" dir="rtl">
            <SheetHeader className="border-b border-border/50 p-4 bg-gradient-to-b from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <SheetTitle className="font-bold tracking-tight text-lg">
                    הגדרות וידג'טים
                  </SheetTitle>
                  <span className="text-xs text-muted-foreground">
                    שליטה בתצוגת לוח הבקרה
                  </span>
                </div>
              </div>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-4 space-y-4">
                {/* Edit Mode Toggle */}
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-xl",
                  "border-2",
                  widgetEditMode 
                    ? "border-[hsl(45,80%,50%)] bg-[hsl(45,80%,50%)]/10" 
                    : "border-muted bg-muted/20"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      widgetEditMode 
                        ? "bg-[hsl(45,80%,50%)]/20 text-[hsl(45,80%,50%)]" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <p className="font-medium">מצב עריכה</p>
                      <p className="text-xs text-muted-foreground">
                        {widgetEditMode ? 'ניתן להזיז ולשנות גודל' : 'הידיות מוסתרות'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={widgetEditMode}
                    onCheckedChange={setWidgetEditMode}
                    className="data-[state=checked]:bg-[hsl(45,80%,50%)]"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground text-center px-4">
                  כשמצב עריכה פעיל, תוכל לגרור וידג'טים ולשנות את גודלם בלוח הבקרה
                </p>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </Sidebar>
      
      {/* Create Table Dialog */}
      <CreateTableDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchTables}
      />
      
      {/* Data Type Manager Dialog */}
      <DataTypeManager
        open={isDataTypeManagerOpen}
        onOpenChange={setIsDataTypeManagerOpen}
      />
      
      {/* Sidebar Settings Dialog */}
      <SidebarSettingsDialog
        open={isSidebarSettingsOpen}
        onOpenChange={setIsSidebarSettingsOpen}
        theme={sidebarTheme}
        onThemeChange={(newTheme) => {
          setSidebarTheme(newTheme);
          setSidebarWidth(newTheme.width);
        }}
      />
      
      {/* Gestures Settings Dialog */}
      <SidebarGesturesDialog
        open={isGesturesSettingsOpen}
        onOpenChange={setIsGesturesSettingsOpen}
        config={gesturesConfig}
        onConfigChange={(newConfig) => {
          setGesturesConfig(newConfig);
          saveGesturesConfig(newConfig);
          // Update sidebar width if it's outside new range
          if (sidebarWidth < newConfig.minWidth) {
            setSidebarWidth(newConfig.minWidth);
          } else if (sidebarWidth > newConfig.maxWidth) {
            setSidebarWidth(newConfig.maxWidth);
          }
        }}
      />
      
      {/* Button Gestures Settings Dialog */}
      <ButtonGesturesDialog
        open={isButtonGesturesOpen}
        onOpenChange={setIsButtonGesturesOpen}
        config={buttonGesturesConfig}
        onConfigChange={(newConfig) => {
          setButtonGesturesConfig(newConfig);
          saveButtonGesturesConfig(newConfig);
        }}
      />
    </>
  );
}

// Mobile Sidebar Component using Sheet for mobile view
interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { tables } = useCustomTables();

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[85vw] max-w-[320px] sm:w-[280px] p-0 overflow-hidden [&>button:first-child]:hidden" 
        dir="rtl"
      >
        {/* Swipe Handle Indicator */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/30 rounded-full z-10" />
        
        <SheetHeader className="border-b border-border/50 p-3 sm:p-4 pt-5 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Logo and title on the right */}
            <div className="flex items-center flex-row-reverse gap-2 sm:gap-3 flex-1">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[hsl(220,60%,25%)] text-white shadow-md">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="flex flex-col items-end flex-1 min-w-0">
                <SheetTitle className="font-bold tracking-tight text-base sm:text-lg truncate">
                  e-control
                </SheetTitle>
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  CRM Pro Max
                </span>
              </div>
            </div>
            
            {/* Close button on the left - more prominent */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 border-2 border-muted-foreground/30 hover:bg-destructive/10 hover:border-destructive shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)]">
          <div className="p-2 sm:p-3 space-y-3 sm:space-y-4">
            {/* Main Navigation */}
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground/70 mb-2 px-2 text-right">ניווט ראשי</p>
              <div className="space-y-0.5 sm:space-y-1">
                {mainNavItems.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleNavClick(item.url)}
                    className={cn(
                      "flex items-center flex-row-reverse gap-2 sm:gap-3 w-full rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 text-right",
                      "hover:bg-accent/50 active:scale-[0.98]",
                      isActive(item.url) && "bg-primary/10 font-medium border-r-2 border-primary"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", item.color)} />
                    <span className={cn(
                      "truncate flex-1",
                      isActive(item.url) && "text-primary"
                    )}>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tables */}
            {tables.length > 0 && (
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-primary mb-2 px-2 flex items-center flex-row-reverse gap-1.5 sm:gap-2">
                  <Table className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="flex-1 text-right">טבלאות מותאמות</span>
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 bg-primary/20 text-primary">
                    {tables.length}
                  </Badge>
                </p>
                <div className="space-y-0.5 sm:space-y-1 rounded-lg border-2 border-primary/40 bg-primary/5 p-1">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => handleNavClick(`/custom-table/${table.id}`)}
                      className={cn(
                        "flex items-center flex-row-reverse gap-2 sm:gap-3 w-full rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 text-right",
                        "hover:bg-primary/10 active:scale-[0.98]",
                        location.pathname === `/custom-table/${table.id}` && "bg-primary/20 font-medium border-r-2 border-primary"
                      )}
                    >
                      <Table className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[hsl(45,80%,45%)]" />
                      <span className="truncate font-medium flex-1">{table.display_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* System Navigation */}
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground/70 mb-2 px-2 text-right">מערכת</p>
              <div className="space-y-0.5 sm:space-y-1">
                {systemNavItems.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleNavClick(item.url)}
                    className={cn(
                      "flex items-center flex-row-reverse gap-2 sm:gap-3 w-full rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 text-right",
                      "hover:bg-accent/50 active:scale-[0.98]",
                      isActive(item.url) && "bg-[hsl(45,80%,45%)]/10 font-medium border-r-2 border-[hsl(45,80%,45%)]"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", item.color)} />
                    <span className={cn(
                      "truncate flex-1",
                      isActive(item.url) && "text-[hsl(45,80%,45%)]"
                    )}>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-2 sm:p-3 bg-background">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">גרסה 1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}