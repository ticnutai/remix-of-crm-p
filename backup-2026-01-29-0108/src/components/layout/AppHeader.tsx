// App Header - TEN Arch CRM Pro
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Undo2,
  Redo2,
  Bell,
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  History,
  Check,
  FileText,
  Calendar,
  MessageSquare,
  Clock,
  Menu,
  Sparkles,
  ZapOff,
  Search,
} from 'lucide-react';
import { TextCustomizerButton } from '@/components/shared/TextCustomizerButton';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { GlobalSearch, SearchButton } from '@/components/search/GlobalSearch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface AppHeaderProps {
  title?: string;
  onMobileMenuToggle?: () => void;
  isMobile?: boolean;
}

export function AppHeader({ title = 'e-control CRM Pro', onMobileMenuToggle, isMobile }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canUndo, canRedo, undo, redo, pastActions } = useUndoRedo();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Animation toggle state
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = localStorage.getItem('animations-enabled');
    return saved !== 'false'; // Default to true
  });

  // Apply animation toggle to body
  useEffect(() => {
    if (animationsEnabled) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }
    localStorage.setItem('animations-enabled', String(animationsEnabled));
  }, [animationsEnabled]);

  const toggleAnimations = () => {
    setAnimationsEnabled(prev => !prev);
  };

  // מזהה ייחודי לכל עמוד
  const pageId = location.pathname.replace(/\//g, '-') || 'home';

  // Fetch reminders as notifications
  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      // Get upcoming reminders
      const { data: reminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .lte('remind_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('remind_at', { ascending: true })
        .limit(10);

      // Get recent meetings
      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('created_by', user.id)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      const notifs: Notification[] = [];

      reminders?.forEach(r => {
        notifs.push({
          id: r.id,
          type: 'reminder',
          title: r.title,
          message: r.message || 'תזכורת',
          created_at: r.remind_at,
          is_read: r.is_sent || false,
        });
      });

      meetings?.forEach(m => {
        notifs.push({
          id: m.id,
          type: 'meeting',
          title: m.title,
          message: `פגישה ב-${format(new Date(m.start_time), 'HH:mm', { locale: he })}`,
          created_at: m.start_time,
          is_read: false,
        });
      });

      setNotifications(notifs.slice(0, 10));
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    };

    fetchNotifications();
    
    // Refresh every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const markAsRead = async (id: string, type: string) => {
    if (type === 'reminder') {
      await supabase.from('reminders').update({ is_sent: true }).eq('id', id);
    }
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
      <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between px-2 sm:px-3 md:px-6 gap-2">
        {/* Left Section - Title (visible on left in LTR layout) */}
        <div className="flex items-center min-w-0 flex-shrink">
          <h1 className="text-xs sm:text-sm md:text-lg font-semibold text-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">{title}</h1>
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
                  !canUndo && "opacity-40 cursor-not-allowed"
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
                  !canRedo && "opacity-40 cursor-not-allowed"
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
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {pastActions.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 bg-popover">
                <DropdownMenuLabel>היסטוריית פעולות</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pastActions.slice(-5).reverse().map((action, index) => (
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
                  !animationsEnabled && "text-muted-foreground"
                )}
                aria-label={animationsEnabled ? 'כבה אנימציות' : 'הפעל אנימציות'}
              >
                {animationsEnabled ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <ZapOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{animationsEnabled ? 'כבה אנימציות' : 'הפעל אנימציות'}</p>
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
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>החלף ערכת נושא ({resolvedTheme === 'dark' ? 'בהיר' : 'כהה'})</p>
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 relative" aria-label="התראות">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-w-[380px] bg-popover">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>התראות</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} חדשות</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  אין התראות חדשות
                </div>
              ) : (
                notifications.map(notif => (
                  <DropdownMenuItem 
                    key={notif.id} 
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer",
                      !notif.is_read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notif.id, notif.type)}
                  >
                    {getNotificationIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notif.created_at), 'dd/MM HH:mm', { locale: he })}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center" onClick={() => navigate('/reminders')}>
                צפה בכל ההתראות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center text-secondary-foreground text-sm font-medium">
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'M'}
                </div>
                <span className="hidden md:inline text-sm">
                  {profile?.full_name || user?.email?.split('@')[0] || 'משתמש'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/employees')}>
                <User className="h-4 w-4 ml-2" />
                פרופיל
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 ml-2" />
                הגדרות
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/history')}>
                <History className="h-4 w-4 ml-2" />
                היסטוריה
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
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
