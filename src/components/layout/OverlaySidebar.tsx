import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link, useLocation } from "react-router-dom";
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
  Palette,
  MapPinned,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCustomTables } from "@/hooks/useCustomTables";
import { cn } from "@/lib/utils";
import { SidebarTasksMeetings } from "./sidebar-tasks";
import {
  SidebarSettingsDialog,
  SidebarTheme,
  defaultSidebarTheme,
} from "./SidebarSettingsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  isTableAvailable,
  markTableUnavailable,
} from "@/lib/supabaseTableCheck";
import {
  SidebarItemsCustomizerDialog,
  useSidebarItemsConfig,
} from "./SidebarItemsCustomizer";

// Navigation items - SIMPLIFIED
const mainNavItems = [
  { title: "לוח בקרה", url: "/", icon: LayoutDashboard },
  { title: "היום שלי", url: "/my-day", icon: Calendar },
  { title: "לקוחות", url: "/clients", icon: Users },
  { title: "טבלת לקוחות", url: "/datatable-pro", icon: Table },
  { title: "עובדים", url: "/employees", icon: UserCog },
  { title: "לוגי זמן", url: "/time-logs", icon: Clock },
  { title: "נוכחות שלי", url: "/attendance", icon: Clock },
  { title: "נוכחות עובדים", url: "/attendance/admin", icon: UserCog, adminOnly: true },
  { title: "שכר ופנסיה (HR)", url: "/hr", icon: Wallet, adminOnly: true },
  { title: "ניתוח זמנים", url: "/time-analytics", icon: Clock },
  { title: "משימות, פגישות ותזכורות", url: "/tasks-meetings", icon: Calendar },
  { title: "הצעות מחיר", url: "/quotes", icon: FileSpreadsheet },
  { title: "כספים", url: "/finance", icon: Wallet, adminOnly: true },
  { title: "תשלומים", url: "/payments", icon: Wallet },
  { title: "דוחות", url: "/reports", icon: FileSpreadsheet },
  { title: "לוח שנה", url: "/calendar", icon: Calendar },
  { title: "Gmail", url: "/gmail", icon: Mail },
  { title: "אנשי קשר", url: "/contacts", icon: Users },
  { title: "קבצים", url: "/files", icon: HardDrive },
  { title: "תכנון & GIS", url: "/planning-gis", icon: MapPinned },
  { title: "כלים חכמים", url: "/smart-tools", icon: Bot },
  { title: "פורטל לקוחות", url: "/portal-management", icon: Users },
];

const systemNavItems = [
  { title: "גיבויים וייבוא", url: "/backups", icon: Database },
  { title: "היסטוריה", url: "/history", icon: History },
  { title: "הגדרות", url: "/settings", icon: Settings, adminOnly: true },
  { title: "בדיקות", url: "/tests", icon: TestTube, adminOnly: true },
];

