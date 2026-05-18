import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyExpense } from '../model/types';
import { useThemeColor } from '@/shared/lib/useThemeColor';
import { formatMonth } from './RevenueChart';
import { useTranslation } from 'react-i18next';

interface ExpenseByMonthChartProps {
  data: MonthlyExpense[];
}

export function formatExpenseDollar(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function makeExpenseTooltipFormatter(expensesLabel: string) {
  return (v: unknown): [string, string] => [
    formatExpenseDollar(typeof v === 'number' ? v : 0),
    expensesLabel,
  ];
}

export function ExpenseByMonthChart({ data }: ExpenseByMonthChartProps) {
  const { t } = useTranslation();
  const barFill = useThemeColor('--color-chart-2') || '#f97316';
  const gridStroke = useThemeColor('--color-border');
  const tickFill = useThemeColor('--color-muted-foreground');

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
    totalNum: parseFloat(d.total),
  }));

  const tooltipFormatter = makeExpenseTooltipFormatter(t('dashboard.charts.expensesTooltip'));

  return (
    <div data-testid="expense-by-month-chart" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: tickFill }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatExpenseDollar}
            tick={{ fontSize: 12, fill: tickFill }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip formatter={tooltipFormatter} />
          <Bar dataKey="totalNum" fill={barFill} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
