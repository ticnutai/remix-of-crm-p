import { useMemo } from 'react';
import { format, subMonths, addMonths, parseISO, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name?: string;
  project_id: string | null;
  project_name?: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  created_at: string;
  green_invoice_id?: string | null;
  paid_amount?: number;
  remaining_amount?: number;
}

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  has_vat: boolean;
  supplier_name: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  is_recurring: boolean;
  recurring_day: number | null;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  year: number;
  category: string;
  planned_amount: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialAlert {
  id: string;
  user_id: string;
  type: 'overdue_invoice' | 'collection_reminder' | 'monthly_summary' | 'budget_exceeded';
  invoice_id: string | null;
  message: string | null;
  channel: 'email' | 'browser' | 'both';
  status: 'pending' | 'sent' | 'dismissed';
  triggered_at: string;
  sent_at: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
}

export interface KPIData {
  dso: number; // Days Sales Outstanding
  profitMargin: number;
  monthlyGrowth: number;
  overduePercentage: number;
  overdueCount: number;
  topClients: { id: string; name: string; amount: number; count: number }[];
  expenseToIncomeRatio: number;
  collectionRate: number;
}

export interface CashFlowMonth {
  month: string;
  monthDate: Date;
  expectedIncome: number;
  expectedExpenses: number;
  netCashFlow: number;
  cumulativeBalance: number;
  overdueRecovery: number;
}

export interface ProfitLossData {
  totalIncome: number;
  incomeBeforeVat: number;
  vatOnIncome: number;
  totalExpenses: number;
  expensesBeforeVat: number;
  vatOnExpenses: number;
  grossProfit: number;
  netProfit: number;
  vatToPay: number;
  incomeByClient: { id: string; name: string; amount: number }[];
  incomeByMonth: { month: string; amount: number }[];
  expensesByCategory: { category: string; label: string; amount: number }[];
  expensesByMonth: { month: string; amount: number }[];
}

export interface MonthlyBreakdown {
  month: string;
  monthNum: number;
  income: number;
  expenses: number;
  profit: number;
}

export const EXPENSE_CATEGORIES = [
  { value: 'supplier', label: 'ספקים' },
  { value: 'equipment', label: 'ציוד' },
  { value: 'rent', label: 'שכירות' },
  { value: 'marketing', label: 'שיווק ופרסום' },
  { value: 'office', label: 'משרד' },
  { value: 'travel', label: 'נסיעות' },
  { value: 'software', label: 'תוכנה ומנויים' },
  { value: 'professional', label: 'שירותים מקצועיים' },
  { value: 'other', label: 'אחר' },
];

export const formatCurrency = (amount: number): string => {
  return `₪${Math.round(amount).toLocaleString('he-IL')}`;
};

