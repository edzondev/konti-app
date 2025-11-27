import { renderHook, act } from '@testing-library/react-native';
import useFilterReceipt from '@/hooks/receipts/use-filter-receipt';

describe('useFilterReceipt', () => {
  describe('initial state', () => {
    it('should initialize with default filter values', () => {
      const { result } = renderHook(() => useFilterReceipt());

      expect(result.current.filters).toEqual({
        sortBy: 'date_desc',
      });
      expect(result.current.searchText).toBe('');
      expect(result.current.getCurrentFilterType()).toBe('all');
    });
  });

  describe('handleFilterChange', () => {
    it('should set filter to "all" and clear isExpense and receiptType', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('expense');
      });

      act(() => {
        result.current.handleFilterChange('all');
      });

      expect(result.current.filters.isExpense).toBeUndefined();
      expect(result.current.filters.receiptType).toBeUndefined();
      expect(result.current.getCurrentFilterType()).toBe('all');
    });

    it('should set filter to "expense" with isExpense true', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('expense');
      });

      expect(result.current.filters.isExpense).toBe(true);
      expect(result.current.filters.receiptType).toBeUndefined();
      expect(result.current.getCurrentFilterType()).toBe('expense');
    });

    it('should set filter to "nonExpense" with isExpense false', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('nonExpense');
      });

      expect(result.current.filters.isExpense).toBe(false);
      expect(result.current.filters.receiptType).toBeUndefined();
      expect(result.current.getCurrentFilterType()).toBe('nonExpense');
    });

    it('should set filter to "boleta" receiptType', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('boleta');
      });

      expect(result.current.filters.receiptType).toBe('boleta');
      expect(result.current.filters.isExpense).toBeUndefined();
      expect(result.current.getCurrentFilterType()).toBe('boleta');
    });

    it('should set filter to "factura" receiptType', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('factura');
      });

      expect(result.current.filters.receiptType).toBe('factura');
      expect(result.current.filters.isExpense).toBeUndefined();
      expect(result.current.getCurrentFilterType()).toBe('factura');
    });

    it('should clear previous filter when switching filter types', () => {
      const { result } = renderHook(() => useFilterReceipt());

      // Set expense filter
      act(() => {
        result.current.handleFilterChange('expense');
      });
      expect(result.current.filters.isExpense).toBe(true);

      // Switch to boleta filter - should clear isExpense
      act(() => {
        result.current.handleFilterChange('boleta');
      });
      expect(result.current.filters.isExpense).toBeUndefined();
      expect(result.current.filters.receiptType).toBe('boleta');
    });
  });

  describe('toggleSortOrder', () => {
    it('should toggle from date_desc to date_asc', () => {
      const { result } = renderHook(() => useFilterReceipt());

      expect(result.current.filters.sortBy).toBe('date_desc');

      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.filters.sortBy).toBe('date_asc');
    });

    it('should toggle from date_asc back to date_desc', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.toggleSortOrder();
      });
      expect(result.current.filters.sortBy).toBe('date_asc');

      act(() => {
        result.current.toggleSortOrder();
      });
      expect(result.current.filters.sortBy).toBe('date_desc');
    });

    it('should preserve other filters when toggling sort', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('expense');
        result.current.handleSearchChange('test search');
      });

      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.filters.isExpense).toBe(true);
      expect(result.current.filters.search).toBe('test search');
      expect(result.current.filters.sortBy).toBe('date_asc');
    });
  });

  describe('handleSearchChange', () => {
    it('should update search text and filters', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleSearchChange('empresa test');
      });

      expect(result.current.searchText).toBe('empresa test');
      expect(result.current.filters.search).toBe('empresa test');
    });

    it('should trim search text in filters', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleSearchChange('  search with spaces  ');
      });

      expect(result.current.searchText).toBe('  search with spaces  ');
      expect(result.current.filters.search).toBe('search with spaces');
    });

    it('should set search to undefined when empty or whitespace only', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleSearchChange('some text');
      });
      expect(result.current.filters.search).toBe('some text');

      act(() => {
        result.current.handleSearchChange('');
      });
      expect(result.current.filters.search).toBeUndefined();

      act(() => {
        result.current.handleSearchChange('   ');
      });
      expect(result.current.filters.search).toBeUndefined();
    });
  });

  describe('clearSearch', () => {
    it('should clear search text and filter', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleSearchChange('test search');
      });

      expect(result.current.searchText).toBe('test search');
      expect(result.current.filters.search).toBe('test search');

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchText).toBe('');
      expect(result.current.filters.search).toBeUndefined();
    });

    it('should preserve other filters when clearing search', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('expense');
        result.current.handleSearchChange('test');
      });

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.filters.isExpense).toBe(true);
      expect(result.current.filters.search).toBeUndefined();
    });
  });

  describe('getCurrentFilterType', () => {
    it('should return "all" when no specific filter is set', () => {
      const { result } = renderHook(() => useFilterReceipt());

      expect(result.current.getCurrentFilterType()).toBe('all');
    });

    it('should return "boleta" when receiptType is boleta', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('boleta');
      });

      expect(result.current.getCurrentFilterType()).toBe('boleta');
    });

    it('should return "factura" when receiptType is factura', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('factura');
      });

      expect(result.current.getCurrentFilterType()).toBe('factura');
    });

    it('should return "expense" when isExpense is true', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('expense');
      });

      expect(result.current.getCurrentFilterType()).toBe('expense');
    });

    it('should return "nonExpense" when isExpense is false', () => {
      const { result } = renderHook(() => useFilterReceipt());

      act(() => {
        result.current.handleFilterChange('nonExpense');
      });

      expect(result.current.getCurrentFilterType()).toBe('nonExpense');
    });
  });

  describe('combined operations', () => {
    it('should handle multiple filter changes correctly', () => {
      const { result } = renderHook(() => useFilterReceipt());

      // Apply expense filter
      act(() => {
        result.current.handleFilterChange('expense');
      });

      // Add search
      act(() => {
        result.current.handleSearchChange('empresa');
      });

      // Toggle sort
      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.filters).toEqual({
        sortBy: 'date_asc',
        isExpense: true,
        receiptType: undefined,
        search: 'empresa',
      });

      // Change to factura filter
      act(() => {
        result.current.handleFilterChange('factura');
      });

      expect(result.current.filters).toEqual({
        sortBy: 'date_asc',
        isExpense: undefined,
        receiptType: 'factura',
        search: 'empresa',
      });
    });
  });
});
