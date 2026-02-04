import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CashFlowMonth, formatCurrency } from '@/hooks/useFinanceCalculations';

interface CashFlowForecastProps {
  forecast: CashFlowMonth[];
}

export default function CashFlowForecast({ forecast }: CashFlowForecastProps) {
  const hasNegativeFlow = forecast.some(m => m.cumulativeBalance < 0);
  const negativeMonths = forecast.filter(m => m.netCashFlow < 0);

  const chartData = forecast.map(m => ({
    month: m.month.split(' ')[0], // Just the month name
    הכנסות: m.expectedIncome,
    הוצאות: m.expectedExpenses,
    יתרה: m.cumulativeBalance,
  }));

  return (
    <Card className="border-2 border-blue-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              תחזית תזרים מזומנים
            </CardTitle>
            <CardDescription>תחזית ל-6 חודשים הקרובים</CardDescription>
          </div>
          {hasNegativeFlow && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 ml-1" />
              תזרים שלילי צפוי
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts for negative months */}
        {negativeMonths.length > 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              תזרים שלילי צפוי ב-{negativeMonths.length} חודשים: {negativeMonths.map(m => m.month.split(' ')[0]).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  direction: 'rtl',
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
              <Area 
                type="monotone" 
                dataKey="הכנסות" 
                stackId="1"
                stroke="hsl(142, 76%, 36%)" 
                fill="hsl(142, 76%, 36%)" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="הוצאות" 
                stackId="2"
                stroke="hsl(0, 84%, 60%)" 
                fill="hsl(0, 84%, 60%)" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="יתרה" 
                stroke="hsl(217, 91%, 60%)" 
                fill="hsl(217, 91%, 60%)" 
                fillOpacity={0.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly breakdown */}
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {forecast.map((month, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg border ${
                month.netCashFlow < 0 
                  ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900' 
                  : 'bg-accent/30'
              }`}
            >
              <p className="text-xs font-medium text-muted-foreground mb-2">{month.month.split(' ')[0]}</p>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600">+הכנסות</span>
                  <span className="font-medium">{formatCurrency(month.expectedIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600">-הוצאות</span>
                  <span className="font-medium">{formatCurrency(month.expectedExpenses)}</span>
                </div>
                <div className="border-t pt-1.5 mt-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      {month.netCashFlow >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      נטו
                    </span>
                    <span className={`font-bold ${month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(month.netCashFlow)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">יתרה</span>
                  <span className={`font-bold ${month.cumulativeBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(month.cumulativeBalance)}
                  </span>
                </div>
                {month.overdueRecovery > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    *כולל {formatCurrency(month.overdueRecovery)} צפי מאיחורים
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
