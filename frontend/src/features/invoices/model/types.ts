export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientEmail: string | null;
  issueDate: string;
  dueDate: string;
  taxRate: string;
  lines: InvoiceLine[];
  subtotal: string;
  total: string;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendEmailResponse {
  lastSentAt: string;
}
