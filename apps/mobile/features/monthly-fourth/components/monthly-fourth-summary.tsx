import { Text, View } from "react-native";

import { formatPen } from "@/features/tax-income/money";

import {
	monthlyDifferenceCopy,
	monthlyFourthStatusCopy,
	monthlyThresholdCopy,
	verificationScopeCopy,
} from "../monthly-fourth-copy";
import { safeMonthlyFourthStatus } from "../monthly-fourth-state";
import type { MonthlyFourthPeriod, VerificationScope } from "../types";

export function MonthlyFourthSummary({ period }: { period: MonthlyFourthPeriod }) {
	const visibleStatus = safeMonthlyFourthStatus(period);
	const statusCopy = monthlyFourthStatusCopy(visibleStatus);

	return (
		<View className="gap-4">
			<View
				className={`rounded-[26px] border p-5 ${visibleStatus === "no_action_detected" || visibleStatus === "user_recorded_complete" ? "border-konti-ivory/10 bg-konti-surface" : "border-konti-primary/35 bg-konti-primary/10"}`}
			>
				<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
					REVISIÓN DEL MES
				</Text>
				<Text className="mt-4 text-[25px] font-light leading-8 text-konti-ivory">
					{statusCopy.title}
				</Text>
				<Text className="mt-2 text-[13px] leading-5 text-konti-ivory/50">{statusCopy.body}</Text>
			</View>

			<View className="rounded-[26px] border border-konti-ivory/10 bg-konti-surface p-5">
				<Text className="font-mono text-[10px] tracking-[2px] text-konti-ivory/35">
					DATOS REGISTRADOS
				</Text>
				<View className="mt-5 gap-4">
					<SummaryRow label="Ingresos de cuarta percibidos" value={period.monthlyFourthGross} />
					<SummaryRow label="Ingresos de quinta del mes" value={period.monthlyFifthGross} />
					<SummaryRow label="Retenciones de cuarta" value={period.registeredFourthWithholding} />
				</View>
				<View className="mt-5 border-t border-konti-ivory/10 pt-5">
					<Text className="text-[13px] leading-5 text-konti-ivory/45">
						{monthlyDifferenceCopy(period.estimatedAdvancePayment)}
					</Text>
					<Text className="mt-3 text-[12px] leading-5 text-konti-ivory/35">
						{period.thresholdKind === null || period.monthlyThreshold === null
							? "Primero confirma qué tipo de actividad independiente realizaste. Hasta entonces, Konti no elegirá un límite mensual."
							: monthlyThresholdCopy(period.thresholdKind, period.monthlyThreshold)}
					</Text>
				</View>
			</View>

			<SuspensionSummary period={period} />
			<FactsSummary period={period} />
		</View>
	);
}

function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<View className="flex-row items-end justify-between gap-5">
			<Text className="flex-1 text-[13px] leading-5 text-konti-ivory/45">{label}</Text>
			<Text selectable className="text-[16px] font-medium tabular-nums text-konti-ivory">
				{formatPen(value)}
			</Text>
		</View>
	);
}

function SuspensionSummary({ period }: { period: MonthlyFourthPeriod }) {
	const suspension = period.suspension;
	if (!suspension) return null;

	return (
		<View className="rounded-[24px] border border-konti-ivory/10 bg-konti-surface p-5">
			<Text className="text-[15px] font-medium text-konti-ivory">Suspensión registrada</Text>
			<Text className="mt-2 text-[13px] leading-5 text-konti-ivory/45">
				{suspension.state === "yes"
					? "La autorización empieza el día calendario siguiente a su emisión y termina el 31 de diciembre, salvo que corresponda reiniciar."
					: suspension.state === "no"
						? "Indicaste que no tenías una suspensión para este mes."
						: "Aún no está confirmado si tenías una suspensión."}
			</Text>
			{suspension.state === "yes" ? (
				<View className="mt-4 gap-2">
					<DateLine label="Emitida" value={suspension.authorizationDate} />
					<DateLine label="Efectiva desde" value={suspension.effectiveFrom} />
					<DateLine label="Válida hasta" value={suspension.validThrough ?? "2026-12-31"} />
					{suspension.restartState === "required" ? (
						<DateLine label="Reinicio registrado" value={suspension.restartDate} />
					) : null}
				</View>
			) : null}
			<ScopeLine scope={suspension.verificationScope} />
		</View>
	);
}

function FactsSummary({ period }: { period: MonthlyFourthPeriod }) {
	return (
		<View className="gap-3">
			<FactCard label="Declaración mensual" fact={period.filing} />
			<FactCard label="Pago mensual" fact={period.payment} />
		</View>
	);
}

function FactCard({ label, fact }: { label: string; fact: MonthlyFourthPeriod["filing"] }) {
	return (
		<View className="rounded-[22px] border border-konti-ivory/10 bg-konti-surface px-5 py-4">
			<View className="flex-row items-center justify-between gap-4">
				<Text className="text-[14px] font-medium text-konti-ivory">{label}</Text>
				<Text className="text-[13px] text-konti-ivory/55">
					{fact?.state === "yes" ? "Sí" : fact?.state === "no" ? "No" : "Sin confirmar"}
				</Text>
			</View>
			<ScopeLine scope={fact?.verificationScope ?? null} />
		</View>
	);
}

function DateLine({ label, value }: { label: string; value: string | null }) {
	return (
		<View className="flex-row justify-between gap-4">
			<Text className="text-[12px] text-konti-ivory/35">{label}</Text>
			<Text selectable className="text-[12px] tabular-nums text-konti-ivory/60">
				{value ?? "Sin dato"}
			</Text>
		</View>
	);
}

function ScopeLine({ scope }: { scope: VerificationScope | null }) {
	return scope ? (
		<Text className="mt-3 text-[11px] leading-4 text-konti-ivory/30">
			{verificationScopeCopy(scope)}
		</Text>
	) : null;
}
