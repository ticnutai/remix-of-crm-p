// App Header - TEN Arch CRM Pro
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import {
  Undo2,
  Redo2,
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  History,
  Menu,
  Sparkles,
  ZapOff,
  Search,
} from "lucide-react";
import { TextCustomizerButton } from "@/components/shared/TextCustomizerButton";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SyncStatusIndicator } from "@/components/pwa/SyncStatusIndicator";
import { GlobalSearch, SearchButton } from "@/components/search/GlobalSearch";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  onMobileMenuToggle?: () => void;
  isMobile?: boolean;
}

export function AppHeader({
  title = "tenarch CRM Pro",
  onMobileMenuToggle,
  isMobile,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canUndo, canRedo, undo, redo, pastActions } = useUndoRedo();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, signOut } = useAuth();

  const [searchOpen, setSearchOpen] = useState(false);

  // Animation toggle state
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = localStorage.getItem("animations-enabled");
    return saved !== "false"; // Default to true
  });

  // Apply animation toggle to body
  useEffect(() => {
    if (animationsEnabled) {
      document.body.classList.remove("no-animations");
    } else {
      document.body.classList.add("no-animations");
    }
    localStorage.setItem("animations-enabled", String(animationsEnabled));
  }, [animationsEnabled]);

  const toggleAnimations = () => {
    setAnimationsEnabled((prev) => !prev);
  };

  // מזהה ייחודי לכל עמוד
  const pageId = location.pathname.replace(/\//g, "-") || "home";

  const toggleTheme = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
      <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between px-2 sm:px-3 md:px-6 gap-2">
        {/* Left Section - Title (visible on left in LTR layout) */}
        <div className="flex items-center min-w-0 flex-shrink">
          <h1 className="text-xs sm:text-sm md:text-lg font-semibold text-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
            {title}
          </h1>
        </div>

        {/* Center Section - Undo/Redo */}
        <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className={cn(
                  "h-7 sm:h-8 w-7 sm:w-8 p-0",
                  !canUndo && "opacity-40 cursor-not-allowed",
                )}
              >
                <Undo2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>בטל (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className={cn(
                  "h-7 sm:h-8 w-7 sm:w-8 p-0",
                  !canRedo && "opacity-40 cursor-not-allowed",
                )}
              >
                <Redo2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>בצע שוב (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>

          {pastActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                  <History className="h-4 w-4" />
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1.5 text-xs"
                  >
                    {pastActions.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 bg-popover">
                <DropdownMenuLabel>היסטוריית פעולות</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pastActions
                  .slice(-5)
                  .reverse()
                  .map((action, index) => (
                    <DropdownMenuItem key={action.id} className="text-sm">
                      <span className="text-muted-foreground ml-2">
                        {pastActions.length - index}.
                      </span>
                      {action.description}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right Section - Mobile Menu + Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Mobile Menu Button - always on right */}
          {isMobile && onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              aria-label="תפריט"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Global Search Button */}
          <SearchButton onClick={() => setSearchOpen(true)} />

          {/* Sync Status Indicator */}
          <SyncStatusIndicator />

          {/* Notification Center */}
          <NotificationCenter />

          {/* Text Customizer Button */}
          <TextCustomizerButton
            pageId={pageId}
            className="relative h-8 w-8 sm:h-9 sm:w-9 p-0 shadow-none border-0"
          />

          {/* Animation Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAnimations}
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 p-0",
                  !animationsEnabled && "text-muted-foreground",
                )}
                aria-label={
                  animationsEnabled ? "כבה אנימציות" : "הפעל אנימציות"
                }
              >
                {animationsEnabled ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <ZapOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{animationsEnabled ? "כבה אנימציות" : "הפעל אנימציות"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                aria-label="שנה ערכת נושא"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                החלף ערכת נושא ({resolvedTheme === "dark" ? "בהיר" : "כהה"})
              </p>
            </TooltipContent>
          </Tooltip>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center text-secondary-foreground text-sm font-medium">
                  {profile?.full_name?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "M"}
                </div>
                <span className="hidden md:inline text-sm">
                  {profile?.full_name || user?.email?.split("@")[0] || "משתמש"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/employees")}>
                <User className="h-4 w-4 ml-2" />
                פרופיל
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4 ml-2" />
                הגדרות
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/history")}>
                <History className="h-4 w-4 ml-2" />
                היסטוריה
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 ml-2" />
                יציאה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
