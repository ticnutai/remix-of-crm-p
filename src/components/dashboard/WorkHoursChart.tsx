import React, { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
} from "recharts";
import { Clock, Users, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { DisplayOptions, ViewType } from "@/components/ui/display-options";
import { useUserSettings } from "@/hooks/useUserSettings";

// Helper to get CSS variable value and convert to HSL color
const getCssVar = (varName: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
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

type DataViewMode = "employee" | "project";

const COLORS = [
  "hsl(222, 47%, 25%)",
  "hsl(45, 70%, 50%)",
  "hsl(142, 70%, 45%)",
  "hsl(199, 89%, 48%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
];

// Calculate dynamic Y-axis width based on longest label
const calcYAxisWidth = (data: WorkHoursData[]): number => {
  if (!data.length) return 100;
  const maxLen = Math.max(...data.map((d) => d.name.length));
  // ~9px per Hebrew char + 20px padding
  return Math.min(Math.max(maxLen * 9 + 20, 100), 200);
};

export const WorkHoursChart = memo(function WorkHoursChart({
  byEmployee,
  byProject,
  isLoading,
}: WorkHoursChartProps) {
  // Cloud-synced preferences
  const { value: prefs, setValue: setPrefs } = useUserSettings<{
    dataViewMode: DataViewMode;
    chartType: ViewType;
  }>({
    key: 'dashboard_workhours_chart_prefs',
    defaultValue: { dataViewMode: 'employee', chartType: 'bar' },
  });
  const dataViewMode = prefs.dataViewMode;
  const chartType = prefs.chartType;
  const setDataViewMode = (v: DataViewMode) => setPrefs(p => ({ ...p, dataViewMode: v }));
  const setChartType = (v: ViewType) => setPrefs(p => ({ ...p, chartType: v }));

  // Dynamic colors based on theme
  const [chartColors, setChartColors] = useState({
    tickColor: "hsl(222, 20%, 45%)",
    gridColor: "hsl(222, 30%, 85%)",
  });

  // Update colors when theme changes
  useEffect(() => {
    const updateColors = () => {
      setChartColors({
        tickColor: getCssVar("--muted-foreground", "222 20% 45%"),
        gridColor: getCssVar("--border", "222 30% 85%"),
      });
    };

    updateColors();

    // Listen for theme changes via MutationObserver on class/style changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  const data = dataViewMode === "employee" ? byEmployee : byProject;
  const yAxisWidth = useMemo(() => calcYAxisWidth(data), [data]);

  if (isLoading) {
    return (
      <Card className="card-elegant" dir="rtl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            שעות עבודה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              טוען נתונים...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 z-50">
          <p className="font-medium text-foreground">
            {label || payload[0].payload?.name}
          </p>
          <p className="text-primary font-semibold">
            {payload[0].value.toFixed(1)} שעות
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = (innerRadius: number) => {
    const pieData = data.map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length],
    }));

    return (
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          innerRadius={innerRadius}
          dataKey="hours"
          nameKey="name"
          animationDuration={1000}
          label={({ name, percent }) =>
            `${name} (${(percent * 100).toFixed(0)}%)`
          }
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
          formatter={(value) => (
            <span className="text-foreground text-sm">{value}</span>
          )}
        />
      </PieChart>
    );
  };

  const renderChart = () => {
    // Pie chart
    if (chartType === "pie") {
      return renderPieChart(0);
    }

    // Donut chart (pie with inner radius)
    if (chartType === "donut") {
      return renderPieChart(55);
    }

    // Radar chart
    if (chartType === "radar") {
      return (
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke={chartColors.gridColor} />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: chartColors.tickColor, fontSize: 11 }}
          />
          <PolarRadiusAxis
            tick={{ fill: chartColors.tickColor, fontSize: 10 }}
            tickFormatter={(value) => `${value}h`}
          />
          <RechartsRadar
            name="שעות"
            dataKey="hours"
            stroke={COLORS[0]}
            fill={COLORS[0]}
            fillOpacity={0.35}
            animationDuration={800}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      );
    }

    // Line chart
    if (chartType === "line") {
      return (
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
          <XAxis
            dataKey="name"
            tick={{ fill: chartColors.tickColor, fontSize: 11 }}
            axisLine={{ stroke: chartColors.gridColor }}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
            tickFormatter={(value) => `${value}h`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="hours"
            stroke={COLORS[0]}
            strokeWidth={3}
            dot={{ fill: COLORS[0], r: 6, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 8 }}
            animationDuration={800}
          />
        </LineChart>
      );
    }

    // Area chart
    if (chartType === "area") {
      return (
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 40 }}
        >
          <defs>
            <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.4} />
              <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
          <XAxis
            dataKey="name"
            tick={{ fill: chartColors.tickColor, fontSize: 11 }}
            axisLine={{ stroke: chartColors.gridColor }}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
            tickFormatter={(value) => `${value}h`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="hours"
            stroke={COLORS[0]}
            strokeWidth={2}
            fill="url(#hoursGradient)"
            animationDuration={800}
          />
        </AreaChart>
      );
    }

    // Stacked bar chart (vertical bars grouped by color)
    if (chartType === "stacked-bar") {
      return (
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
          <XAxis
            dataKey="name"
            tick={{ fill: chartColors.tickColor, fontSize: 11 }}
            axisLine={{ stroke: chartColors.gridColor }}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
            tickFormatter={(value) => `${value}h`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]} animationDuration={800}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      );
    }

    // Table view
    if (chartType === "table") {
      const totalHours = data.reduce((sum, d) => sum + d.hours, 0);
      return (
        <div className="w-full h-full overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                  #
                </th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                  שם
                </th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                  שעות
                </th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">
                  אחוז
                </th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground min-w-[120px]">
                  התקדמות
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const pct =
                  totalHours > 0 ? (item.hours / totalHours) * 100 : 0;
                return (
                  <tr
                    key={index}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-2 px-3 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-2 px-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        {item.name}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-semibold text-foreground">
                      {item.hours.toFixed(1)}h
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {pct.toFixed(0)}%
                    </td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-2 px-3" />
                <td className="py-2 px-3 text-foreground">סה״כ</td>
                <td className="py-2 px-3 text-primary">
                  {totalHours.toFixed(1)}h
                </td>
                <td className="py-2 px-3 text-muted-foreground">100%</td>
                <td className="py-2 px-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      ) as any; // Table doesn't use ResponsiveContainer
    }

    // Default: Horizontal Bar chart - RTL layout (with fixed text clipping)
    return (
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: yAxisWidth + 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={chartColors.gridColor}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          type="number"
          tick={{ fill: chartColors.tickColor, fontSize: 12 }}
          axisLine={{ stroke: chartColors.gridColor }}
          tickFormatter={(value) => `${value}h`}
          reversed
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: chartColors.tickColor, fontSize: 13 }}
          axisLine={false}
          tickLine={false}
          width={yAxisWidth}
          orientation="right"
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="hours"
          radius={[4, 0, 0, 4]}
          animationDuration={800}
          barSize={data.length <= 3 ? 40 : undefined}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    );
  };

  // For table view, don't wrap in ResponsiveContainer
  const isTableView = chartType === "table";

  return (
    <Card className="card-elegant" dir="rtl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" />
            שעות עבודה
          </CardTitle>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Data View Toggle */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setDataViewMode("employee")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  dataViewMode === "employee"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Users className="h-4 w-4" />
                <span>לפי עובד</span>
              </button>
              <button
                onClick={() => setDataViewMode("project")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  dataViewMode === "project"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FolderKanban className="h-4 w-4" />
                <span>לפי פרויקט</span>
              </button>
            </div>

            {/* Chart Type Options - expanded with many views */}
            <DisplayOptions
              viewType={chartType}
              onViewTypeChange={setChartType}
              availableViewTypes={[
                "bar",
                "stacked-bar",
                "line",
                "area",
                "pie",
                "donut",
                "radar",
                "table",
              ]}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isTableView ? (
            renderChart()
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
