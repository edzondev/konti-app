import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { generateAnnualReport } from '@/services/classification';
import type { AnnualReportResponse } from '@/types/ai-extraction.types';

interface UseAnnualReportReturn {
  generateReport: (year?: number) => Promise<AnnualReportResponse>;
  isGenerating: boolean;
  lastReport: AnnualReportResponse['data'] | null;
  error: string | null;
}

export function useAnnualReport(): UseAnnualReportReturn {
  const { session } = useAuth();

  const mutation = useMutation({
    mutationFn: async (year?: number) => {
      if (!session?.user.id) {
        throw new Error('User not authenticated');
      }
      return generateAnnualReport(session.user.id, year);
    },
  });

  return {
    generateReport: async (year?: number) => {
      const result = await mutation.mutateAsync(year);
      return result;
    },
    isGenerating: mutation.isPending,
    lastReport: mutation.data?.data || null,
    error:
      mutation.data?.error ||
      (mutation.error instanceof Error ? mutation.error.message : null),
  };
}
