import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/cn';

interface DashboardDateFilterProps {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
}

export function DashboardDateFilter({ from, to, onChange }: DashboardDateFilterProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [localFrom, setLocalFrom] = React.useState(from ?? '');
  const [localTo, setLocalTo] = React.useState(to ?? '');

  // Sync local state when external props change
  React.useEffect(() => {
    setLocalFrom(from ?? '');
    setLocalTo(to ?? '');
  }, [from, to]);

  const isActive = Boolean(from || to);

  function handleApply() {
    onChange(localFrom || null, localTo || null);
    setOpen(false);
  }

  function handleClear() {
    setLocalFrom('');
    setLocalTo('');
    onChange(null, null);
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          data-testid="dashboard-date-filter"
          variant="outline"
          size="icon"
          aria-label={t('dashboard.filter.label')}
          className={cn(isActive && 'text-[var(--color-primary)] border-[var(--color-primary)]')}
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg"
          onInteractOutside={(e) => { (e as { preventDefault(): void }).preventDefault(); }}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="date-filter-from"
                className="text-xs font-medium text-[var(--color-muted-foreground)]"
              >
                {t('dashboard.filter.from')}
              </label>
              <Input
                id="date-filter-from"
                data-testid="date-filter-from"
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="date-filter-to"
                className="text-xs font-medium text-[var(--color-muted-foreground)]"
              >
                {t('dashboard.filter.to')}
              </label>
              <Input
                id="date-filter-to"
                data-testid="date-filter-to"
                type="date"
                value={localTo}
                onChange={(e) => setLocalTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                data-testid="date-filter-apply"
                size="sm"
                className="flex-1"
                onClick={handleApply}
              >
                {t('dashboard.filter.apply')}
              </Button>
              <Button
                data-testid="date-filter-clear"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleClear}
              >
                {t('dashboard.filter.clear')}
              </Button>
            </div>
          </div>
          <PopoverPrimitive.Arrow className="fill-[var(--color-border)]" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
