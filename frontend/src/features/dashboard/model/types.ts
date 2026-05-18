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

export interface MonthlyExpense {
  month: string;
  total: string;
}

export interface CategoryExpense {
  category: string;
  total: string;
  count: number;
}

export interface DashboardExpenseStats {
  from: string;
  to: string;
  grandTotal: string;
  expenseByMonth: MonthlyExpense[];
  expenseByCategory: CategoryExpense[];
}
