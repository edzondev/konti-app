import { useMutation, useQueryClient } from "@tanstack/react-query";

import { homeKeys } from "@/features/home/home.queries";

import { completeDocumentUpload } from "./documents.api";
import { documentKeys } from "./documents.queries";

export function useCompleteDocumentUpload() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: completeDocumentUpload,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: homeKeys.all }),
				queryClient.invalidateQueries({ queryKey: documentKeys.all }),
			]),
	});
}
