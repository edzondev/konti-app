import { z } from "zod";

import { todayDateOnlyInLima } from "@/shared/date-only";

import { compareMoney, normalizeMoney } from "./money";

export const employmentRecordKinds = ["period", "year_to_date_snapshot"] as const;
export const employmentCoverageScopes = ["single_payer", "all_employers"] as const;

export type EmploymentRecordKind = (typeof employmentRecordKinds)[number];
export type EmploymentCoverageScope = (typeof employmentCoverageScopes)[number];

function isCalendarDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function createCoverageDate(maximumDate: string) {
	return z
		.string()
		.refine(isCalendarDate, "Ingresa una fecha válida.")
		.refine(
			(value) => value >= "2026-01-01" && value <= "2026-12-31",
			"La cobertura debe corresponder a 2026.",
		)
		.refine((value) => value <= maximumDate, "La cobertura no puede incluir una fecha futura.");
}

function money(options: { positive: boolean; emptyAsZero?: boolean }) {
	return z
		.string()
		.trim()
		.transform((value) => (options.emptyAsZero && value === "" ? "0" : value))
		.refine(
			(value) => normalizeMoney(value) !== null,
			"Ingresa un monto válido con hasta 2 decimales.",
		)
		.refine((value) => {
			const normalized = normalizeMoney(value);
			return normalized === null || (normalized.split(".")[0]?.length ?? 0) <= 12;
		}, "El monto es demasiado grande.")
		.transform((value) => normalizeMoney(value) ?? value)
		.refine((value) => {
			const normalized = normalizeMoney(value);
			return normalized === null || !options.positive || compareMoney(normalized, "0.00") === 1;
		}, "El ingreso bruto debe ser mayor que cero.");
}

const optionalText = (maxLength: number) =>
	z
		.string()
		.max(maxLength)
		.transform((value) => {
			const normalized = value.trim();
			return normalized.length > 0 ? normalized : null;
		});

export function createEmploymentIncomeFormSchema(now = new Date()) {
	const coverageDate = createCoverageDate(todayDateOnlyInLima(now));
	return z
		.object({
			recordKind: z
				.union([z.enum(employmentRecordKinds), z.literal("")])
				.refine((value) => value !== "", "Indica si es una boleta mensual o un acumulado."),
			coverageStart: coverageDate,
			coverageEnd: coverageDate,
			coverageScope: z
				.union([z.enum(employmentCoverageScopes), z.literal("")])
				.refine(
					(value) => value !== "",
					"Confirma si el documento corresponde a una empresa o a todas.",
				),
			grossAmount: money({ positive: true }),
			withheldTaxAmount: money({ positive: false, emptyAsZero: true }),
			payerName: optionalText(160),
			payerTaxId: optionalText(11).refine(
				(value) => value === null || /^\d{11}$/.test(value),
				"El RUC de la empresa debe tener 11 dígitos.",
			),
			notes: optionalText(1000),
		})
		.strict()
		.superRefine((value, context) => {
			if (value.coverageStart > value.coverageEnd) {
				context.addIssue({
					code: "custom",
					path: ["coverageEnd"],
					message: "La fecha final no puede ser anterior a la inicial.",
				});
			}
			if (
				value.recordKind === "period" &&
				value.coverageStart.slice(0, 7) !== value.coverageEnd.slice(0, 7)
			) {
				context.addIssue({
					code: "custom",
					path: ["coverageEnd"],
					message: "Una boleta mensual debe empezar y terminar en el mismo mes.",
				});
			}
			if (value.recordKind === "period" && value.coverageScope === "all_employers") {
				context.addIssue({
					code: "custom",
					path: ["coverageScope"],
					message: "Una boleta mensual corresponde a una sola empresa.",
				});
			}
			if (value.coverageScope === "single_payer" && !value.payerName && !value.payerTaxId) {
				context.addIssue({
					code: "custom",
					path: ["payerName"],
					message: "Ingresa el nombre de la empresa que te pagó.",
				});
			}
			const grossAmount = normalizeMoney(value.grossAmount);
			const withheldTaxAmount = normalizeMoney(value.withheldTaxAmount);
			if (
				grossAmount !== null &&
				withheldTaxAmount !== null &&
				compareMoney(withheldTaxAmount, grossAmount) === 1
			) {
				context.addIssue({
					code: "custom",
					path: ["withheldTaxAmount"],
					message: "La retención no puede superar el ingreso bruto.",
				});
			}
		});
}

export type EmploymentIncomeFormInput = z.input<
	ReturnType<typeof createEmploymentIncomeFormSchema>
>;
export type EmploymentIncomeFormValues = z.output<
	ReturnType<typeof createEmploymentIncomeFormSchema>
>;

export function employmentIncomeFormDefaults(
	prefill: Partial<EmploymentIncomeFormInput> = {},
): EmploymentIncomeFormInput {
	return {
		recordKind: prefill.recordKind ?? "",
		coverageStart: prefill.coverageStart ?? "",
		coverageEnd: prefill.coverageEnd ?? "",
		coverageScope: prefill.coverageScope ?? "",
		grossAmount: prefill.grossAmount ?? "",
		withheldTaxAmount: prefill.withheldTaxAmount ?? "",
		payerName: prefill.payerName ?? "",
		payerTaxId: prefill.payerTaxId ?? "",
		notes: prefill.notes ?? "",
	};
}
