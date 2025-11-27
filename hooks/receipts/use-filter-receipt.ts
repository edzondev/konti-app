import { useState } from 'react';
import { FiltersType } from '@/types/receipt.type';

export type FilterType =
  | 'all'
  | 'expense'
  | 'nonExpense'
  | 'boleta'
  | 'factura';

export default function useFilterReceipt() {
  const [filters, setFilters] = useState<FiltersType>({
    sortBy: 'date_desc',
  });
  const [searchText, setSearchText] = useState('');

  const handleFilterChange = (filterType: FilterType) => {
    if (filterType === 'all') {
      setFilters((prev) => ({
        ...prev,
        isExpense: undefined,
        receiptType: undefined,
      }));
    } else if (filterType === 'expense') {
      setFilters((prev) => ({
        ...prev,
        isExpense: true,
        receiptType: undefined,
      }));
    } else if (filterType === 'nonExpense') {
      setFilters((prev) => ({
        ...prev,
        isExpense: false,
        receiptType: undefined,
      }));
    } else if (filterType === 'boleta' || filterType === 'factura') {
      setFilters((prev) => ({
        ...prev,
        isExpense: undefined,
        receiptType: filterType,
      }));
    }
  };

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortBy: prev.sortBy === 'date_desc' ? 'date_asc' : 'date_desc',
    }));
  };

  const getCurrentFilterType = (): FilterType => {
    if (filters.receiptType === 'boleta') return 'boleta';
    if (filters.receiptType === 'factura') return 'factura';
    if (filters.isExpense === true) return 'expense';
    if (filters.isExpense === false) return 'nonExpense';
    return 'all';
  };

  const handleSearchChange = (search: string) => {
    setSearchText(search);
    setFilters((prev) => ({ ...prev, search: search.trim() || undefined }));
  };

  const clearSearch = () => {
    setSearchText('');
    setFilters((prev) => ({ ...prev, search: undefined }));
  };

  return {
    filters,
    searchText,
    handleFilterChange,
    toggleSortOrder,
    getCurrentFilterType,
    handleSearchChange,
    clearSearch,
  };
}
