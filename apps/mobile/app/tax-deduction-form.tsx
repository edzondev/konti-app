import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { authClient } from "@/core/auth-client";
import { TaxDeductionForm } from "@/features/tax-deduction/components/tax-deduction-form";
import { taxDeductionCollectionQueryOptions } from "@/features/tax-deduction/tax-deduction-queries";
import type { TaxDeductionCategory, TaxDeductionRecord } from "@/features/tax-deduction/types";

const CATEGORY_VALUES = new Set<TaxDeductionCategory>([
	"restaurants_hotels",
	"medical_dental_services",
	"other_fourth_services",
	"rent",
	"household_worker_essalud",
]);

export default function TaxDeductionFormScreen() {
	const params = useLocalSearchParams<{
		category?: string;
		deductionId?: string;
		sourceDocumentId?: string;
		grossAmountPen?: string;
	}>();
	const { data: session } = authClient.useSession();
	const defaultCategory = parseCategory(params.category);
	const sourceDocumentId = singleParam(params.sourceDocumentId);
	const prefillGrossAmountPen = singleParam(params.grossAmountPen);
	const initialDeductionId = singleParam(params.deductionId);
	const [selectedId, setSelectedId] = useState<string | null>(initialDeductionId);
	const query = useQuery(taxDeductionCollectionQueryOptions(session?.user.id ?? "", 2026));

	if (query.isPending) {
		return <ScreenState message="Preparando tus gastos registrados…" />;
	}
	if (query.isError || !query.data) {
		return (
			<ScreenState
				message="No pudimos cargar tus deducciones. Tus datos no se modificaron."
				onRetry={() => void query.refetch()}
			/>
		);
	}

	const selectedRecord = query.data.records.find((record) => record.id === selectedId) ?? null;
	return (
		<>
			<NativeHeader />
			<TaxDeductionForm
				collection={query.data}
				defaultCategory={defaultCategory}
				onCreateNew={() => setSelectedId(null)}
				onSelectRecord={(record: TaxDeductionRecord) => setSelectedId(record.id)}
				selectedRecord={selectedRecord}
				prefillGrossAmountPen={prefillGrossAmountPen}
				sourceDocumentId={sourceDocumentId}
				userId={session?.user.id ?? ""}
			/>
		</>
	);
}

function NativeHeader() {
	return (
		<Stack.Screen
			options={{
				headerShown: true,
				headerBackButtonDisplayMode: "minimal",
				headerShadowVisible: false,
				headerStyle: { backgroundColor: "#151412" },
				headerTintColor: "#EDE9E2",
				title: "Gastos que pueden ayudarte",
			}}
		/>
	);
}

function ScreenState({ message, onRetry }: { message: string; onRetry?: () => void }) {
	return (
		<>
			<NativeHeader />
			<View className="flex-1 items-center justify-center gap-4 bg-konti-bg px-6">
				<Text selectable className="text-center text-[15px] leading-6 text-konti-ivory/50">
					{message}
				</Text>
				{onRetry ? (
					<Pressable
						accessibilityRole="button"
						className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
						onPress={onRetry}
					>
						<Text className="font-medium text-konti-bg">Reintentar</Text>
					</Pressable>
				) : null}
			</View>
		</>
	);
}

function parseCategory(value: string | undefined): TaxDeductionCategory {
	const normalized = singleParam(value);
	return normalized && CATEGORY_VALUES.has(normalized as TaxDeductionCategory)
		? (normalized as TaxDeductionCategory)
		: "restaurants_hotels";
}

function singleParam(value: string | undefined): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}
