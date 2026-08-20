import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { processDocument } from "./documents.api";
import { documentKeys } from "./documents.queries";
import type { DocumentListItem } from "./types";

let drained = false;

export function uploadedIdsToProcess(
	items: DocumentListItem[] | undefined,
	alreadyDrained: boolean,
): { nextDrained: boolean; ids: string[] } {
	if (alreadyDrained || items === undefined) {
		return { nextDrained: alreadyDrained, ids: [] };
	}

	return {
		nextDrained: true,
		ids: items.filter((item) => item.status === "uploaded").map((item) => item.id),
	};
}

export function useProcessUploaded(items: DocumentListItem[] | undefined) {
	const queryClient = useQueryClient();

	useEffect(() => {
		const { nextDrained, ids } = uploadedIdsToProcess(items, drained);
		drained = nextDrained;
		if (ids.length === 0) {
			return;
		}

		void Promise.allSettled(ids.map((id) => processDocument(id))).finally(() => {
			void queryClient.invalidateQueries({ queryKey: documentKeys.all });
		});
	}, [items, queryClient]);
}
