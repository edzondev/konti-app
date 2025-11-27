import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getDeductionLimitStatus,
  getSuspectReceipts,
  getDeductionsByCategory,
  getAnnualSummary,
} from '@/services/classification';
import { QUERY_KEYS } from '@/constants/query-keys';

export function useDeductionLimitStatus(year?: number) {
  const { session } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.DEDUCTION_LIMIT, session?.user.id, year],
    queryFn: () => {
      if (!session?.user.id) return null;
      return getDeductionLimitStatus(session.user.id, year);
    },
    enabled: !!session?.user.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSuspectReceipts() {
  const { session } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.SUSPECT_RECEIPTS, session?.user.id],
    queryFn: () => {
      if (!session?.user.id) return [];
      return getSuspectReceipts(session.user.id);
    },
    enabled: !!session?.user.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeductionsByCategory(year?: number) {
  const { session } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.DEDUCTIONS_BY_CATEGORY, session?.user.id, year],
    queryFn: () => {
      if (!session?.user.id) return [];
      return getDeductionsByCategory(session.user.id, year);
    },
    enabled: !!session?.user.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnnualSummary(year?: number) {
  const { session } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.ANNUAL_SUMMARY, session?.user.id, year],
    queryFn: () => {
      if (!session?.user.id) return null;
      return getAnnualSummary(session.user.id, year);
    },
    enabled: !!session?.user.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDashboardStats(year?: number) {
  const limitStatus = useDeductionLimitStatus(year);
  const suspectReceipts = useSuspectReceipts();
  const categories = useDeductionsByCategory(year);
  const annualSummary = useAnnualSummary(year);

  return {
    limitStatus: limitStatus.data,
    suspectReceipts: suspectReceipts.data || [],
    categories: categories.data || [],
    annualSummary: annualSummary.data,
    isLoading:
      limitStatus.isLoading ||
      suspectReceipts.isLoading ||
      categories.isLoading ||
      annualSummary.isLoading,
    isError:
      limitStatus.isError ||
      suspectReceipts.isError ||
      categories.isError ||
      annualSummary.isError,
    refetch: () => {
      limitStatus.refetch();
      suspectReceipts.refetch();
      categories.refetch();
      annualSummary.refetch();
    },
  };
}
