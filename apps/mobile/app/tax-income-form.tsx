import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { authClient } from "@/core/auth-client";
import { TaxIncomeForm } from "@/features/tax-income/components/tax-income-form";
import { taxIncomeDetailQueryOptions } from "@/features/tax-income/tax-income.queries";
import { taxIncomeFormDefaults } from "@/features/tax-income/tax-income-form.helpers";

export default function TaxIncomeFormScreen() {
	const params = useLocalSearchParams<{
		id?: string;
		documentId?: string;
		issueDate?: string;
		paymentDate?: string;
		grossAmount?: string;
		withheldTaxAmount?: string;
		payerName?: string;
	}>();
	const { data: session } = authClient.useSession();
	const recordId = stringParam(params.id);
	const documentId = stringParam(params.documentId);
	const recordQuery = useQuery(taxIncomeDetailQueryOptions(session?.user.id ?? "", recordId ?? ""));

	if (recordId && recordQuery.isPending) {
		return <ScreenState message="Cargando ingreso…" />;
	}
	if (recordId && (recordQuery.isError || !recordQuery.data)) {
		return <ScreenState message="No pudimos cargar este ingreso." />;
	}

	const record = recordQuery.data;
	const initialValues = record
		? taxIncomeFormDefaults({
				paymentDate: record.receivedAt,
				grossAmount: record.grossAmount,
				withheldTaxAmount: record.withheldTaxAmount,
				payerName: record.payerName,
				notes: record.notes,
			})
		: taxIncomeFormDefaults({
				paymentDate: stringParam(params.paymentDate),
				issueDate: stringParam(params.issueDate),
				grossAmount: stringParam(params.grossAmount),
				withheldTaxAmount:
					stringParam(params.withheldTaxAmount) ?? (documentId ? undefined : "0.00"),
				payerName: stringParam(params.payerName),
			});

	return (
		<TaxIncomeForm
			documentId={documentId}
			initialValues={initialValues}
			issueDate={stringParam(params.issueDate)}
			recordId={recordId}
			userId={session?.user.id ?? ""}
		/>
	);
}

function stringParam(value: string | string[] | undefined): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function ScreenState({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center bg-konti-bg px-6">
			<Text className="text-center text-[15px] text-konti-ivory/50">{message}</Text>
		</View>
	);
}
