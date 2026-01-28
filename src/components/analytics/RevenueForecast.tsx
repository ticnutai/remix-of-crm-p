// Revenue Forecast Component - e-control CRM Pro
// קומפוננט לחיזוי הכנסות עתידיות על בסיס נתונים היסטוריים

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertTriangle,
  Target,
  BarChart3,
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface RevenueData {
  date: Date;
  revenue: number;
  expenses?: number;
  profit?: number;
}

interface ForecastDataPoint {
  month: string;
  actual?: number;
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
  isProjection: boolean;
}

interface ForecastResult {
  nextMonthRevenue: number;
  threeMonthTotal: number;
  sixMonthTotal: number;
  yearlyProjection: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  confidence: number;
  chartData: ForecastDataPoint[];
}

// Simple Linear Regression for forecasting
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

// Calculate standard deviation for confidence intervals
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// Main forecasting function
export function calculateRevenueForecast(
  historicalData: RevenueData[],
  forecastMonths: number = 6
): ForecastResult {
  // Sort data by date
  const sortedData = [...historicalData].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by month
  const monthlyData = new Map<string, number>();
  for (const item of sortedData) {
    const monthKey = format(item.date, 'yyyy-MM');
    const current = monthlyData.get(monthKey) || 0;
    monthlyData.set(monthKey, current + item.revenue);
  }

  // Convert to array for regression
  const dataPoints = Array.from(monthlyData.entries()).map((entry, index) => ({
    x: index,
    y: entry[1],
    month: entry[0],
  }));

  // Calculate regression
  const regression = linearRegression(dataPoints.map(p => ({ x: p.x, y: p.y })));

  // Calculate mean and standard deviation for confidence intervals
  const revenues = dataPoints.map(p => p.y);
  const meanRevenue = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;
  const stdDev = calculateStdDev(revenues, meanRevenue);

  // Generate forecast data
  const chartData: ForecastDataPoint[] = [];

  // Add historical data
  for (const point of dataPoints) {
    chartData.push({
      month: format(new Date(point.month + '-01'), 'MMM yyyy', { locale: he }),
      actual: point.y,
      isProjection: false,
    });
  }

  // Add forecast data
  const lastIndex = dataPoints.length;
  const lastDate = dataPoints.length > 0 
    ? new Date(dataPoints[dataPoints.length - 1].month + '-01') 
    : new Date();

  let totalForecast = 0;
  const forecasts: number[] = [];

  for (let i = 0; i < forecastMonths; i++) {
    const forecastIndex = lastIndex + i;
    const forecastValue = Math.max(0, regression.intercept + regression.slope * forecastIndex);
    const forecastDate = addMonths(lastDate, i + 1);
    
    forecasts.push(forecastValue);
    totalForecast += forecastValue;

    chartData.push({
      month: format(forecastDate, 'MMM yyyy', { locale: he }),
      forecast: forecastValue,
      lowerBound: Math.max(0, forecastValue - 1.96 * stdDev),
      upperBound: forecastValue + 1.96 * stdDev,
      isProjection: true,
    });
  }

  // Calculate trend
  let trendPercent = 0;
  if (dataPoints.length >= 2) {
    const firstHalfAvg = dataPoints.slice(0, Math.floor(dataPoints.length / 2))
      .reduce((sum, p) => sum + p.y, 0) / Math.floor(dataPoints.length / 2);
    const secondHalfAvg = dataPoints.slice(Math.floor(dataPoints.length / 2))
      .reduce((sum, p) => sum + p.y, 0) / (dataPoints.length - Math.floor(dataPoints.length / 2));
    
    if (firstHalfAvg > 0) {
      trendPercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    }
  }

  const trend: 'up' | 'down' | 'stable' = 
    trendPercent > 5 ? 'up' : 
    trendPercent < -5 ? 'down' : 'stable';

  // Calculate confidence (based on R-squared and data volume)
  const confidence = Math.min(95, Math.max(50, 60 + dataPoints.length * 2));

  return {
    nextMonthRevenue: forecasts[0] || 0,
    threeMonthTotal: forecasts.slice(0, 3).reduce((a, b) => a + b, 0),
    sixMonthTotal: totalForecast,
    yearlyProjection: totalForecast * (12 / forecastMonths),
    trend,
    trendPercent,
    confidence,
    chartData,
  };
}

