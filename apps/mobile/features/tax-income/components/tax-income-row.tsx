import { Pressable, Text, View } from "react-native";

import { formatPen } from "../money";
import type { TaxIncomeRecord } from "../types";

export function TaxIncomeRow({
	record,
	onPress,
}: {
	record: TaxIncomeRecord;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityHint="Abre el ingreso para editarlo"
			accessibilityLabel={`${record.payerName ?? "Ingreso independiente"}, ${formatPen(record.grossAmountPen)}`}
			accessibilityRole="button"
			className="min-h-[78px] flex-row items-center justify-between gap-4 border-b border-konti-ivory/10 py-4"
			onPress={onPress}
		>
			<View className="flex-1 gap-1">
				<Text numberOfLines={1} className="text-[16px] text-konti-ivory">
					{record.payerName ?? "Ingreso independiente"}
				</Text>
				<Text className="text-[13px] text-konti-ivory/40">
					Cobrado el {formatPaymentDate(record.receivedAt)}
					{record.source === "document" ? " · desde RHE" : " · manual"}
				</Text>
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
	return new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" }).format(
		new Date(`${value}T12:00:00`),
	);
}
