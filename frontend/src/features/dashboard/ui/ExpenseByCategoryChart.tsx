import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/shared/lib/useThemeColor';
import { labelPercent } from './InvoiceStatusChart';
import type { CategoryExpense } from '../model/types';

interface ExpenseByCategoryChartProps {
  data: CategoryExpense[];
}

export const FALLBACK_COLORS = [
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
];

export function makeExpenseLabelRenderer(total: number) {
  return ({ value }: PieLabelRenderProps) =>
    labelPercent(typeof value === 'number' ? value : 0, total);
}

export function makeCategoryTooltipFormatter(expensesLabel: string) {
  return (v: unknown): [string, string] => [
    typeof v === 'number' ? `$${v.toLocaleString()}` : String(v),
    expensesLabel,
  ];
}

export function ExpenseByCategoryChart({ data }: ExpenseByCategoryChartProps) {
  const { t } = useTranslation();
  const color1 = useThemeColor('--color-chart-1') || FALLBACK_COLORS[0]!;
  const color2 = useThemeColor('--color-chart-2') || FALLBACK_COLORS[1]!;
  const color3 = useThemeColor('--color-chart-3') || FALLBACK_COLORS[2]!;
  const color4 = useThemeColor('--color-chart-4') || FALLBACK_COLORS[3]!;
  const color5 = useThemeColor('--color-chart-5') || FALLBACK_COLORS[4]!;

  const themeColors = [color1, color2, color3, color4, color5];

  const total = data.reduce((sum, d) => sum + parseFloat(d.total), 0);

  const allColors = [...themeColors, ...FALLBACK_COLORS];

  const chartData = data.map((d, i) => ({
    name: t(`expenses.categories.${d.category}`, { defaultValue: d.category }),
    value: parseFloat(d.total),
    color: allColors[i % allColors.length] ?? '#888888',
  }));

  const renderLabel = makeExpenseLabelRenderer(total);
  const tooltipFormatter = makeCategoryTooltipFormatter(t('dashboard.charts.expensesTooltip'));

  return (
    <div data-testid="expense-by-category-chart" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
