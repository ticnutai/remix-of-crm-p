// Themed Widget Wrapper - Applies dashboard theme styles
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDashboardTheme } from './DashboardThemeProvider';
import { useWidgetManager, WidgetId } from './WidgetManager';
import { ChevronDown, ChevronUp, GripVertical, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mapping widget IDs to navigation paths
const WIDGET_NAVIGATION_MAP: Record<string, string> = {
  'stats-clients': '/clients',
  'stats-projects': '/projects',
  'stats-revenue': '/finance',
  'stats-hours': '/time-tracking',
  'chart-revenue': '/finance',
  'chart-projects': '/projects',
  'chart-hours': '/time-tracking',
  'table-hours': '/time-tracking',
  'table-clients': '/clients',
  'table-vip': '/clients',
  'features-info': '/settings',
};

interface ThemedWidgetProps {
  widgetId: WidgetId;
  children: ReactNode;
  className?: string;
  title?: string;
  titleIcon?: ReactNode;
  headerActions?: ReactNode;
  noPadding?: boolean;
  linkTo?: string; // Custom navigation path
}

export function ThemedWidget({ 
  widgetId, 
  children, 
  className,
  title,
  titleIcon,
  headerActions,
  noPadding = false,
  linkTo,
}: ThemedWidgetProps) {
  const navigate = useNavigate();
  const { themeConfig, currentTheme } = useDashboardTheme();
  const { getWidget, toggleCollapse, isWidgetVisible } = useWidgetManager();
  
  const widget = getWidget(widgetId);
  
  if (!widget || !widget.visible) {
    return null;
  }

  const isNavyGold = currentTheme === 'navy-gold';
  const isModernDark = currentTheme === 'modern-dark';
  
  // Get navigation path
  const navigationPath = linkTo || WIDGET_NAVIGATION_MAP[widgetId];
  
  const handleTitleClick = () => {
    if (navigationPath) {
      navigate(navigationPath);
    }
  };

  // Widget container styles based on theme
  const containerStyles: React.CSSProperties = {
    backgroundColor: widget.customStyles?.backgroundColor || themeConfig.colors.cardBackground,
    borderColor: widget.customStyles?.borderColor || themeConfig.colors.border,
    borderWidth: isNavyGold ? '2px' : '1px',
    borderStyle: 'solid',
    borderRadius: themeConfig.effects.roundedCorners === 'sm' ? '0.375rem' :
                  themeConfig.effects.roundedCorners === 'md' ? '0.5rem' :
                  themeConfig.effects.roundedCorners === 'lg' ? '0.75rem' :
                  themeConfig.effects.roundedCorners === 'xl' ? '1rem' :
                  themeConfig.effects.roundedCorners === '2xl' ? '1.5rem' : '1.75rem',
  };

  // Glow effect for navy-gold theme
  const glowStyles = themeConfig.effects.glow ? {
    boxShadow: isNavyGold 
      ? '0 0 25px rgba(180, 140, 50, 0.15), 0 10px 40px -15px rgba(0,0,0,0.2)'
      : isModernDark
      ? '0 0 30px rgba(66, 153, 225, 0.15), 0 10px 40px -15px rgba(0,0,0,0.4)'
      : undefined,
  } : {};

  return (
    <div 
      className={cn(
        "relative overflow-hidden transition-all duration-300 group",
        "hover:scale-[1.005]",
        className
      )}
      style={{ ...containerStyles, ...glowStyles }}
    >
      {/* Decorative Corner Ornaments for Navy Gold */}
      {isNavyGold && (
        <>
          <div 
            className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 opacity-50 pointer-events-none"
            style={{ borderColor: themeConfig.colors.border, borderRadius: '0 8px 0 0' }}
          />
          <div 
            className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 opacity-50 pointer-events-none"
            style={{ borderColor: themeConfig.colors.border, borderRadius: '8px 0 0 0' }}
          />
          <div 
            className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 opacity-50 pointer-events-none"
            style={{ borderColor: themeConfig.colors.border, borderRadius: '0 0 8px 0' }}
          />
          <div 
            className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 opacity-50 pointer-events-none"
            style={{ borderColor: themeConfig.colors.border, borderRadius: '0 0 0 8px' }}
          />
        </>
      )}

      {/* Optional Header */}
      {title && (
        <div 
          className={cn(
            "flex items-center justify-between px-5 py-4 border-b",
            isNavyGold && "bg-gradient-to-l from-[hsl(220,60%,18%)] to-[hsl(220,60%,22%)]"
          )}
          style={{ 
            borderColor: isNavyGold ? `${themeConfig.colors.border}66` : themeConfig.colors.border,
            backgroundColor: isNavyGold ? undefined : isModernDark ? themeConfig.colors.headerBackground : undefined,
          }}
        >
          <div 
            className={cn(
              "flex items-center gap-3",
              navigationPath && "cursor-pointer group/title hover:opacity-80 transition-opacity"
            )}
            onClick={handleTitleClick}
          >
            {titleIcon && (
              <span style={{ color: themeConfig.colors.accent }}>
                {titleIcon}
              </span>
            )}
            <h3 
              className={cn(
                "font-bold text-base",
                navigationPath && "group-hover/title:underline"
              )}
              style={{ 
                color: isNavyGold || isModernDark ? 'white' : themeConfig.colors.text 
              }}
            >
              {title}
            </h3>
            {navigationPath && (
              <ExternalLink 
                className="h-3.5 w-3.5 opacity-0 group-hover/title:opacity-70 transition-opacity" 
                style={{ color: themeConfig.colors.accent }}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                (isNavyGold || isModernDark) && "text-white/70 hover:text-white hover:bg-white/10"
              )}
              onClick={() => toggleCollapse(widgetId)}
            >
              {widget.collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {!widget.collapsed && (
        <div className={cn(!noPadding && "p-5")}>
          {children}
        </div>
      )}

      {/* Reflection Effect for Navy Gold */}
      {themeConfig.effects.reflection && !widget.collapsed && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.03))',
          }}
        />
      )}
    </div>
  );
}