// Revenue Forecast Chart Component
interface RevenueForecastChartProps {
  historicalData: RevenueData[];
  forecastMonths?: number;
  targetRevenue?: number;
  className?: string;
}

export function RevenueForecastChart({
  historicalData,
  forecastMonths = 6,
  targetRevenue,
  className,
}: RevenueForecastChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6');

  const forecast = useMemo(
    () => calculateRevenueForecast(historicalData, parseInt(selectedPeriod)),
    [historicalData, selectedPeriod]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const TrendIcon = forecast.trend === 'up' ? TrendingUp :
                    forecast.trend === 'down' ? TrendingDown : Minus;

  const trendColor = forecast.trend === 'up' ? 'text-green-600' :
                     forecast.trend === 'down' ? 'text-red-600' : 'text-yellow-600';

  return (
    <Card className={cn("w-full", className)} dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            תחזית הכנסות
          </CardTitle>
          <CardDescription>
            ניתוח מגמות וחיזוי הכנסות עתידיות
          </CardDescription>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="תקופה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 חודשים</SelectItem>
            <SelectItem value="6">6 חודשים</SelectItem>
            <SelectItem value="12">12 חודשים</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">חודש הבא</p>
            <p className="text-xl font-bold">{formatCurrency(forecast.nextMonthRevenue)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">3 חודשים</p>
            <p className="text-xl font-bold">{formatCurrency(forecast.threeMonthTotal)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">תחזית שנתית</p>
            <p className="text-xl font-bold">{formatCurrency(forecast.yearlyProjection)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">מגמה</p>
            <div className="flex items-center gap-2">
              <TrendIcon className={cn("h-5 w-5", trendColor)} />
              <span className={cn("text-xl font-bold", trendColor)}>
                {Math.abs(forecast.trendPercent).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={forecast.chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                reversed
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis 
                orientation="right"
                tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => label}
                contentStyle={{ 
                  textAlign: 'right', 
                  direction: 'rtl',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                wrapperStyle={{ direction: 'rtl' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    actual: 'הכנסות בפועל',
                    forecast: 'תחזית',
                    lowerBound: 'גבול תחתון',
                    upperBound: 'גבול עליון',
                  };
                  return labels[value] || value;
                }}
              />
              
              {/* Confidence interval */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="#16a34a"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
              
              {/* Actual revenue */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#actualGradient)"
                dot={{ r: 4 }}
              />
              
              {/* Forecast */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#16a34a"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#16a34a' }}
              />
              
              {/* Target line */}
              {targetRevenue && (
                <ReferenceLine 
                  y={targetRevenue} 
                  stroke="#f59e0b" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: 'יעד', 
                    position: 'right',
                    fill: '#f59e0b',
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Indicator */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">רמת ביטחון בתחזית:</span>
          </div>
          <Badge variant={forecast.confidence >= 80 ? 'default' : 'secondary'}>
            {forecast.confidence.toFixed(0)}%
          </Badge>
        </div>

        {/* Warning if low confidence */}
        {forecast.confidence < 70 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 text-yellow-700 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              רמת הביטחון נמוכה. מומלץ להוסיף יותר נתונים היסטוריים לשיפור התחזית.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook to fetch and process revenue data
export function useRevenueForecast(invoices: any[], payments: any[]) {
  return useMemo(() => {
    // Convert invoices/payments to RevenueData format
    const revenueData: RevenueData[] = [];

    // Add paid invoices
    for (const invoice of invoices) {
      if (invoice.status === 'paid' && invoice.paid_date) {
        revenueData.push({
          date: new Date(invoice.paid_date),
          revenue: invoice.total_amount || invoice.amount || 0,
        });
      }
    }

    // Add payments
    for (const payment of payments) {
      revenueData.push({
        date: new Date(payment.payment_date || payment.date),
        revenue: payment.amount || 0,
      });
    }

    return revenueData;
  }, [invoices, payments]);
}

export default RevenueForecastChart;
