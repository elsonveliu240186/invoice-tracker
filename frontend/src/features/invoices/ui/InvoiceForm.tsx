import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import {
  invoiceFormSchema,
  type InvoiceFormValues,
  type InvoiceLineFormValues,
} from '../model/schema';
import type { Invoice } from '../model/types';
import { ApiError } from '@/shared/lib/http';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useClients } from '@/features/clients/api/useClients';

interface InvoiceFormProps {
  initial?: Invoice | undefined;
  nextNumber?: string | undefined;
  onSubmit: (data: InvoiceFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string | undefined;
}

type LineErrors = Partial<Record<keyof InvoiceLineFormValues, string>>;

interface FormErrors {
  clientId?: string | undefined;
  number?: string | undefined;
  issueDate?: string | undefined;
  dueDate?: string | undefined;
  taxRate?: string | undefined;
  lines?: string | undefined;
  lineErrors?: LineErrors[];
}

function emptyLine(): InvoiceLineFormValues {
  return { description: '', quantity: 1, unitPrice: 0 };
}

export function InvoiceForm({
  initial,
  nextNumber,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: InvoiceFormProps) {
  const { t } = useTranslation();
  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [number, setNumber] = useState(initial?.number ?? '');
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [taxRate, setTaxRate] = useState(
    initial ? (parseFloat(initial.taxRate) * 100).toString() : '0',
  );
  const [lines, setLines] = useState<InvoiceLineFormValues[]>(
    initial && initial.lines.length > 0
      ? initial.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: parseFloat(l.unitPrice),
        }))
      : [emptyLine()],
  );
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: clientsData } = useClients({ size: 50 });

  const filteredClients = (clientsData?.content ?? []).filter(
    (c) =>
      !clientSearch ||
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  const selectedClient = (clientsData?.content ?? []).find((c) => c.id === clientId);

  const handleSelectClient = useCallback(
    (id: string) => {
      setClientId(id);
      const client = (clientsData?.content ?? []).find((c) => c.id === id);
      if (client) {
        setClientSearch(client.name);
      }
      setShowClientDropdown(false);
      setFieldErrors((prev) => ({ ...prev, clientId: undefined }));
    },
    [clientsData],
  );

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof InvoiceLineFormValues, value: string | number) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const taxRateDecimal = parseFloat(taxRate) / 100 || 0;
  const taxAmount = subtotal * taxRateDecimal;
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formValues = {
      clientId,
      number: number.trim() || undefined,
      issueDate,
      dueDate,
      taxRate: taxRateDecimal,
      lines,
    };

    const result = invoiceFormSchema.safeParse(formValues);
    if (!result.success) {
      const errors: FormErrors = {};
      const lineErrors: LineErrors[] = lines.map(() => ({}));
      for (const issue of result.error.issues) {
        const path = issue.path;
        if (path[0] === 'lines' && typeof path[1] === 'number' && path[2]) {
          const lineIdx = path[1];
          const field = path[2] as keyof InvoiceLineFormValues;
          if (!lineErrors[lineIdx]) lineErrors[lineIdx] = {};
          lineErrors[lineIdx][field] = issue.message;
        } else if (path[0] === 'lines' && path.length === 1) {
          errors.lines = issue.message;
        } else if (path[0] === 'clientId') {
          errors.clientId = issue.message;
        } else if (path[0] === 'number') {
          errors.number = issue.message;
        } else if (path[0] === 'issueDate') {
          errors.issueDate = issue.message;
        } else if (path[0] === 'dueDate') {
          errors.dueDate = issue.message;
        } else if (path[0] === 'taxRate') {
          errors.taxRate = issue.message;
        }
      }
      errors.lineErrors = lineErrors;
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(result.data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVOICE_NUMBER_TAKEN') {
          setFieldErrors((prev) => ({ ...prev, number: t('invoices.form.errors.numberTaken') }));
        } else {
          setServerError(err.detail ?? err.message);
        }
      } else {
        setServerError(t('invoices.form.errors.unexpected'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      noValidate
      data-testid="invoice-form"
    >
      {serverError && (
        <p
          role="alert"
          className="mb-4 rounded bg-[var(--color-destructive)]/10 px-3 py-2 text-sm text-[var(--color-destructive)]"
        >
          {serverError}
        </p>
      )}

      {/* Client */}
      <div className="mb-4">
        <label
          htmlFor="invoice-client"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          {t('invoices.form.client')}{' '}
          <span className="text-[var(--color-destructive)]" aria-hidden="true">
            *
          </span>
        </label>
        <div className="relative">
          <Input
            id="invoice-client"
            type="text"
            placeholder={t('invoices.form.clientPlaceholder')}
            value={clientSearch || selectedClient?.name || ''}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setShowClientDropdown(true);
              if (!e.target.value) setClientId('');
            }}
            onFocus={() => setShowClientDropdown(true)}
            onBlur={() => setTimeout(() => setShowClientDropdown(false), 150)}
            aria-describedby={fieldErrors.clientId ? 'client-error' : undefined}
            aria-invalid={!!fieldErrors.clientId}
            data-testid="input-client-search"
            autoComplete="off"
          />
          {showClientDropdown && filteredClients.length > 0 && (
            <ul
              className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded border border-[var(--color-border)] bg-[var(--color-background)] shadow-md"
              data-testid="client-dropdown"
            >
              {filteredClients.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-accent)]"
                    onMouseDown={() => handleSelectClient(c.id)}
                    data-testid={`client-option-${c.id}`}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                      {c.email}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {fieldErrors.clientId && (
          <p
            id="client-error"
            role="alert"
            className="mt-1 text-xs text-[var(--color-destructive)]"
          >
            {fieldErrors.clientId}
          </p>
        )}
      </div>

      {/* Invoice number */}
      <div className="mb-4">
        <label
          htmlFor="invoice-number"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          {t('invoices.form.number')}
        </label>
        <Input
          id="invoice-number"
          type="text"
          placeholder={nextNumber ?? t('invoices.form.numberPlaceholder')}
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            setFieldErrors((prev) => ({ ...prev, number: undefined }));
          }}
          aria-describedby={fieldErrors.number ? 'number-error' : undefined}
          aria-invalid={!!fieldErrors.number}
          data-testid="input-number"
        />
        {fieldErrors.number && (
          <p
            id="number-error"
            role="alert"
            className="mt-1 text-xs text-[var(--color-destructive)]"
          >
            {fieldErrors.number}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="invoice-issue-date"
            className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
          >
            {t('invoices.form.issueDate')}{' '}
            <span className="text-[var(--color-destructive)]" aria-hidden="true">
              *
            </span>
          </label>
          <Input
            id="invoice-issue-date"
            type="date"
            value={issueDate}
            onChange={(e) => {
              setIssueDate(e.target.value);
              setFieldErrors((prev) => ({ ...prev, issueDate: undefined }));
            }}
            aria-describedby={fieldErrors.issueDate ? 'issue-date-error' : undefined}
            aria-invalid={!!fieldErrors.issueDate}
            data-testid="input-issue-date"
          />
          {fieldErrors.issueDate && (
            <p
              id="issue-date-error"
              role="alert"
              className="mt-1 text-xs text-[var(--color-destructive)]"
            >
              {fieldErrors.issueDate}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label
            htmlFor="invoice-due-date"
            className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
          >
            {t('invoices.form.dueDate')}{' '}
            <span className="text-[var(--color-destructive)]" aria-hidden="true">
              *
            </span>
          </label>
          <Input
            id="invoice-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              setFieldErrors((prev) => ({ ...prev, dueDate: undefined }));
            }}
            aria-describedby={fieldErrors.dueDate ? 'due-date-error' : undefined}
            aria-invalid={!!fieldErrors.dueDate}
            data-testid="input-due-date"
          />
          {fieldErrors.dueDate && (
            <p
              id="due-date-error"
              role="alert"
              className="mt-1 text-xs text-[var(--color-destructive)]"
            >
              {fieldErrors.dueDate}
            </p>
          )}
        </div>
      </div>

      {/* Tax rate */}
      <div className="mb-4">
        <label
          htmlFor="invoice-tax-rate"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          {t('invoices.form.taxRate')} (%)
        </label>
        <Input
          id="invoice-tax-rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={taxRate}
          onChange={(e) => {
            setTaxRate(e.target.value);
            setFieldErrors((prev) => ({ ...prev, taxRate: undefined }));
          }}
          aria-describedby={fieldErrors.taxRate ? 'tax-rate-error' : undefined}
          aria-invalid={!!fieldErrors.taxRate}
          data-testid="input-tax-rate"
        />
        {fieldErrors.taxRate && (
          <p
            id="tax-rate-error"
            role="alert"
            className="mt-1 text-xs text-[var(--color-destructive)]"
          >
            {fieldErrors.taxRate}
          </p>
        )}
      </div>

      {/* Line items */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-foreground)]">
            {t('invoices.form.lineItems')}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            data-testid="btn-add-line"
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t('invoices.form.addLine')}
          </Button>
        </div>

        {/* v8 ignore next 4 */}
        {fieldErrors.lines && (
          <p role="alert" className="mb-2 text-xs text-[var(--color-destructive)]">
            {fieldErrors.lines}
          </p>
        )}

        <div className="space-y-2" data-testid="line-items-container">
          {lines.map((line, index) => {
            const lineErr = fieldErrors.lineErrors?.[index];
            return (
              <div
                key={index}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start"
                data-testid={`line-item-${index}`}
              >
                <div>
                  <Input
                    type="text"
                    placeholder={t('invoices.form.lineDescription')}
                    value={line.description}
                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                    aria-label={`Line ${index + 1} description`}
                    aria-invalid={!!lineErr?.description}
                    data-testid={`input-line-description-${index}`}
                  />
                  {lineErr?.description && (
                    <p role="alert" className="mt-0.5 text-xs text-[var(--color-destructive)]">
                      {lineErr.description}
                    </p>
                  )}
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 1)}
                    aria-label={`Line ${index + 1} quantity`}
                    aria-invalid={!!lineErr?.quantity}
                    data-testid={`input-line-quantity-${index}`}
                  />
                  {lineErr?.quantity && (
                    <p role="alert" className="mt-0.5 text-xs text-[var(--color-destructive)]">
                      {lineErr.quantity}
                    </p>
                  )}
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit price"
                    value={line.unitPrice}
                    onChange={(e) =>
                      updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                    aria-label={`Line ${index + 1} unit price`}
                    aria-invalid={!!lineErr?.unitPrice}
                    data-testid={`input-line-unit-price-${index}`}
                  />
                  {lineErr?.unitPrice && (
                    <p role="alert" className="mt-0.5 text-xs text-[var(--color-destructive)]">
                      {lineErr.unitPrice}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                  aria-label={`Remove line ${index + 1}`}
                  data-testid={`btn-remove-line-${index}`}
                >
                  <Trash2 className="h-4 w-4 text-[var(--color-destructive)]" aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals */}
      <div
        className="mb-6 rounded border border-[var(--color-border)] p-3 text-sm"
        data-testid="invoice-totals"
      >
        <div className="flex justify-between">
          <span className="text-[var(--color-muted-foreground)]">
            {t('invoices.totals.subtotal')}
          </span>
          <span data-testid="form-subtotal">${subtotal.toFixed(2)}</span>
        </div>
        {taxRateDecimal > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">
              {t('invoices.totals.tax')} ({(taxRateDecimal * 100).toFixed(0)}%)
            </span>
            <span data-testid="form-tax">${taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[var(--color-border)] pt-1 font-bold">
          <span>{t('invoices.totals.total')}</span>
          <span data-testid="form-total">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} data-testid="btn-cancel">
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={submitting} data-testid="btn-submit">
          {submitting ? t('common.saving') : submitLabel}
        </Button>
      </div>
    </form>
  );
}
