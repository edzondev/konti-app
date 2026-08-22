import { z } from "zod";

import { compareMoney, normalizeMoney } from "./money";

function todayInLima(now: Date): string {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return `${values.year}-${values.month}-${values.day}`;
}

function isCalendarDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function paymentDateSchema(now: Date) {
	const today = todayInLima(now);
	return z
		.string()
		.refine(isCalendarDate, "Ingresa una fecha válida.")
		.refine(
			(value) => value >= "2026-01-01" && value <= "2026-12-31",
			"La fecha de cobro debe corresponder a 2026.",
		)
		.refine((value) => value <= today, "La fecha de cobro no puede estar en el futuro.");
}

function moneySchema(options: { positive: boolean }) {
	return z
		.string()
		.trim()
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
	z.union([z.string().max(maxLength), z.null()]).transform((value) => {
		if (value == null) return null;
		const normalized = value.trim();
		return normalized.length > 0 ? normalized : null;
	});

export function createTaxIncomeFormSchema(now = new Date()) {
	return z
		.object({
			receivedAt: paymentDateSchema(now),
			grossAmount: moneySchema({ positive: true }),
			withheldTaxAmount: moneySchema({ positive: false }),
			payerName: optionalText(160),
			notes: optionalText(1000),
		})
		.strict()
		.superRefine((value, context) => {
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

export type TaxIncomeFormInput = z.input<ReturnType<typeof createTaxIncomeFormSchema>>;
export type TaxIncomeFormValues = z.output<ReturnType<typeof createTaxIncomeFormSchema>>;
