// Client Portal - Bottom Navigation Component
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderKanban, MessageSquare, FileImage, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/client-portal', icon: <Home className="h-5 w-5" />, label: 'בית' },
  { path: '/client-portal/projects', icon: <FolderKanban className="h-5 w-5" />, label: 'תיקים' },
  { path: '/client-portal/messages', icon: <MessageSquare className="h-5 w-5" />, label: 'הודעות' },
  { path: '/client-portal/files', icon: <FileImage className="h-5 w-5" />, label: 'קבצים' },
];

interface PortalNavigationProps {
  unreadMessages?: number;
}

export default function PortalNavigation({ unreadMessages = 0 }: PortalNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/client-portal') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg safe-area-bottom" dir="rtl">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200",
                "hover:bg-muted/50 active:scale-95",
                active && "text-primary"
              )}
            >
              <div className="relative">
                {item.icon}
                {/* Unread badge for messages */}
                {item.path === '/client-portal/messages' && unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              {/* Active indicator */}
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
