export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface DashboardStats {
  totalInvoices: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  revenueByMonth: MonthlyRevenue[];
}
