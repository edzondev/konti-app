import * as v from "valibot";
import { DOCUMENT_TYPES, type ExtractedDocument } from "./ingestion.types.js";
import { AmountSchema, DocumentNumberSchema, IsoDateSchema, RucSchema } from "./schemas.js";

const TOTAL_CONFIDENCE = 0.6;
const NONE = "none";

const MONEY = /\d{1,3}(?:[.,]\d{3})+[.,]\d{2}|\d+[.,]\d{2}/g;
const DATE = /\b\d{2}[/-]\d{2}[/-]\d{4}\b/g;
const RUC = /\b(?:10|15|17|20)\d{9}\b/g;
const DOC_NUMBER = /\b([BFE]\d{3})-?(\d{1,8})\b/g;
const LETTERS = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3}/;

export type ChoiceAnswer = { choice: string; confidence: number };

export type FieldAnswers = Partial<
	Record<"total" | "igv" | "ruc" | "date" | "number" | "issuer" | "type", ChoiceAnswer>
>;

export type ChoiceQuestion = {
	type: "choice";
	instructions: string;
	criteria: Record<string, string | null>;
};

function unique(values: string[], limit: number): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of values) {
		const span = value.trim();
		if (!span || span === NONE || seen.has(span)) continue;
		seen.add(span);
		out.push(span);
		if (out.length >= limit) break;
	}
	return out;
}

function matches(text: string, pattern: RegExp): string[] {
	const found = [...text.matchAll(pattern)].map((match) => match[0]);
	// El total suele ir al final; si hay muchos montos, priorizar los últimos.
	return unique(found.reverse(), 48).reverse();
}

function issuerLines(markdown: string): string[] {
	const lines = markdown.split("\n").map((line) =>
		line
			.replace(/^#+\s*/, "")
			.replaceAll("*", "")
			.replaceAll("|", " ")
			.trim(),
	);
	return unique(
		lines.filter(
			(line) =>
				line.length > 2 &&
				line.length <= 80 &&
				LETTERS.test(line) &&
				!/^-{3,}$/.test(line) &&
				!line.startsWith("!["),
		),
		12,
	);
}

type Candidates = {
	amounts: string[];
	rucs: string[];
	dates: string[];
	numbers: string[];
	names: string[];
};

function candidatesFor(markdown: string): Candidates {
	return {
		amounts: matches(markdown, MONEY),
		rucs: matches(markdown, RUC),
		dates: matches(markdown, DATE),
		numbers: unique(
			[...markdown.matchAll(DOC_NUMBER)].map((match) => `${match[1]}-${match[2]}`),
			12,
		),
		names: issuerLines(markdown),
	};
}

function questionsFrom(found: Candidates): Record<string, ChoiceQuestion> | null {
	if (found.amounts.length === 0) return null;

	const questions: Record<string, ChoiceQuestion> = {
		total: choice(
			"Which amount is the total the customer must pay?",
			found.amounts,
			"None of these is the total due.",
		),
		igv: choice("Which amount is the IGV tax?", found.amounts, "None of these is the IGV."),
		type: {
			type: "choice",
			instructions: "What kind of Peruvian receipt is this document?",
			criteria: {
				boleta: "A boleta de venta",
				factura: "A factura",
				recibo_honorarios: "A recibo por honorarios",
				ticket: "A ticket",
				unknown: "The type is not stated",
			},
		},
	};

	if (found.rucs.length > 0) {
		questions.ruc = choice(
			"Which RUC belongs to the issuer?",
			found.rucs,
			"None of these is the issuer RUC.",
		);
	}
	if (found.dates.length > 0) {
		questions.date = choice(
			"Which date is the issue date of the receipt?",
			found.dates,
			"None of these is the issue date.",
		);
	}
	if (found.numbers.length > 0) {
		questions.number = choice(
			"Which value is the receipt series and number?",
			found.numbers,
			"None of these is the receipt number.",
		);
	}
	if (found.names.length > 0) {
		questions.issuer = choice(
			"Which line is the business name of the issuer?",
			found.names,
			"None of these is the issuer name.",
		);
	}
	return questions;
}

function choice(instructions: string, options: string[], none: string): ChoiceQuestion {
	const criteria: Record<string, string | null> = {};
	for (const option of options) criteria[option] = null;
	criteria[NONE] = none;
	return { type: "choice", instructions, criteria };
}

function chosen(answer: ChoiceAnswer | undefined, allowed: string[]): string | null {
	if (!answer || answer.choice === NONE) return null;
	return allowed.includes(answer.choice) ? answer.choice : null;
}

function toAmount(raw: string): string | null {
	const comma = raw.lastIndexOf(",");
	const dot = raw.lastIndexOf(".");
	const normalized =
		comma > dot ? raw.replaceAll(".", "").replace(",", ".") : raw.replaceAll(",", "");
	return v.is(AmountSchema, normalized) ? normalized : null;
}

function toIso(raw: string): string | null {
	const parts = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
	const iso = parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : raw;
	return v.is(IsoDateSchema, iso) ? iso : null;
}

const DocumentTypeSchema = v.picklist(DOCUMENT_TYPES);

function apply(
	found: Candidates,
	answers: FieldAnswers,
): { extracted: ExtractedDocument; confident: boolean } {
	const totalRaw = chosen(answers.total, found.amounts);
	const totalAmount = totalRaw ? toAmount(totalRaw) : null;
	const typeChoice = chosen(answers.type, [...DOCUMENT_TYPES]);
	const igvRaw = chosen(answers.igv, found.amounts);
	const ruc = chosen(answers.ruc, found.rucs);
	const date = chosen(answers.date, found.dates);
	const number = chosen(answers.number, found.numbers);

	return {
		confident: totalAmount != null && (answers.total?.confidence ?? 0) >= TOTAL_CONFIDENCE,
		extracted: {
			documentType: typeChoice && v.is(DocumentTypeSchema, typeChoice) ? typeChoice : "unknown",
			issuerName: chosen(answers.issuer, found.names),
			issuerTaxId: ruc && v.is(RucSchema, ruc) ? ruc : null,
			issueDate: date ? toIso(date) : null,
			documentNumber: number && v.is(DocumentNumberSchema, number) ? number : null,
			currencyCode: "PEN",
			totalAmount,
			igvAmount: igvRaw ? toAmount(igvRaw) : null,
		},
	};
}

/** Una pasada de candidatos para las preguntas y para copiar la respuesta. */
export function scanMarkdown(markdown: string): {
	questions: Record<string, ChoiceQuestion> | null;
	pick(answers: FieldAnswers): { extracted: ExtractedDocument; confident: boolean };
} {
	const found = candidatesFor(markdown);
	return {
		questions: questionsFrom(found),
		pick: (answers) => apply(found, answers),
	};
}
