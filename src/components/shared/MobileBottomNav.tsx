// Mobile Bottom Navigation Bar
import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number;
}

interface MobileBottomNavProps {
  items: NavItem[];
  className?: string;
}

// Memoized navigation button to prevent re-renders
const NavButton = React.memo(({ 
  item, 
  active, 
  onNavigate 
}: { 
  item: NavItem; 
  active: boolean; 
  onNavigate: (path: string) => void;
}) => {
  const Icon = item.icon;

  return (
    <button
      onClick={() => onNavigate(item.path)}
      className={cn(
        'flex flex-col items-center justify-center flex-1 gap-1',
        'min-w-0 px-2 py-1 rounded-lg transition-all duration-200',
        'active:scale-95',
        active
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <div className="relative">
        <Icon
          className={cn(
            'h-6 w-6 transition-transform',
            active && 'scale-110'
          )}
        />
        {item.badge && item.badge > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]"
          >
            {item.badge > 9 ? '9+' : item.badge}
          </Badge>
        )}
      </div>
      <span
        className={cn(
          'text-[10px] font-medium truncate max-w-full transition-all',
          active && 'scale-105 font-semibold'
        )}
      >
        {item.label}
      </span>
    </button>
  );
});

NavButton.displayName = 'NavButton';

export function MobileBottomNav({ items, className }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const handleNavigate = useCallback((path: string) => {
    // Use requestAnimationFrame for immediate navigation
    requestAnimationFrame(() => {
      navigate(path);
    });
  }, [navigate]);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur-sm border-t border-border',
        'md:hidden', // Hide on desktop
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2 safe-area-padding-bottom">
        {items.map((item, index) => (
          <NavButton
            key={item.path}
            item={item}
            active={isActive(item.path)}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

// Bottom Nav Spacer - Add this to pages to prevent content from being hidden
export function BottomNavSpacer() {
  return <div className="h-16 md:h-0" />;
}
