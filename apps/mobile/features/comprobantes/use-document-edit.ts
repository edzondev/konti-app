import { usePostHog } from "posthog-react-native";
import { useRef, useState } from "react";
import { type ScrollView } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as v from "valibot";

import { trackFeature } from "@/core/funnel-events";
import { triggerHaptic } from "@/core/haptics";
import { type Document, DocumentSchema } from "@/features/comprobantes/comprobantes-document";
import {
	type DocumentEditDraft,
	type DraftErrors,
	toEditDraft,
	toUpdatePayload,
	validateDraft,
} from "@/features/comprobantes/document-form";
import { useUpdateDocument } from "@/features/comprobantes/use-comprobantes";

export function useDocumentEdit(document: Document, onClose: (updated?: Document) => void) {
	const posthog = usePostHog();
	const posthogRef = useRef(posthog);
	posthogRef.current = posthog;
	const update = useUpdateDocument(document.id);
	const [draft, setDraft] = useState(() => toEditDraft(document));
	const [fieldErrors, setFieldErrors] = useState<DraftErrors>({});
	const [typesOpen, setTypesOpen] = useState(false);
	const [categoriesOpen, setCategoriesOpen] = useState(false);
	const scrollRef = useRef<ScrollView>(null);
	const footerFocused = useRef(false);
	const insets = useSafeAreaInsets();
	const keyboardHeight = useKeyboardState((state) => state.height);
	const paddingBottom = keyboardHeight > 0 ? keyboardHeight : insets.bottom;

	function focusFooterField() {
		footerFocused.current = true;
		scrollRef.current?.scrollToEnd({ animated: true });
	}

	function blurFooterField() {
		footerFocused.current = false;
	}

	function onLayout() {
		if (footerFocused.current) scrollRef.current?.scrollToEnd({ animated: true });
	}

	function onChange(key: keyof DocumentEditDraft, value: string) {
		if (update.isError) update.reset();
		setDraft((current) => ({ ...current, [key]: value }));
	}

	function onSave() {
		if (update.isPending) return;
		const errors = validateDraft(draft);
		if (Object.values(errors).some(Boolean)) {
			setFieldErrors(errors);
			void triggerHaptic("error");
			return;
		}
		setFieldErrors({});
		const payload = toUpdatePayload(document, draft);
		if (payload === null) {
			onClose();
			return;
		}
		update.mutate(payload, {
			onSuccess: (data) => {
				trackFeature(posthogRef.current, "document_edited");
				const parsed = v.safeParse(DocumentSchema, data);
				void triggerHaptic("success");
				onClose(parsed.success ? parsed.output : undefined);
			},
			onError: () => {
				void triggerHaptic("error");
			},
		});
	}

	function onToggleTypes() {
		setTypesOpen((open) => !open);
	}

	function onPickType(value: DocumentEditDraft["documentType"]) {
		void triggerHaptic("selection");
		onChange("documentType", value);
		setTypesOpen(false);
	}

	function onToggleCategories() {
		setCategoriesOpen((open) => !open);
	}

	function onPickCategory(value: Document["category"]) {
		void triggerHaptic("selection");
		onChange("category", value);
		setCategoriesOpen(false);
	}

	return {
		draft,
		fieldErrors,
		typesOpen,
		categoriesOpen,
		paddingBottom,
		scrollRef,
		isPending: update.isPending,
		isError: update.isError,
		onChange,
		focusFooterField,
		blurFooterField,
		onToggleTypes,
		onPickType,
		onToggleCategories,
		onPickCategory,
		onLayout,
		onSave,
	};
}
