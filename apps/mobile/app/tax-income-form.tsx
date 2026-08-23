import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { authClient } from "@/core/auth-client";
import { EmploymentIncomeForm } from "@/features/tax-income/components/employment-income-form";
import { TaxIncomeForm } from "@/features/tax-income/components/tax-income-form";
import { employmentIncomeFormDefaults } from "@/features/tax-income/employment-form.validation";
import { taxIncomeDetailQueryOptions } from "@/features/tax-income/tax-income.queries";
import { taxIncomeFormDefaults } from "@/features/tax-income/tax-income-form.helpers";

export default function TaxIncomeFormScreen() {
	const params = useLocalSearchParams<{
		id?: string;
		incomeType?: string;
		documentId?: string;
		recordKind?: string;
		coverageStart?: string;
		coverageEnd?: string;
		coverageScope?: string;
		payerTaxId?: string;
		issueDate?: string;
		dueDate?: string;
		documentReportedPaymentDate?: string;
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
	const isEmployment = record?.incomeType === "employment" || params.incomeType === "employment";
	if (isEmployment) {
		const initialValues = employmentIncomeFormDefaults(
			record?.incomeType === "employment"
				? {
						recordKind:
							record.recordKind === "period" || record.recordKind === "year_to_date_snapshot"
								? record.recordKind
								: "",
						coverageStart: record.coverageStart ?? "",
						coverageEnd: record.coverageEnd ?? "",
						coverageScope: record.coverageScope ?? "",
						grossAmount: record.grossAmount,
						withheldTaxAmount: record.withheldTaxAmount,
						payerName: record.payerName ?? "",
						payerTaxId: record.payerTaxId ?? "",
						notes: record.notes ?? "",
					}
				: {
						recordKind: employmentRecordKindParam(params.recordKind),
						coverageStart: stringParam(params.coverageStart),
						coverageEnd: stringParam(params.coverageEnd),
						coverageScope: employmentCoverageScopeParam(params.coverageScope),
						grossAmount: stringParam(params.grossAmount),
						withheldTaxAmount: stringParam(params.withheldTaxAmount),
						payerName: stringParam(params.payerName),
						payerTaxId: stringParam(params.payerTaxId),
					},
		);
		return (
			<EmploymentIncomeForm
				coverageResolutionRequired={record?.calculationDisposition === "needs_resolution"}
				documentId={documentId}
				initialValues={initialValues}
				recordId={recordId}
				userId={session?.user.id ?? ""}
			/>
		);
	}
	const initialValues = record
		? taxIncomeFormDefaults({
				activityType:
					record.incomeType === "fourth_ordinary" || record.incomeType === "fourth_special"
						? record.incomeType
						: null,
				paymentDate: record.receivedAt ?? "",
				grossAmount: record.grossAmount,
				withheldTaxAmount: record.withheldTaxAmount,
				payerName: record.payerName,
				notes: record.notes,
			})
		: taxIncomeFormDefaults(
				{
					issueDate: stringParam(params.issueDate),
					dueDate: stringParam(params.dueDate),
					documentReportedPaymentDate: stringParam(params.documentReportedPaymentDate),
					grossAmount: stringParam(params.grossAmount),
					withheldTaxAmount:
						stringParam(params.withheldTaxAmount) ?? (documentId ? undefined : "0.00"),
					payerName: stringParam(params.payerName),
				},
				documentId ? undefined : { defaultPaymentDate: "today" },
			);

	return (
		<TaxIncomeForm
			documentId={documentId}
			initialValues={initialValues}
			issueDate={stringParam(params.issueDate)}
			dueDate={stringParam(params.dueDate)}
			documentReportedPaymentDate={stringParam(params.documentReportedPaymentDate)}
			recordId={recordId}
			userId={session?.user.id ?? ""}
		/>
	);
}

function employmentRecordKindParam(value: string | string[] | undefined) {
	const normalized = stringParam(value);
	return normalized === "period" || normalized === "year_to_date_snapshot" ? normalized : "";
}

function employmentCoverageScopeParam(value: string | string[] | undefined) {
	const normalized = stringParam(value);
	return normalized === "single_payer" || normalized === "all_employers" ? normalized : "";
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
