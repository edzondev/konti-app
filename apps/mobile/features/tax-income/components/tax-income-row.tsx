import { Pressable, Text, View } from "react-native";

import { employmentIncomeRowCopy } from "../employment-income-copy";
import { formatPen } from "../money";
import type { TaxIncomeRecord } from "../types";

export function TaxIncomeRow({
	record,
	onPress,
	focused = false,
}: {
	record: TaxIncomeRecord;
	onPress?: () => void;
	focused?: boolean;
}) {
	const isPending = record.status === "pending_sync";
	const employmentCopy =
		record.incomeType === "employment"
			? employmentIncomeRowCopy({
					recordKind:
						record.recordKind === "year_to_date_snapshot" ? "year_to_date_snapshot" : "period",
					coverageStart: record.coverageStart ?? "",
					coverageEnd: record.coverageEnd ?? "",
					payerName: record.payerName,
					calculationDisposition: record.calculationDisposition,
					coveredByRecordId: record.coveredByRecordId,
				})
			: null;
	const title = employmentCopy?.title ?? record.payerName ?? "Ingreso independiente";

	return (
		<Pressable
			accessibilityHint={
				isPending ? "El ingreso se está guardando" : "Abre el ingreso para editarlo"
			}
			accessibilityLabel={`${title}, ${formatPen(record.grossAmountPen)}`}
			accessibilityRole="button"
			className={`min-h-[78px] flex-row items-center justify-between gap-4 border-b py-4 ${focused ? "rounded-2xl border-konti-primary/50 bg-konti-primary/10 px-3" : "border-konti-ivory/10"}`}
			disabled={isPending}
			onPress={onPress}
		>
			<View className="flex-1 gap-1">
				<Text numberOfLines={1} className="text-[16px] text-konti-ivory">
					{title}
				</Text>
				{isPending ? (
					<Text className="text-[13px] text-konti-primary">Guardando en segundo plano…</Text>
				) : (
					<View className="gap-1">
						<Text className="text-[13px] text-konti-ivory/40">
							{employmentCopy
								? employmentCopy.periodLabel
								: `Cobrado el ${formatPaymentDate(record.receivedAt ?? "")}${record.source === "document" ? " · desde RHE" : " · manual"}`}
						</Text>
						{employmentCopy?.statusLabel ? (
							<Text
								className={`text-[12px] leading-5 ${employmentCopy.statusTone === "primary" ? "text-konti-primary" : "text-konti-ivory/40"}`}
							>
								{employmentCopy.statusLabel}
							</Text>
						) : null}
					</View>
				)}
			</View>
			<View className="items-end gap-1">
				<Text className="text-[16px] font-medium text-konti-ivory">
					{formatPen(record.grossAmountPen)}
				</Text>
				{record.withheldTaxAmountPen !== "0.00" ? (
					<Text className="text-[12px] text-konti-ivory/40">
						Retención {formatPen(record.withheldTaxAmountPen)}
					</Text>
				) : null}
			</View>
		</Pressable>
	);
}

function formatPaymentDate(value: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "fecha por revisar";
	return new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" }).format(
		new Date(`${value}T12:00:00`),
	);
}
