import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Percent,
  AlertCircle,
  DollarSign,
  Target
} from 'lucide-react';
import { KPIData, formatCurrency } from '@/hooks/useFinanceCalculations';

interface FinanceKPIsProps {
  kpis: KPIData;
  year?: number;
}

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'primary'
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'green' | 'red' | 'yellow';
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600',
    red: 'bg-red-500/10 text-red-600',
    yellow: 'bg-yellow-500/10 text-yellow-600',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">{value}</p>
              {trend && trend !== 'neutral' && (
                <span className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function FinanceKPIs({ kpis, year }: FinanceKPIsProps) {
  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              מדדי ביצוע (KPIs)
            </CardTitle>
            <CardDescription>מדדים פיננסיים מרכזיים לניטור הביצועים</CardDescription>
          </div>
          {year && (
            <Badge variant="outline">{year}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* DSO - Days Sales Outstanding */}
          <KPICard
            title="ימי גבייה ממוצעים (DSO)"
            value={`${kpis.dso} ימים`}
            subtitle="זמן ממוצע מהנפקה לתשלום"
            icon={<Clock className="h-4 w-4" />}
            trend={kpis.dso <= 30 ? 'up' : kpis.dso <= 60 ? 'neutral' : 'down'}
            color={kpis.dso <= 30 ? 'green' : kpis.dso <= 60 ? 'yellow' : 'red'}
          />

          {/* Profit Margin */}
          <KPICard
            title="מרווח רווח"
            value={`${kpis.profitMargin}%`}
            subtitle="רווח נקי מההכנסות"
            icon={<Percent className="h-4 w-4" />}
            trend={kpis.profitMargin >= 20 ? 'up' : kpis.profitMargin >= 10 ? 'neutral' : 'down'}
            color={kpis.profitMargin >= 20 ? 'green' : kpis.profitMargin >= 10 ? 'yellow' : 'red'}
          />

          {/* Monthly Growth */}
          <KPICard
            title="צמיחה חודשית"
            value={`${kpis.monthlyGrowth > 0 ? '+' : ''}${kpis.monthlyGrowth}%`}
            subtitle="השוואה לחודש קודם"
            icon={kpis.monthlyGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            trend={kpis.monthlyGrowth >= 0 ? 'up' : 'down'}
            color={kpis.monthlyGrowth >= 5 ? 'green' : kpis.monthlyGrowth >= 0 ? 'yellow' : 'red'}
          />

          {/* Collection Rate */}
          <KPICard
            title="שיעור גבייה"
            value={`${kpis.collectionRate}%`}
            subtitle="מתוך סה״כ חשבוניות"
            icon={<DollarSign className="h-4 w-4" />}
            trend={kpis.collectionRate >= 80 ? 'up' : kpis.collectionRate >= 60 ? 'neutral' : 'down'}
            color={kpis.collectionRate >= 80 ? 'green' : kpis.collectionRate >= 60 ? 'yellow' : 'red'}
          />

          {/* Overdue */}
          <KPICard
            title="חשבוניות באיחור"
            value={`${kpis.overdueCount}`}
            subtitle={`${kpis.overduePercentage}% מסה״כ הפתוחות`}
            icon={<AlertCircle className="h-4 w-4" />}
            trend={kpis.overdueCount === 0 ? 'up' : 'down'}
            color={kpis.overduePercentage <= 10 ? 'green' : kpis.overduePercentage <= 25 ? 'yellow' : 'red'}
          />

          {/* Expense to Income Ratio */}
          <KPICard
            title="יחס הוצאות/הכנסות"
            value={`${kpis.expenseToIncomeRatio}%`}
            subtitle="אחוז הוצאות מההכנסות"
            icon={<Percent className="h-4 w-4" />}
            trend={kpis.expenseToIncomeRatio <= 60 ? 'up' : kpis.expenseToIncomeRatio <= 80 ? 'neutral' : 'down'}
            color={kpis.expenseToIncomeRatio <= 60 ? 'green' : kpis.expenseToIncomeRatio <= 80 ? 'yellow' : 'red'}
          />
        </div>

        {/* Top Clients */}
        {kpis.topClients.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">לקוחות מובילים</h4>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {kpis.topClients.map((client, index) => (
                <div key={client.id} className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(client.amount)}</p>
                    <p className="text-xs text-muted-foreground">{client.count} חשבוניות</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
