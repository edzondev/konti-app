import { useState } from 'react';
import { FiltersType } from '@/types/receipt.type';

export default function useFilterReceipt() {
  const [filters, setFilters] = useState<FiltersType>({
    sortBy: 'date_desc',
  });

  const handleFilterChange = (filterType: 'all' | 'expense' | 'nonExpense' | 'boleta' | 'factura') => {
    if (filterType === 'all') {
      setFilters((prev) => ({ ...prev, isExpense: undefined, receiptType: undefined }));
    } else if (filterType === 'expense') {
      setFilters((prev) => ({ ...prev, isExpense: true, receiptType: undefined }));
    } else if (filterType === 'nonExpense') {
      setFilters((prev) => ({ ...prev, isExpense: false, receiptType: undefined }));
    } else if (filterType === 'boleta' || filterType === 'factura') {
      setFilters((prev) => ({ ...prev, isExpense: undefined, receiptType: filterType }));
    }
  };

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortBy: prev.sortBy === 'date_desc' ? 'date_asc' : 'date_desc',
    }));
  };

  const getCurrentFilterType = () => {
    if (filters.receiptType === 'boleta') return 'boleta';
    if (filters.receiptType === 'factura') return 'factura';
    if (filters.isExpense === true) return 'expense';
    if (filters.isExpense === false) return 'nonExpense';
    return 'all';
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search.trim() || undefined }));
  };

  return {
    filters,
    handleFilterChange,
    toggleSortOrder,
    getCurrentFilterType,
    handleSearchChange,
  };
}