interface OverlaySidebarProps {
  isPinned: boolean;
  onPinChange: (pinned: boolean) => void;
  width: number;
  onWidthChange: (width: number) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export function OverlaySidebar({
  isPinned,
  onPinChange,
  width,
  onWidthChange,
  onVisibilityChange,
}: OverlaySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { isAdmin } = useAuth();
  const { isHidden, orderItems } = useSidebarItemsConfig();

  // Sidebar theme
  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(() => {
    const saved = localStorage.getItem("sidebar-theme");
    return saved ? JSON.parse(saved) : defaultSidebarTheme;
  });
  const themeLoadedFromCloud = useRef(false);

  // Load theme from Supabase on mount (cloud persistence)
  useEffect(() => {
    if (!isTableAvailable("user_preferences")) return;
    const loadCloudTheme = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) {
          markTableUnavailable("user_preferences");
          return;
        }
        const theme = (data as any)?.sidebar_theme;
        if (theme) {
          setSidebarTheme(theme as SidebarTheme);
          localStorage.setItem("sidebar-theme", JSON.stringify(theme));
          themeLoadedFromCloud.current = true;
        }
      } catch (err) {
        markTableUnavailable("user_preferences");
        // Silently fall back to localStorage
      }
    };
    loadCloudTheme();
  }, []);

  // Save theme to localStorage + Supabase
  useEffect(() => {
    localStorage.setItem("sidebar-theme", JSON.stringify(sidebarTheme));
    // Don't save on initial cloud load
    if (themeLoadedFromCloud.current) {
      themeLoadedFromCloud.current = false;
      return;
    }
    // Debounce cloud save to avoid rapid writes when adjusting sliders
    const timer = setTimeout(async () => {
      if (!isTableAvailable("user_preferences")) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from("user_preferences").upsert(
          {
            user_id: user.id,
            sidebar_theme: sidebarTheme as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "user_id" },
        );
        if (error) {
          markTableUnavailable("user_preferences");
        }
      } catch {
        markTableUnavailable("user_preferences");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [sidebarTheme]);

  // Detect light theme for contrast adjustments
  const isLightTheme = useMemo(() => {
    const bg = sidebarTheme.backgroundColor || "";
    const hex = bg.replace("#", "");
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = Number.parseInt(hex.substring(0, 2), 16);
      const g = Number.parseInt(hex.substring(2, 4), 16);
      const b = Number.parseInt(hex.substring(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 128;
    }
    const hslMatch = /hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/.exec(bg);
    if (hslMatch) return Number.parseInt(hslMatch[3]) > 50;
    return false;
  }, [sidebarTheme.backgroundColor]);

  // Dynamic colors from theme
  const themeBg = sidebarTheme.backgroundColor || "#1e293b";
  const themeText = sidebarTheme.textColor || "#FFFFFF";
  const themeAccent = sidebarTheme.activeItemColor || "#ffd700";
  const themeIcon = sidebarTheme.iconColor || "#ffd700";
  const themeBorder = sidebarTheme.borderColor || "#ffd700";
  const activeBgAlpha = isLightTheme ? "35" : "20";
  const hoverBg = isLightTheme ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";
  const subtleTextColor = isLightTheme ? `${themeText}99` : `${themeText}BB`;

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

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isPinned, width]);

  // CRITICAL: shouldShow determines visibility
  const shouldShow = isPinned || isOpen;

  // Handle resize dragging
  useEffect(() => {
    if (!isResizing) return;

    // Prevent text selection during resize
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

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
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing, onWidthChange]);

  // Remove this - margin is now handled in AppLayout.tsx
  // useEffect for padding is no longer needed

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handlePinToggle = () => {
    const newPinned = !isPinned;
    console.log("📌 PIN TOGGLE:", { from: isPinned, to: newPinned });
    onPinChange(newPinned);
    if (newPinned) {
      console.log("📌 Setting isOpen to TRUE because pinned");
      setIsOpen(true);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Preserve scroll position across route changes
  const navScrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);

  const handleNavScroll = useCallback(() => {
    if (navScrollRef.current) {
      savedScrollTop.current = navScrollRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    const el = navScrollRef.current;
    if (el) {
      el.scrollTop = savedScrollTop.current;
    }
  }, [location.pathname]);

  return (
    <>
      {/* ========== SIDEBAR PANEL ========== */}
      <div
        className="fixed top-0 right-0 h-full shadow-2xl"
        style={{
          width: `${width}px`,
          transform: shouldShow ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease-out",
          zIndex: 50,
          backgroundColor: themeBg,
          borderLeft: `3px solid ${themeBorder}`,
          borderRadius: `${sidebarTheme.borderRadius || 12}px 0 0 ${sidebarTheme.borderRadius || 12}px`,
          overflow: "hidden",
          fontFamily: sidebarTheme.fontFamily || "Heebo",
          fontSize: `${sidebarTheme.fontSize || 14}px`,
          color: themeText,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Resize Handle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute left-0 top-0 h-full w-2 cursor-ew-resize hover:bg-primary/30 transition-colors group flex items-center justify-center"
              style={{
                backgroundColor: isResizing
                  ? "hsl(var(--primary) / 0.5)"
                  : "transparent",
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
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{
              borderColor: `${themeBorder}40`,
              backgroundColor: themeBg,
              borderRadius: `${sidebarTheme.borderRadius || 12}px 0 0 0`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg shadow-md"
                style={{ backgroundColor: themeAccent, color: themeBg }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg">
                  <span style={{ color: themeAccent }}>ten</span>
                  <span style={{ color: themeText }}>arch</span>
                </span>
                <span className="text-xs" style={{ color: themeAccent }}>
                  CRM Pro Max
                </span>
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
                    isPinned
                      ? "hover:bg-yellow-500/30"
                      : "text-gray-400 hover:text-white hover:bg-blue-800",
                  )}
                  style={
                    isPinned
                      ? {
                          color: themeAccent,
                          backgroundColor: `${themeAccent}33`,
                        }
                      : { color: subtleTextColor }
                  }
                >
                  {isPinned ? (
                    <Pin className="h-5 w-5" />
                  ) : (
                    <PinOff className="h-5 w-5" />
                  )}
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
          <div
            ref={navScrollRef}
            className="flex-1 p-3 sidebar-nav-scroll"
            style={{ overflowY: "auto", scrollbarWidth: "none" }}
            onScroll={handleNavScroll}
          >
            <style>{`
              .sidebar-nav-scroll::-webkit-scrollbar { display: none; }
            `}</style>
            {/* Main Nav */}
            <div className="space-y-1 mb-4">
              <p
                className="text-xs font-semibold px-3 py-2 uppercase tracking-wider"
                style={{ color: themeAccent }}
              >
                ניווט ראשי
              </p>
              {orderItems(
                mainNavItems.filter((item) => !item.adminOnly || isAdmin),
                "main",
              )
                .filter((item) => !isHidden(item.url))
                .map((item) => (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-right",
                      isActive(item.url)
                        ? "font-medium shadow-lg"
                        : "hover:text-current",
                    )}
                    style={{
                      color: isActive(item.url) ? themeBg : themeText,
                      backgroundColor: isActive(item.url)
                        ? themeAccent
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.url)) {
                        e.currentTarget.style.backgroundColor = hoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.url)) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <item.icon
                      className="h-5 w-5 shrink-0"
                      style={{
                        color: isActive(item.url) ? themeBg : themeIcon,
                      }}
                    />
                    <span className="flex-1 text-right">{item.title}</span>
                  </Link>
                ))}
            </div>

            {/* System Nav */}
            <div className="space-y-1">
              {orderItems(
                systemNavItems.filter((item) => !item.adminOnly || isAdmin),
                "system",
              )
                .filter((item) => !isHidden(item.url))
                .map((item) => (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-right",
                      isActive(item.url)
                        ? "font-medium shadow-lg"
                        : "hover:text-current",
                    )}
                    style={{
                      color: isActive(item.url) ? themeBg : themeText,
                      backgroundColor: isActive(item.url)
                        ? themeAccent
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.url)) {
                        e.currentTarget.style.backgroundColor = hoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.url)) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <item.icon
                      className="h-5 w-5 shrink-0"
                      style={{
                        color: isActive(item.url) ? themeBg : themeIcon,
                      }}
                    />
                    <span className="flex-1 text-right">{item.title}</span>
                  </Link>
                ))}
            </div>
          </div>

          {/* Footer with Theme Button - visible on hover */}
          <div
            className="p-3 border-t transition-all duration-300"
            style={{
              borderColor: `${themeBorder}40`,
              opacity: isHovering ? 1 : 0,
              maxHeight: isHovering ? "80px" : "0px",
              padding: isHovering ? "12px" : "0px 12px",
              overflow: "hidden",
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsItemsDialogOpen(true)}
                    className="flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                    style={{
                      border: `1.5px solid ${themeAccent}`,
                      background: `${themeAccent}15`,
                      color: themeAccent,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${themeAccent}35`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${themeAccent}15`;
                    }}
                    aria-label="התאמת תפריט"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">התאמת תפריט</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsThemeDialogOpen(true)}
                    className="flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                    style={{
                      border: `1.5px solid ${themeAccent}`,
                      background: `${themeAccent}15`,
                      color: themeAccent,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${themeAccent}35`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${themeAccent}15`;
                    }}
                    aria-label="ערכות נושא"
                  >
                    <Palette className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">ערכות נושא</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings Dialog */}
      <SidebarSettingsDialog
        open={isThemeDialogOpen}
        onOpenChange={setIsThemeDialogOpen}
        theme={sidebarTheme}
        onThemeChange={(newTheme) => {
          setSidebarTheme(newTheme);
        }}
      />

      {/* Sidebar Items Customizer Dialog */}
      <SidebarItemsCustomizerDialog
        open={isItemsDialogOpen}
        onOpenChange={setIsItemsDialogOpen}
        mainItems={mainNavItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((i) => ({ url: i.url, title: i.title, group: "main" }))}
        systemItems={systemNavItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((i) => ({ url: i.url, title: i.title, group: "system" }))}
      />
    </>
  );
}

export default OverlaySidebar;
