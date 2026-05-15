import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { useThemeColor } from '@/shared/lib/useThemeColor';

interface InvoiceStatusChartProps {
  draftCount: number;
  sentCount: number;
  paidCount: number;
}

export function labelPercent(value: number, total: number): string {
  if (total === 0) return '';
  return `${Math.round((value / total) * 100)}%`;
}

export function InvoiceStatusChart({ draftCount, sentCount, paidCount }: InvoiceStatusChartProps) {
  const draftColor = useThemeColor('--color-status-draft-fg');
  const sentColor = useThemeColor('--color-status-sent-fg');
  const paidColor = useThemeColor('--color-status-paid-fg');

  const total = draftCount + sentCount + paidCount;

  const allData = [
    { name: 'DRAFT', value: draftCount, color: draftColor },
    { name: 'SENT', value: sentCount, color: sentColor },
    { name: 'PAID', value: paidCount, color: paidColor },
  ];

  const data = allData.filter((d) => d.value > 0);

  const renderLabel = ({ value }: PieLabelRenderProps) =>
    labelPercent(typeof value === 'number' ? value : 0, total);

  return (
    <div data-testid="invoice-status-chart" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [typeof v === 'number' ? v : 0, 'Invoices']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
