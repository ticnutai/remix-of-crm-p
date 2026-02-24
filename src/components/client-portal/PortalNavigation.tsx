// Client Portal - Bottom Navigation Component
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderKanban, MessageSquare, FileImage, CalendarDays, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badgeKey?: string;
}

const navItems: NavItem[] = [
  { path: '/client-portal', icon: <Home className="h-5 w-5" />, label: 'בית' },
  { path: '/client-portal/projects', icon: <FolderKanban className="h-5 w-5" />, label: 'תיקים' },
  { path: '/client-portal/messages', icon: <MessageSquare className="h-5 w-5" />, label: 'הודעות', badgeKey: 'messages' },
  { path: '/client-portal/meetings', icon: <CalendarDays className="h-5 w-5" />, label: 'פגישות' },
  { path: '/client-portal/files', icon: <FileImage className="h-5 w-5" />, label: 'קבצים' },
  { path: '/client-portal/notifications', icon: <Bell className="h-5 w-5" />, label: 'התראות', badgeKey: 'notifications' },
];

interface PortalNavigationProps {
  unreadMessages?: number;
  unreadNotifications?: number;
}

export default function PortalNavigation({ unreadMessages = 0, unreadNotifications = 0 }: PortalNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/client-portal') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getBadgeCount = (item: NavItem) => {
    if (item.badgeKey === 'messages') return unreadMessages;
    if (item.badgeKey === 'notifications') return unreadNotifications;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg safe-area-bottom" dir="rtl">
      <div className={`grid grid-cols-${navItems.length} h-16`} style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          const badgeCount = getBadgeCount(item);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                "hover:bg-muted/50 active:scale-95",
                active && "text-primary"
              )}
            >
              <div className="relative">
                {item.icon}
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-0.5">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
