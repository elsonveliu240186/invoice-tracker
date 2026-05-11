export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
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
}

export interface UpdateClient {
  name: string;
  email: string;
  phone?: string | undefined;
  address?: string | undefined;
}

export interface ClientQuery {
  query?: string | undefined;
  page?: number | undefined;
  size?: number | undefined;
  sort?: string | undefined;
}
