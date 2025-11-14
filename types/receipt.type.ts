export type FiltersType = {
  isExpense?: boolean;
  receiptType?: 'boleta' | 'factura';
  sortBy?: 'date_asc' | 'date_desc';
  search?: string;
};

export type ReceiptKpis = {
  total_receipts: number;
  expense_receipts: number;
  total_amount_sum: number;
};
