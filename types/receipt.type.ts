export type FiltersType = {
  isExpense?: boolean; // true for accounting (contables), false for non-accounting (no contables)
  sortBy?: "date_asc" | "date_desc"; // Sort by date ascending or descending
  search?: string; // Search by business name, RUC, or receipt number
};

export type ReceiptKpis = {
  total_receipts: number;
  expense_receipts: number;
  total_amount_sum: number;
};
