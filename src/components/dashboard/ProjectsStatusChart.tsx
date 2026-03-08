import React, { useState, useMemo, useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
} from "recharts";
import { FolderKanban } from "lucide-react";
import {
  DisplayOptions,
  ViewType,
  ColorScheme,
  COLOR_SCHEMES,
} from "@/components/ui/display-options";
import { cn } from "@/lib/utils";
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

interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

interface ProjectsStatusChartProps {
  data: ProjectStatusData[];
  isLoading?: boolean;
}

export const ProjectsStatusChart = memo(function ProjectsStatusChart({
  data,
  isLoading,
}: ProjectsStatusChartProps) {
  // Cloud-synced preferences
  const { value: prefs, setValue: setPrefs } = useUserSettings<{
    viewType: ViewType;
    colorScheme: ColorScheme;
  }>({
    key: "dashboard_projects_chart_prefs",
    defaultValue: { viewType: "pie", colorScheme: "default" },
  });
  const viewType = prefs.viewType;
  const colorScheme = prefs.colorScheme;
  const setViewType = (v: ViewType) => setPrefs((p) => ({ ...p, viewType: v }));
  const setColorScheme = (v: ColorScheme) =>
    setPrefs((p) => ({ ...p, colorScheme: v }));

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

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  // Apply color scheme to data
  const coloredData = useMemo(() => {
    const colors = COLOR_SCHEMES[colorScheme].colors;
    return data.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
      fill: colors[index % colors.length],
    }));
  }, [data, colorScheme]);

  // Calculate total for percentages
  const total = useMemo(
    () => coloredData.reduce((sum, item) => sum + item.value, 0),
    [coloredData],
  );

  if (isLoading) {
    return (
      <Card className="frame-navy" dir="rtl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            התפלגות פרויקטים לפי סטטוס
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">
            {payload[0].name || payload[0].payload?.name}
          </p>
          <p className="text-muted-foreground">{payload[0].value} פרויקטים</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderChart = () => {
    // Bar chart (horizontal)
    if (viewType === "bar" || viewType === "horizontal-bar") {
      return (
        <BarChart
          data={coloredData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
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
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
            {coloredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      );
    }

    // Vertical bar chart
    if (viewType === "stacked-bar") {
      return (
        <BarChart
          data={coloredData}
          margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
          <XAxis
            dataKey="name"
            tick={{ fill: chartColors.tickColor, fontSize: 11 }}
            axisLine={{ stroke: chartColors.gridColor }}
            interval={0}
            angle={-30}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: chartColors.tickColor, fontSize: 12 }}
            axisLine={{ stroke: chartColors.gridColor }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800}>
            {coloredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      );
    }

    // Radar chart with improved styling
    if (viewType === "radar") {
      return (
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={coloredData}>
          <PolarGrid stroke="hsl(222, 30%, 80%)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: "hsl(222, 20%, 35%)", fontSize: 12, fontWeight: 500 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, "auto"]}
            tick={{ fill: "hsl(222, 20%, 55%)", fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="פרויקטים"
            dataKey="value"
            stroke={COLOR_SCHEMES[colorScheme].colors[0]}
            strokeWidth={2}
            fill={COLOR_SCHEMES[colorScheme].colors[0]}
            fillOpacity={0.4}
            dot={{
              fill: COLOR_SCHEMES[colorScheme].colors[0],
              strokeWidth: 0,
              r: 4,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </RadarChart>
      );
    }

    // Cards/Grid view - visual representation
    if (viewType === "cards" || viewType === "grid") {
      return (
        <div className="grid grid-cols-2 gap-3 h-full p-2">
          {coloredData.map((item, index) => {
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
            return (
              <div
                key={index}
                className="relative rounded-xl p-4 flex flex-col justify-between overflow-hidden transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: item.color + "20",
                  borderLeft: `4px solid ${item.color}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: item.color, color: "white" }}
                  >
                    {percentage}%
                  </span>
                </div>
                <div className="mt-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </span>
                  <span className="text-xs text-muted-foreground mr-1">
                    פרויקטים
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // List view
    if (viewType === "list") {
      return (
        <div className="space-y-2 h-full overflow-auto p-2">
          {coloredData.map((item, index) => {
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                      {item.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.value} פרויקטים
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: item.color }}
                >
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    // Donut chart
    if (viewType === "donut") {
      return (
        <PieChart>
          <Pie
            data={coloredData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={60}
            dataKey="value"
            animationDuration={1000}
            strokeWidth={2}
            stroke="white"
          >
            {coloredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {/* Center text */}
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            className="fill-foreground text-2xl font-bold"
          >
            {total}
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            פרויקטים
          </text>
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
    }

    // Default: Pie chart
    return (
      <PieChart>
        <Pie
          data={coloredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          innerRadius={40}
          dataKey="value"
          animationDuration={1000}
          strokeWidth={2}
          stroke="white"
        >
          {coloredData.map((entry, index) => (
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

  return (
    <Card className="frame-navy" dir="rtl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            התפלגות פרויקטים לפי סטטוס
          </CardTitle>
          <DisplayOptions
            viewType={viewType}
            onViewTypeChange={setViewType}
            availableViewTypes={[
              "pie",
              "donut",
              "bar",
              "stacked-bar",
              "radar",
              "cards",
              "list",
            ]}
            colorScheme={colorScheme}
            onColorSchemeChange={setColorScheme}
            showColorOptions={true}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {viewType === "cards" ||
          viewType === "grid" ||
          viewType === "list" ? (
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