// Simple themed stat card
interface ThemedStatCardProps {
  widgetId: WidgetId;
  title: string;
  value: string;
  icon: ReactNode;
  trend?: { value: number; isPositive: boolean };
  description?: string;
  delay?: number;
  onClick?: () => void;
}

export function ThemedStatCard({
  widgetId,
  title,
  value,
  icon,
  trend,
  description,
  delay = 0,
  onClick,
}: ThemedStatCardProps) {
  const { themeConfig, currentTheme } = useDashboardTheme();
  const { isWidgetVisible } = useWidgetManager();

  const visible = isWidgetVisible(widgetId);
  console.log('[ThemedStatCard]', widgetId, 'visible:', visible);

  if (!visible) {
    return null;
  }

  const isNavyGold = currentTheme === 'navy-gold';
  const isModernDark = currentTheme === 'modern-dark';

  return (
    <div
      className={cn(
        "relative p-5 overflow-hidden transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg",
        "animate-fade-in",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      style={{
        backgroundColor: themeConfig.colors.statCardBg,
        borderWidth: isNavyGold ? '2px' : '1px',
        borderStyle: 'solid',
        borderColor: themeConfig.colors.border,
        borderRadius: themeConfig.effects.roundedCorners === '2xl' ? '1.5rem' : '1rem',
        animationDelay: `${delay}s`,
        boxShadow: themeConfig.effects.glow
          ? isNavyGold 
            ? '0 0 20px rgba(180, 140, 50, 0.1)'
            : isModernDark
            ? '0 0 20px rgba(66, 153, 225, 0.1)'
            : undefined
          : undefined,
      }}
    >
      {/* Icon Badge */}
      <div 
        className={cn(
          "absolute top-4 left-4 h-12 w-12 rounded-xl flex items-center justify-center",
          isNavyGold && "bg-gradient-to-br from-[hsl(45,80%,55%)] to-[hsl(45,90%,45%)]",
          isModernDark && "bg-gradient-to-br from-[hsl(210,100%,50%)] to-[hsl(210,100%,40%)]",
        )}
        style={{
          backgroundColor: !isNavyGold && !isModernDark ? themeConfig.colors.accent : undefined,
        }}
      >
        <span style={{ color: isNavyGold ? 'hsl(220, 60%, 18%)' : isModernDark ? 'white' : 'white' }}>
          {icon}
        </span>
      </div>

      {/* Content */}
      <div className="text-right pt-2">
        <p 
          className="text-sm font-medium mb-1"
          style={{ color: themeConfig.colors.textMuted }}
        >
          {title}
        </p>
        <p 
          className="text-3xl font-bold mb-2"
          style={{ color: themeConfig.colors.text }}
        >
          {value}
        </p>
        {trend && (
          <div className="flex items-center justify-end gap-1 text-sm">
            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span style={{ color: themeConfig.colors.textMuted }}>
              {description}
            </span>
          </div>
        )}
      </div>

      {/* Decorative Corner for Navy Gold */}
      {isNavyGold && (
        <>
          <div 
            className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 opacity-40"
            style={{ borderColor: themeConfig.colors.border, borderRadius: '0 6px 0 0' }}
          />
          <div 
            className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 opacity-40"
            style={{ borderColor: themeConfig.colors.border, borderRadius: '0 0 0 6px' }}
          />
        </>
      )}
    </div>
  );
}