export function useFinanceCalculations(
  invoices: Invoice[],
  expenses: Expense[],
  clients: Client[],
  vatRate: number = 18,
  year?: number
) {
  // VAT helpers
  const removeVat = (amount: number): number => {
    return amount / (1 + vatRate / 100);
  };

  const getVatAmount = (amount: number): number => {
    return amount - removeVat(amount);
  };

  // Filter by year if provided
  const filteredInvoices = useMemo(() => {
    if (!year) return invoices;
    return invoices.filter(i => new Date(i.issue_date).getFullYear() === year);
  }, [invoices, year]);

  const filteredExpenses = useMemo(() => {
    if (!year) return expenses;
    return expenses.filter(e => new Date(e.expense_date).getFullYear() === year);
  }, [expenses, year]);

  // KPI Calculations
  const kpis = useMemo((): KPIData => {
    const paidInvoices = filteredInvoices.filter(i => i.status === 'paid');
    const overdueInvoices = filteredInvoices.filter(i => i.status === 'overdue');
    const sentInvoices = filteredInvoices.filter(i => i.status === 'sent');
    
    // DSO - Days Sales Outstanding (average days to collect payment)
    let totalDays = 0;
    let dsoCount = 0;
    paidInvoices.forEach(inv => {
      if (inv.paid_date && inv.issue_date) {
        const days = differenceInDays(parseISO(inv.paid_date), parseISO(inv.issue_date));
        if (days > 0) {
          totalDays += days;
          dsoCount++;
        }
      }
    });
    const dso = dsoCount > 0 ? Math.round(totalDays / dsoCount) : 0;

    // Total income and expenses
    const totalIncome = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      return sum + (e.is_recurring ? amount * 12 : amount);
    }, 0);

    // Profit margin
    const incomeBeforeVat = removeVat(totalIncome);
    const expensesBeforeVat = filteredExpenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      const effectiveAmount = e.is_recurring ? amount * 12 : amount;
      return sum + (e.has_vat ? removeVat(effectiveAmount) : effectiveAmount);
    }, 0);
    const netProfit = incomeBeforeVat - expensesBeforeVat;
    const profitMargin = incomeBeforeVat > 0 ? (netProfit / incomeBeforeVat) * 100 : 0;

    // Monthly growth - compare current month to previous
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const previousMonth = startOfMonth(subMonths(now, 1));
    
    const currentMonthIncome = paidInvoices
      .filter(i => i.paid_date && parseISO(i.paid_date) >= currentMonth)
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const previousMonthIncome = paidInvoices
      .filter(i => {
        if (!i.paid_date) return false;
        const paidDate = parseISO(i.paid_date);
        return paidDate >= previousMonth && paidDate < currentMonth;
      })
      .reduce((sum, i) => sum + Number(i.amount), 0);
    
    const monthlyGrowth = previousMonthIncome > 0 
      ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 
      : 0;

    // Overdue stats
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalOutstanding = overdueAmount + sentInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const overduePercentage = totalOutstanding > 0 ? (overdueAmount / totalOutstanding) * 100 : 0;

    // Top clients
    const clientData = clients.map(client => {
      const clientInvoices = paidInvoices.filter(i => i.client_id === client.id);
      return {
        id: client.id,
        name: client.name,
        amount: clientInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
        count: clientInvoices.length,
      };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Expense to income ratio
    const expenseToIncomeRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    // Collection rate
    const totalBilled = filteredInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const collectionRate = totalBilled > 0 ? (totalIncome / totalBilled) * 100 : 0;

    return {
      dso,
      profitMargin: Math.round(profitMargin * 10) / 10,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      overduePercentage: Math.round(overduePercentage * 10) / 10,
      overdueCount: overdueInvoices.length,
      topClients: clientData,
      expenseToIncomeRatio: Math.round(expenseToIncomeRatio * 10) / 10,
      collectionRate: Math.round(collectionRate * 10) / 10,
    };
  }, [filteredInvoices, filteredExpenses, clients, vatRate]);

  // Cash Flow Forecast
  const cashFlowForecast = useMemo((): CashFlowMonth[] => {
    const result: CashFlowMonth[] = [];
    const now = new Date();
    let cumulativeBalance = 0;

    // Calculate monthly recurring expenses
    const monthlyRecurringExpenses = expenses
      .filter(e => e.is_recurring)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Get open invoices (sent and overdue)
    const openInvoices = invoices.filter(i => 
      i.status === 'sent' || i.status === 'overdue'
    );

    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Expected income from invoices due this month
      let expectedIncome = openInvoices
        .filter(inv => {
          if (!inv.due_date) return false;
          const dueDate = parseISO(inv.due_date);
          return dueDate >= monthStart && dueDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + Number(inv.amount), 0);

      // For first month, add overdue recovery estimate (50% of overdue)
      let overdueRecovery = 0;
      if (i === 0) {
        overdueRecovery = invoices
          .filter(inv => inv.status === 'overdue')
          .reduce((sum, inv) => sum + Number(inv.amount) * 0.5, 0);
        expectedIncome += overdueRecovery;
      }

      // Expected expenses
      const monthlyOneTimeExpenses = expenses
        .filter(e => {
          if (e.is_recurring) return false;
          const expDate = parseISO(e.expense_date);
          return expDate >= monthStart && expDate <= monthEnd;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const expectedExpenses = monthlyRecurringExpenses + monthlyOneTimeExpenses;
      const netCashFlow = expectedIncome - expectedExpenses;
      cumulativeBalance += netCashFlow;

      result.push({
        month: format(monthDate, 'MMMM yyyy', { locale: he }),
        monthDate,
        expectedIncome,
        expectedExpenses,
        netCashFlow,
        cumulativeBalance,
        overdueRecovery,
      });
    }

    return result;
  }, [invoices, expenses]);

  // Profit & Loss Report
  const profitLoss = useMemo((): ProfitLossData => {
    const paidInvoices = filteredInvoices.filter(i => i.status === 'paid');
    
    // Income calculations
    const totalIncome = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const incomeBeforeVat = removeVat(totalIncome);
    const vatOnIncome = getVatAmount(totalIncome);

    // Expenses calculations
    const totalExpenses = filteredExpenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      return sum + (e.is_recurring ? amount * 12 : amount);
    }, 0);

    const expensesWithVat = filteredExpenses
      .filter(e => e.has_vat)
      .reduce((sum, e) => {
        const amount = Number(e.amount);
        return sum + (e.is_recurring ? amount * 12 : amount);
      }, 0);

    const expensesWithoutVat = totalExpenses - expensesWithVat;
    const vatOnExpenses = getVatAmount(expensesWithVat);
    const expensesBeforeVat = removeVat(expensesWithVat) + expensesWithoutVat;

    // Profit calculations
    const grossProfit = totalIncome - totalExpenses;
    const netProfit = incomeBeforeVat - expensesBeforeVat;
    const vatToPay = vatOnIncome - vatOnExpenses;

    // Income by client
    const incomeByClient = clients.map(client => {
      const clientInvoices = paidInvoices.filter(i => i.client_id === client.id);
      return {
        id: client.id,
        name: client.name,
        amount: clientInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
      };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    // Income by month
    const incomeByMonth = Array.from({ length: 12 }, (_, i) => {
      const monthInvoices = paidInvoices.filter(inv => {
        if (!inv.paid_date) return false;
        return new Date(inv.paid_date).getMonth() === i;
      });
      return {
        month: format(new Date(2024, i, 1), 'MMM', { locale: he }),
        amount: monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      };
    });

    // Expenses by category
    const expensesByCategory = EXPENSE_CATEGORIES.map(cat => {
      const catExpenses = filteredExpenses.filter(e => e.category === cat.value);
      const total = catExpenses.reduce((sum, e) => {
        const amount = Number(e.amount);
        return sum + (e.is_recurring ? amount * 12 : amount);
      }, 0);
      return {
        category: cat.value,
        label: cat.label,
        amount: total,
      };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    // Expenses by month
    const expensesByMonth = Array.from({ length: 12 }, (_, i) => {
      const monthExpenses = filteredExpenses.filter(e => 
        new Date(e.expense_date).getMonth() === i && !e.is_recurring
      );
      const oneTimeTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const recurringTotal = filteredExpenses
        .filter(e => e.is_recurring)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      return {
        month: format(new Date(2024, i, 1), 'MMM', { locale: he }),
        amount: oneTimeTotal + recurringTotal,
      };
    });

    return {
      totalIncome,
      incomeBeforeVat,
      vatOnIncome,
      totalExpenses,
      expensesBeforeVat,
      vatOnExpenses,
      grossProfit,
      netProfit,
      vatToPay,
      incomeByClient,
      incomeByMonth,
      expensesByCategory,
      expensesByMonth,
    };
  }, [filteredInvoices, filteredExpenses, clients, vatRate]);

  // Monthly breakdown for comparison
  const monthlyBreakdown = useMemo((): MonthlyBreakdown[] => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthInvoices = filteredInvoices.filter(inv => {
        if (inv.status !== 'paid' || !inv.paid_date) return false;
        return new Date(inv.paid_date).getMonth() === i;
      });
      const income = monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

      const monthExpenses = filteredExpenses.filter(e => 
        new Date(e.expense_date).getMonth() === i && !e.is_recurring
      );
      const oneTimeExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const recurringExpenses = filteredExpenses
        .filter(e => e.is_recurring)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const expenses = oneTimeExpenses + recurringExpenses;

      return {
        month: format(new Date(2024, i, 1), 'MMMM', { locale: he }),
        monthNum: i + 1,
        income,
        expenses,
        profit: income - expenses,
      };
    });
  }, [filteredInvoices, filteredExpenses]);

  return {
    removeVat,
    getVatAmount,
    kpis,
    cashFlowForecast,
    profitLoss,
    monthlyBreakdown,
    formatCurrency,
  };
}
