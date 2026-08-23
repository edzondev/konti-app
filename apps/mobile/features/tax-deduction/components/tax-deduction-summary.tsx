import { Pressable, Text, View } from "react-native";

import {
	categoryCopy,
	deductionCalculationCopy,
	deductionCapCopy,
	deductionVerificationCopy,
} from "../tax-deduction-copy";
import type { TaxDeductionCollection, TaxDeductionRecord } from "../types";

const MONEY = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

function formatMoney(value: string): string {
	const parsed = Number(value);
	return MONEY.format(Number.isFinite(parsed) ? parsed : 0).replace("PEN", "S/");
}

export function TaxDeductionSummary({
	collection,
	selectedRecordId,
	onSelectRecord,
	onCreateNew,
}: {
	collection: TaxDeductionCollection;
	selectedRecordId: string | null;
	onSelectRecord: (record: TaxDeductionRecord) => void;
	onCreateNew: () => void;
}) {
	return (
		<View className="gap-5">
			<View className="rounded-[24px] border border-konti-ivory/10 bg-konti-surface p-5">
				<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
					DEDUCCIONES ADICIONALES 2026
				</Text>
				<View className="mt-5 flex-row gap-4">
					<Amount
						label="Incluido en la estimación"
						value={collection.summary.includedDeductionPen}
					/>
					<Amount label="Potencial por revisar" value={collection.summary.potentialDeductionPen} />
				</View>
				<Text selectable className="mt-4 text-[12px] leading-5 text-konti-ivory/40">
					{deductionCapCopy({
						capPen: collection.summary.capPen,
						amountDiscardedByCapPen: collection.summary.amountDiscardedByCapPen,
					})}
				</Text>
			</View>

			{collection.records.length > 0 ? (
				<View className="gap-3">
					<View className="flex-row items-center justify-between">
						<Text className="text-[13px] font-medium text-konti-ivory/60">Gastos registrados</Text>
						<Pressable
							accessibilityRole="button"
							className="min-h-11 justify-center px-2"
							onPress={onCreateNew}
						>
							<Text className="text-[13px] font-medium text-konti-primary">Registrar otro</Text>
						</Pressable>
					</View>
					{collection.records.map((record) => (
						<DeductionRecordRow
							isSelected={record.id === selectedRecordId}
							key={record.id}
							onPress={() => onSelectRecord(record)}
							record={record}
						/>
					))}
				</View>
			) : (
				<View className="rounded-[20px] border border-dashed border-konti-ivory/15 p-5">
					<Text className="text-[14px] leading-6 text-konti-ivory/55">
						Todavía no registraste gastos para esta deducción. Empezaremos con preguntas simples.
					</Text>
				</View>
			)}
		</View>
	);
}

function Amount({ label, value }: { label: string; value: string }) {
	return (
		<View className="min-w-0 flex-1 gap-1">
			<Text selectable className="text-[20px] font-light text-konti-ivory">
				{formatMoney(value)}
			</Text>
			<Text className="text-[11px] leading-4 text-konti-ivory/35">{label}</Text>
		</View>
	);
}

function DeductionRecordRow({
	record,
	isSelected,
	onPress,
}: {
	record: TaxDeductionRecord;
	isSelected: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ selected: isSelected }}
			className={`min-h-20 justify-center rounded-[20px] border px-4 py-3 ${isSelected ? "border-konti-primary bg-konti-primary/10" : "border-konti-ivory/10 bg-konti-surface"}`}
			onPress={onPress}
		>
			<View className="flex-row items-start justify-between gap-3">
				<View className="min-w-0 flex-1 gap-1">
					<Text className="text-[14px] font-medium text-konti-ivory">
						{categoryCopy[record.category].shortTitle}
					</Text>
					<Text className="text-[11px] leading-4 text-konti-ivory/40">
						{deductionVerificationCopy(record.verificationStatus)}
					</Text>
					<Text className="text-[11px] leading-4 text-konti-ivory/40">
						{deductionCalculationCopy(record.calculationStatus)}
					</Text>
				</View>
				<Text selectable className="text-[14px] tabular-nums text-konti-ivory/70">
					{formatMoney(record.grossAmountPen)}
				</Text>
			</View>
		</Pressable>
	);
}
