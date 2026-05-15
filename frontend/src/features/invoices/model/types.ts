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
  status: 'DRAFT' | 'SENT' | 'PAID';
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendEmailResponse {
  lastSentAt: string;
}

export interface InvoicePage {
  content: Invoice[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
