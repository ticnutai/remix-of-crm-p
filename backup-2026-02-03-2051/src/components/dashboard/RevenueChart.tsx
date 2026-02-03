import React, { useState, useMemo, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { DisplayOptions, ViewType, TimeRange, ColorScheme, COLOR_SCHEMES } from '@/components/ui/display-options';

// Helper to get CSS variable value and convert to HSL color
const getCssVar = (varName: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!value) return fallback;
  return `hsl(${value})`;
};

interface RevenueData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  isLoading?: boolean;
}

export const RevenueChart = memo(function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const [viewType, setViewType] = useState<ViewType>('chart');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('sunset');

  // Dynamic colors based on theme
  const [chartColors, setChartColors] = useState({
    tickColor: 'hsl(222, 20%, 45%)',
    gridColor: 'hsl(222, 30%, 85%)'
  });
  
  // Update colors when theme changes
  useEffect(() => {
    const updateColors = () => {
      setChartColors({
        tickColor: getCssVar('--muted-foreground', '222 20% 45%'),
        gridColor: getCssVar('--border', '222 30% 85%')
      });
    };
    
    updateColors();
    
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Get primary color from scheme
  const primaryColor = useMemo(() => {
    return COLOR_SCHEMES[colorScheme].colors[0];
  }, [colorScheme]);

  if (isLoading) {
    return (
      <Card className="frame-gold">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            הכנסות חודשיות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">טוען נתונים...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return `₪${(value / 1000).toFixed(0)}K`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-secondary font-semibold">
            ₪{payload[0].value.toLocaleString('he-IL')}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 }
    };

    if (viewType === 'bar' || viewType === 'stacked-bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenue"
            fill={primaryColor}
            radius={[4, 4, 0, 0]}
            animationDuration={1000}
          />
        </BarChart>
      );
    }

    if (viewType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={primaryColor}
            strokeWidth={2}
            dot={{ fill: primaryColor, strokeWidth: 2 }}
            animationDuration={1000}
          />
        </LineChart>
      );
    }

    // Default: Area chart
    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
        <XAxis 
          dataKey="month" 
          tick={{ fill: chartColors.tickColor, fontSize: 12 }}
          axisLine={{ stroke: chartColors.gridColor }}
        />
        <YAxis 
          tickFormatter={formatCurrency}
          tick={{ fill: chartColors.tickColor, fontSize: 12 }}
          axisLine={{ stroke: chartColors.gridColor }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={primaryColor}
          strokeWidth={2}
          fill="url(#revenueGradient)"
          animationDuration={1000}
        />
      </AreaChart>
    );
  };

  return (
    <Card className="frame-gold">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            הכנסות חודשיות
          </CardTitle>
          <DisplayOptions
            viewType={viewType}
            onViewTypeChange={setViewType}
            availableViewTypes={['chart', 'bar', 'line', 'area']}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            availableTimeRanges={['day', 'week', 'month', 'quarter', 'year']}
            colorScheme={colorScheme}
            onColorSchemeChange={setColorScheme}
            showColorOptions={true}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
