import { useState } from "react";
import { FiltersType } from "@/types/receipt.type";

export default function useFilterReceipt() {
  const [filters, setFilters] = useState<FiltersType>({
    sortBy: "date_desc",
  });

  const handleFilterChange = (filterType: "all" | "expense" | "nonExpense") => {
    if (filterType === "all") {
      setFilters((prev) => ({ ...prev, isExpense: undefined }));
    } else if (filterType === "expense") {
      setFilters((prev) => ({ ...prev, isExpense: true }));
    } else if (filterType === "nonExpense") {
      setFilters((prev) => ({ ...prev, isExpense: false }));
    }
  };

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortBy: prev.sortBy === "date_desc" ? "date_asc" : "date_desc",
    }));
  };

  const getCurrentFilterType = () => {
    if (filters.isExpense === undefined) return "all";
    if (filters.isExpense === true) return "expense";
    return "nonExpense";
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
