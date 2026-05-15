import { httpRaw } from '@/shared/lib/http';

const BASE = '/api/v1/invoices';

async function triggerDownload(url: string, filename: string): Promise<void> {
  const response = await httpRaw(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function downloadInvoiceDocx(id: string, invoiceNumber: string): Promise<void> {
  return triggerDownload(`${BASE}/${id}/docx`, `invoice-${invoiceNumber}.docx`);
}

export async function downloadInvoicePdf(id: string, invoiceNumber: string): Promise<void> {
  return triggerDownload(`${BASE}/${id}/pdf`, `invoice-${invoiceNumber}.pdf`);
}
