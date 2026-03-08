import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Clock, Users, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DisplayOptions, ViewType } from '@/components/ui/display-options';

// Helper to get CSS variable value and convert to HSL color
const getCssVar = (varName: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!value) return fallback;
  return `hsl(${value})`;
};

interface WorkHoursData {
  name: string;
  hours: number;
}

interface WorkHoursChartProps {
  byEmployee: WorkHoursData[];
  byProject: WorkHoursData[];
  isLoading?: boolean;
}

type DataViewMode = 'employee' | 'project';

const COLORS = [
  'hsl(222, 47%, 25%)',
  'hsl(45, 70%, 50%)',
  'hsl(142, 70%, 45%)',
  'hsl(199, 89%, 48%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
];

export function WorkHoursChart({ byEmployee, byProject, isLoading }: WorkHoursChartProps) {
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>('employee');
  const [chartType, setChartType] = useState<ViewType>('bar');
  
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
    
    // Listen for theme changes via MutationObserver on class/style changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const data = dataViewMode === 'employee' ? byEmployee : byProject;

  if (isLoading) {
    return (
      <Card className="card-elegant">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            שעות עבודה
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label || payload[0].payload?.name}</p>
          <p className="text-primary font-semibold">
            {payload[0].value.toFixed(1)} שעות
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      const pieData = data.map((item, index) => ({
        ...item,
        color: COLORS[index % COLORS.length]
      }));

      return (
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            innerRadius={40}
            dataKey="hours"
            nameKey="name"
            animationDuration={1000}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
          />
        </PieChart>
      );
    }

    // Default: Bar chart
    return (
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} horizontal={true} vertical={false} />
        <XAxis 
          type="number"
          tick={{ fill: chartColors.tickColor, fontSize: 12 }}
          axisLine={{ stroke: chartColors.gridColor }}
          tickFormatter={(value) => `${value}h`}
        />
        <YAxis 
          type="category"
          dataKey="name"
          tick={{ fill: chartColors.tickColor, fontSize: 12 }}
          axisLine={{ stroke: chartColors.gridColor }}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="hours" 
          radius={[0, 4, 4, 0]}
          animationDuration={800}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    );
  };

  return (
    <Card className="card-elegant">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            שעות עבודה
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Data View Toggle */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setDataViewMode('employee')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  dataViewMode === 'employee' 
                    ? "bg-card shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="h-4 w-4" />
                <span>לפי עובד</span>
              </button>
              <button
                onClick={() => setDataViewMode('project')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  dataViewMode === 'project' 
                    ? "bg-card shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                <span>לפי פרויקט</span>
              </button>
            </div>
            
            {/* Chart Type Options */}
            <DisplayOptions
              viewType={chartType}
              onViewTypeChange={setChartType}
              availableViewTypes={['bar', 'pie']}
            />
          </div>
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
}
