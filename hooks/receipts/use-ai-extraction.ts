import { useMutation } from "@tanstack/react-query";
import { getReceiptDataByAi } from "@/services/receipts";
import { AiExtractionResponse } from "@/types/ai-extraction.types";

export function useAiExtraction() {
  return useMutation<AiExtractionResponse, Error, string>({
    mutationFn: (imageUrl: string) => getReceiptDataByAi(imageUrl),
    onError: (error) => {
      console.error("Error extracting data with AI:", error);
    },
  });
}
