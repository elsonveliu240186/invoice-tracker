export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  // Per-client company profile (your billing entity for this client)
  companyName: string;
  companyAddress: string;
  companyVatNumber: string;
  companyIban: string;
  companySwiftBic: string;
  companyBankName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ClientPage {
  content: Client[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateClient {
  name: string;
  email: string;
  phone?: string | undefined;
  address?: string | undefined;
  companyName?: string | undefined;
  companyAddress?: string | undefined;
  companyVatNumber?: string | undefined;
  companyIban?: string | undefined;
  companySwiftBic?: string | undefined;
  companyBankName?: string | undefined;
}

export interface UpdateClient {
  name: string;
  email: string;
  phone?: string | undefined;
  address?: string | undefined;
  companyName?: string | undefined;
  companyAddress?: string | undefined;
  companyVatNumber?: string | undefined;
  companyIban?: string | undefined;
  companySwiftBic?: string | undefined;
  companyBankName?: string | undefined;
}

export interface ClientQuery {
  query?: string | undefined;
  page?: number | undefined;
  size?: number | undefined;
  sort?: string | undefined;
}
