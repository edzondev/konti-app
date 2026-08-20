import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/core/auth-client";
import { DocumentRow } from "@/features/documents/components/document-row";
import { groupDocumentsByDay } from "@/features/documents/group-documents-by-day";
import type { DocumentListItem } from "@/features/documents/types";
import { useDocuments } from "@/features/documents/use-documents";
import { useProcessUploaded } from "@/features/documents/use-process-uploaded";

const TAB_BAR_HEIGHT = 74;

type DocumentListEntry =
	| { type: "header"; id: string; title: string }
	| { type: "document"; id: string; document: DocumentListItem };

export default function ComprobantesTabScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const documentsQuery = useDocuments(session?.user.id ?? "");
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isRefetching, refetch } =
		documentsQuery;
	const bottomSpace = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 24;
	const documents = useMemo(() => data?.pages.flatMap((page) => page.items), [data]);
	useProcessUploaded(documents);
	const entries = useMemo(() => {
		return groupDocumentsByDay(documents ?? []).flatMap((group) => [
			{
				type: "header" as const,
				id: `header-${group.items[0]?.id ?? group.title}`,
				title: group.title,
			},
			...group.items.map((document) => ({
				type: "document" as const,
				id: document.id,
				document,
			})),
		]);
	}, [documents]);
	const handleDocumentPress = useCallback(
		(documentId: string) => {
			router.push(`/document/${documentId}`);
		},
		[router],
	);
	const handleRefresh = useCallback(() => {
		void refetch();
	}, [refetch]);
	const handleEndReached = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);
	const renderItem = useCallback(
		({ item }: { item: DocumentListEntry }) => {
			if (item.type === "header") {
				return <DayHeader title={item.title} />;
			}

			return <DocumentRow document={item.document} onPress={handleDocumentPress} />;
		},
		[handleDocumentPress],
	);
	const keyExtractor = useCallback((item: DocumentListEntry) => item.id, []);

	return (
		<View
			className="flex-1 bg-konti-bg px-5"
			style={{
				paddingTop: insets.top + 16,
				paddingBottom: bottomSpace,
			}}
		>
			<Text className="text-[28px] font-semibold tracking-tight text-konti-ivory">
				Comprobantes
			</Text>

			<FlashList
				className="flex-1"
				contentContainerStyle={{ paddingTop: 24 }}
				data={entries}
				keyExtractor={keyExtractor}
				ListEmptyComponent={<EmptyState />}
				onEndReached={handleEndReached}
				onEndReachedThreshold={0.5}
				refreshControl={
					<RefreshControl onRefresh={handleRefresh} refreshing={isRefetching} tintColor="#F4F0E8" />
				}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}

function DayHeader({ title }: { title: string }) {
	return (
		<Text className="mb-3 text-[13px] font-medium uppercase tracking-[1.5px] text-konti-ivory/50">
			{title}
		</Text>
	);
}

function EmptyState() {
	return (
		<View className="flex-1 items-center justify-center px-3">
			<Text className="text-center text-[15px] leading-[21px] text-konti-ivory/50">
				Aún no hay comprobantes.
			</Text>
		</View>
	);
}
