import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyRevenue } from '../model/types';
import { useThemeColor } from '@/shared/lib/useThemeColor';

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  if (!year || !m) return month;
  const date = new Date(Number(year), Number(m) - 1, 1);
  const abbr = date.toLocaleString('default', { month: 'short' });
  return `${abbr} ${year}`;
}

export function formatDollar(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const barFill = useThemeColor('--color-chart-1');
  const gridStroke = useThemeColor('--color-border');
  const tickFill = useThemeColor('--color-muted-foreground');

  const chartData = data.map((d) => ({ ...d, label: formatMonth(d.month) }));

  return (
    <div data-testid="revenue-chart" className="h-64 w-full">
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
            tickFormatter={formatDollar}
            tick={{ fontSize: 12, fill: tickFill }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip formatter={(v) => [formatDollar(typeof v === 'number' ? v : 0), 'Revenue']} />
          <Bar dataKey="revenue" fill={barFill} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
