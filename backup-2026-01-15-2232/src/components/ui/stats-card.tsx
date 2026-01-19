// Stats Card Component - e-control CRM Pro
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  delay?: number;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  description,
  className,
  delay = 0
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        "animate-fade-in overflow-hidden group hover:shadow-lg transition-all duration-300",
        "border-border hover:border-secondary/50",
        className
      )}
      style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between flex-row-reverse">
          <div className="space-y-2 text-right">
            <p className="text-sm text-muted-foreground font-medium">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 flex-row-reverse justify-end">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}>
                  {trend.value}%
                </span>
                {description && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            "bg-primary/10 text-primary group-hover:bg-secondary group-hover:text-secondary-foreground"
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
