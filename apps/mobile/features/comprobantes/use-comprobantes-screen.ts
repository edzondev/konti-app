import { useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useResolveClassNames } from "uniwind";

import { triggerHaptic } from "@/core/haptics";
import { type Document } from "@/features/comprobantes/comprobantes-document";
import { shiftMonth, toListView } from "@/features/comprobantes/comprobantes-list";
import { resolveOpenDocument } from "@/features/comprobantes/open-document";
import { useDocuments } from "@/features/comprobantes/use-comprobantes";
import { currentLimaMonth } from "@/features/home/home-summary";

export function useComprobantesScreen() {
	const latestMonth = currentLimaMonth();
	const [month, setMonth] = useState(latestMonth);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [documentId, setDocumentId] = useState<string | null>(null);
	const [held, setHeld] = useState<Document | null>(null);
	const [editing, setEditing] = useState(false);
	const savedAt = useRef(0);
	const { height } = useWindowDimensions();
	const sheetBackground = useResolveClassNames("bg-konti-bg");
	const documentsQuery = useDocuments(month);

	const selectedDocument = resolveOpenDocument(
		documentId,
		held,
		documentsQuery.data,
		documentsQuery.dataUpdatedAt,
		savedAt.current,
	);
	const view = toListView(
		documentsQuery.data
			? { status: "success", documents: documentsQuery.data, month }
			: documentsQuery.isPending
				? { status: "pending", month }
				: documentsQuery.isError
					? { status: "error", month }
					: { status: "pending", month },
	);

	function goToPreviousMonth() {
		setMonth(shiftMonth(month, -1));
	}

	function goToNextMonth() {
		if (!view.canGoNext) return;
		setMonth(shiftMonth(month, 1));
	}

	function openPicker() {
		setPickerOpen(true);
	}

	function closePicker() {
		setPickerOpen(false);
	}

	function selectMonth(value: string) {
		setMonth(value);
		setPickerOpen(false);
	}

	function openDocument(id: string) {
		const doc = documentsQuery.data?.find((item) => item.id === id);
		if (!doc) return;
		void triggerHaptic("selection");
		savedAt.current = 0;
		setHeld(doc);
		setEditing(false);
		setDocumentId(id);
	}

	function closeDocument() {
		savedAt.current = 0;
		setHeld(null);
		setDocumentId(null);
		setEditing(false);
	}

	function startEditing() {
		setEditing(true);
	}

	function stopEditing(updated?: Document) {
		if (updated?.id) {
			savedAt.current = Date.now();
			setHeld(updated);
		}
		setEditing(false);
	}

	function onRefresh() {
		void documentsQuery.refetch();
	}

	return {
		view,
		month,
		pickerOpen,
		selectedDocument,
		editing,
		height,
		sheetBackground,
		refreshing: documentsQuery.isRefetching,
		onRefresh,
		goToPreviousMonth,
		goToNextMonth,
		openPicker,
		closePicker,
		selectMonth,
		openDocument,
		closeDocument,
		startEditing,
		stopEditing,
	};
}
