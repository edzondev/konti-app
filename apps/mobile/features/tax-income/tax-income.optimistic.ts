import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";

import { taxIncomeKeys } from "./tax-income.keys";
import type {
	ConfirmDocumentIncomeInput,
	ConfirmEmploymentDocumentInput,
	CreateTaxIncomeInput,
	TaxIncomePage,
	TaxIncomeRecord,
	UpdateTaxIncomeInput,
} from "./types";

export type TaxIncomeCacheMutation =
	| { kind: "create"; record: TaxIncomeRecord }
	| { kind: "update"; recordId: string; input: UpdateTaxIncomeInput }
	| { kind: "delete"; recordId: string }
	| { kind: "commit"; optimisticId: string; record: TaxIncomeRecord };

export type TaxIncomeCacheMutationContext = {
	snapshots: [QueryKey, InfiniteData<TaxIncomePage> | undefined][];
};

export function pendingTaxIncomeRecord(
	input: CreateTaxIncomeInput,
	submittedAt: number,
): TaxIncomeRecord {
	const timestamp = new Date(submittedAt).toISOString();
	if (isEmploymentCreateInput(input)) {
		return employmentPendingRecord(input, null, timestamp);
	}
	const fourthInput = input as Exclude<CreateTaxIncomeInput, { incomeType: "employment" }>;

	return {
		id: `pending:${input.idempotencyKey}`,
		sourceDocumentId: null,
		incomeType: fourthInput.activityType,
		activityClassificationSource: "manual_confirmation",
		source: "manual",
		receivedAt: fourthInput.receivedAt,
		recordKind: "payment",
		coverageStart: null,
		coverageEnd: null,
		coverageScope: null,
		grossAmount: fourthInput.grossAmount,
		withheldTaxAmount: fourthInput.withheldTaxAmount,
		currencyCode: "PEN",
		grossAmountPen: fourthInput.grossAmount,
		withheldTaxAmountPen: fourthInput.withheldTaxAmount,
		payerName: fourthInput.payerName,
		payerTaxId: null,
		calculationDisposition: "included",
		coveredByRecordId: null,
		coverageResolutionReason: null,
		status: "pending_sync",
		notes: fourthInput.notes,
		deletedAt: null,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

function isEmploymentCreateInput(
	input: CreateTaxIncomeInput,
): input is Extract<CreateTaxIncomeInput, { incomeType: "employment" }> {
	return "incomeType" in input && input.incomeType === "employment";
}

export function pendingDocumentTaxIncomeRecord(
	input: ConfirmDocumentIncomeInput | ConfirmEmploymentDocumentInput,
	submittedAt: number,
): TaxIncomeRecord {
	const timestamp = new Date(submittedAt).toISOString();
	if (input.decision === "employment_confirmed") {
		return employmentPendingRecord(input, input.documentId, timestamp);
	}
	return {
		id: `pending:document:${input.documentId}`,
		sourceDocumentId: input.documentId,
		incomeType: input.activityType,
		activityClassificationSource: "manual_confirmation",
		source: "document",
		receivedAt: input.receivedAt,
		recordKind: "payment",
		coverageStart: null,
		coverageEnd: null,
		coverageScope: null,
		grossAmount: input.grossAmount,
		withheldTaxAmount: input.withheldTaxAmount,
		currencyCode: "PEN",
		grossAmountPen: input.grossAmount,
		withheldTaxAmountPen: input.withheldTaxAmount,
		payerName: input.payerName,
		payerTaxId: null,
		calculationDisposition: "included",
		coveredByRecordId: null,
		coverageResolutionReason: null,
		status: "pending_sync",
		notes: input.notes,
		deletedAt: null,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

function employmentPendingRecord(
	input:
		| Omit<ConfirmEmploymentDocumentInput, "decision">
		| Extract<CreateTaxIncomeInput, { incomeType: "employment" }>,
	sourceDocumentId: string | null,
	timestamp: string,
): TaxIncomeRecord {
	const pendingId =
		sourceDocumentId ?? ("idempotencyKey" in input ? input.idempotencyKey : input.documentId);
	return {
		id: sourceDocumentId ? `pending:document:${pendingId}` : `pending:${pendingId}`,
		sourceDocumentId,
		incomeType: "employment",
		activityClassificationSource: null,
		source: sourceDocumentId ? "document" : "manual",
		receivedAt: null,
		recordKind: input.recordKind,
		coverageStart: input.coverageStart,
		coverageEnd: input.coverageEnd,
		coverageScope: input.coverageScope,
		grossAmount: input.grossAmount,
		withheldTaxAmount: input.withheldTaxAmount,
		currencyCode: "PEN",
		grossAmountPen: input.grossAmount,
		withheldTaxAmountPen: input.withheldTaxAmount,
		payerName: input.payerName,
		payerTaxId: input.payerTaxId,
		calculationDisposition: "included",
		coveredByRecordId: null,
		coverageResolutionReason: null,
		status: "pending_sync",
		notes: input.notes,
		deletedAt: null,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

export function patchTaxIncomePages(
	data: InfiniteData<TaxIncomePage>,
	mutation: TaxIncomeCacheMutation,
): InfiniteData<TaxIncomePage> {
	if (mutation.kind === "create") {
		if (data.pages.some((page) => page.items.some((record) => record.id === mutation.record.id))) {
			return data;
		}
		return {
			...data,
			pages: data.pages.map((page, index) => ({
				...page,
				items: index === 0 ? [mutation.record, ...page.items] : page.items,
				summary: adjustSummary(page.summary, recordContribution(mutation.record)),
			})),
		};
	}

	const targetId = mutation.kind === "commit" ? mutation.optimisticId : mutation.recordId;
	const current = data.pages.flatMap((page) => page.items).find((record) => record.id === targetId);
	if (!current) return data;

	if (mutation.kind === "delete") {
		return {
			...data,
			pages: data.pages.map((page) => ({
				...page,
				items: page.items.filter((record) => record.id !== mutation.recordId),
				summary: adjustSummary(page.summary, negateContribution(recordContribution(current))),
			})),
		};
	}

	const nextRecord =
		mutation.kind === "commit" ? mutation.record : optimisticUpdatedRecord(current, mutation.input);
	const contributionDelta = subtractContribution(
		recordContribution(nextRecord),
		recordContribution(current),
	);

	return {
		...data,
		pages: data.pages.map((page) => ({
			...page,
			items: page.items.map((record) => (record.id === targetId ? nextRecord : record)),
			summary: adjustSummary(page.summary, contributionDelta),
		})),
	};
}

export function beginTaxIncomeCacheMutation(
	queryClient: QueryClient,
	userId: string,
	mutation: Exclude<TaxIncomeCacheMutation, { kind: "commit" }>,
): TaxIncomeCacheMutationContext {
	const snapshots = queryClient.getQueriesData<InfiniteData<TaxIncomePage>>({
		queryKey: taxIncomeKeys.lists(userId),
	});
	for (const [queryKey, current] of snapshots) {
		if (!current) continue;
		if (mutation.kind === "create" && !taxIncomeListIncludesRecord(queryKey, mutation.record)) {
			continue;
		}
		queryClient.setQueryData(queryKey, patchTaxIncomePages(current, mutation));
	}
	return { snapshots };
}

function taxIncomeListIncludesRecord(queryKey: QueryKey, record: TaxIncomeRecord): boolean {
	const filter = Array.isArray(queryKey) ? queryKey[4] : "all";
	if (filter === "employment") return record.incomeType === "employment";
	if (filter === "fourth") return record.incomeType !== "employment";
	return true;
}

export function rollbackTaxIncomeCacheMutation(
	queryClient: QueryClient,
	context: TaxIncomeCacheMutationContext | undefined,
) {
	for (const [queryKey, data] of context?.snapshots ?? []) {
		queryClient.setQueryData(queryKey, data);
	}
}

export function commitTaxIncomeCacheRecord(
	queryClient: QueryClient,
	userId: string,
	optimisticId: string,
	record: TaxIncomeRecord,
) {
	queryClient.setQueriesData<InfiniteData<TaxIncomePage>>(
		{ queryKey: taxIncomeKeys.lists(userId) },
		(current) =>
			current ? patchTaxIncomePages(current, { kind: "commit", optimisticId, record }) : current,
	);
}

export async function retryTaxIncomeOperation(
	queryClient: QueryClient,
	mutationId: number,
): Promise<boolean> {
	const mutation = queryClient
		.getMutationCache()
		.getAll()
		.find((candidate) => candidate.mutationId === mutationId);
	if (!mutation || mutation.state.variables === undefined) return false;
	await mutation.execute(mutation.state.variables);
	return true;
}

function optimisticUpdatedRecord(
	record: TaxIncomeRecord,
	input: UpdateTaxIncomeInput,
): TaxIncomeRecord {
	if (record.incomeType === "employment" && "incomeType" in input) {
		return {
			...record,
			recordKind: input.recordKind ?? record.recordKind,
			coverageStart: input.coverageStart ?? record.coverageStart,
			coverageEnd: input.coverageEnd ?? record.coverageEnd,
			coverageScope: input.coverageScope ?? record.coverageScope,
			grossAmount: input.grossAmount ?? record.grossAmount,
			grossAmountPen: input.grossAmount ?? record.grossAmountPen,
			withheldTaxAmount: input.withheldTaxAmount ?? record.withheldTaxAmount,
			withheldTaxAmountPen: input.withheldTaxAmount ?? record.withheldTaxAmountPen,
			payerName: input.payerName === undefined ? record.payerName : input.payerName,
			payerTaxId: input.payerTaxId === undefined ? record.payerTaxId : input.payerTaxId,
			notes: input.notes === undefined ? record.notes : input.notes,
			status: "pending_sync",
		};
	}
	const fourthInput = input as Partial<import("./tax-income.validation").TaxIncomeFormValues>;
	return {
		...record,
		incomeType: fourthInput.activityType ?? record.incomeType,
		activityClassificationSource:
			fourthInput.activityType === undefined
				? record.activityClassificationSource
				: "manual_confirmation",
		receivedAt: fourthInput.receivedAt ?? record.receivedAt,
		grossAmount: fourthInput.grossAmount ?? record.grossAmount,
		grossAmountPen: fourthInput.grossAmount ?? record.grossAmountPen,
		withheldTaxAmount: fourthInput.withheldTaxAmount ?? record.withheldTaxAmount,
		withheldTaxAmountPen: fourthInput.withheldTaxAmount ?? record.withheldTaxAmountPen,
		payerName: fourthInput.payerName === undefined ? record.payerName : fourthInput.payerName,
		notes: fourthInput.notes === undefined ? record.notes : fourthInput.notes,
		status: "pending_sync",
	};
}

function adjustSummary(summary: TaxIncomePage["summary"], delta: TaxIncomeSummaryContribution) {
	return {
		...summary,
		grossAmount: addMoney(summary.grossAmount, delta.grossAmount),
		withheldTaxAmount: addMoney(summary.withheldTaxAmount, delta.withheldTaxAmount),
		count: summary.count + delta.count,
		fourthGrossAmount: addMoney(summary.fourthGrossAmount ?? "0.00", delta.fourthGrossAmount),
		employmentGrossAmount: addMoney(
			summary.employmentGrossAmount ?? "0.00",
			delta.employmentGrossAmount,
		),
		withheldFourth: addMoney(summary.withheldFourth ?? "0.00", delta.withheldFourth),
		withheldFifth: addMoney(summary.withheldFifth ?? "0.00", delta.withheldFifth),
		fourthCount: (summary.fourthCount ?? 0) + delta.fourthCount,
		employmentCount: (summary.employmentCount ?? 0) + delta.employmentCount,
	};
}

type TaxIncomeSummaryContribution = {
	grossAmount: string;
	withheldTaxAmount: string;
	count: number;
	fourthGrossAmount: string;
	employmentGrossAmount: string;
	withheldFourth: string;
	withheldFifth: string;
	fourthCount: number;
	employmentCount: number;
};

const ZERO_CONTRIBUTION: TaxIncomeSummaryContribution = {
	grossAmount: "0.00",
	withheldTaxAmount: "0.00",
	count: 0,
	fourthGrossAmount: "0.00",
	employmentGrossAmount: "0.00",
	withheldFourth: "0.00",
	withheldFifth: "0.00",
	fourthCount: 0,
	employmentCount: 0,
};

function recordContribution(record: TaxIncomeRecord): TaxIncomeSummaryContribution {
	if (record.calculationDisposition !== "included") return ZERO_CONTRIBUTION;
	const employment = record.incomeType === "employment";
	return {
		grossAmount: record.grossAmountPen,
		withheldTaxAmount: record.withheldTaxAmountPen,
		count: 1,
		fourthGrossAmount: employment ? "0.00" : record.grossAmountPen,
		employmentGrossAmount: employment ? record.grossAmountPen : "0.00",
		withheldFourth: employment ? "0.00" : record.withheldTaxAmountPen,
		withheldFifth: employment ? record.withheldTaxAmountPen : "0.00",
		fourthCount: employment ? 0 : 1,
		employmentCount: employment ? 1 : 0,
	};
}

function negateContribution(value: TaxIncomeSummaryContribution): TaxIncomeSummaryContribution {
	return {
		grossAmount: negateMoney(value.grossAmount),
		withheldTaxAmount: negateMoney(value.withheldTaxAmount),
		count: -value.count,
		fourthGrossAmount: negateMoney(value.fourthGrossAmount),
		employmentGrossAmount: negateMoney(value.employmentGrossAmount),
		withheldFourth: negateMoney(value.withheldFourth),
		withheldFifth: negateMoney(value.withheldFifth),
		fourthCount: -value.fourthCount,
		employmentCount: -value.employmentCount,
	};
}

function subtractContribution(
	left: TaxIncomeSummaryContribution,
	right: TaxIncomeSummaryContribution,
): TaxIncomeSummaryContribution {
	return {
		grossAmount: subtractMoney(left.grossAmount, right.grossAmount),
		withheldTaxAmount: subtractMoney(left.withheldTaxAmount, right.withheldTaxAmount),
		count: left.count - right.count,
		fourthGrossAmount: subtractMoney(left.fourthGrossAmount, right.fourthGrossAmount),
		employmentGrossAmount: subtractMoney(left.employmentGrossAmount, right.employmentGrossAmount),
		withheldFourth: subtractMoney(left.withheldFourth, right.withheldFourth),
		withheldFifth: subtractMoney(left.withheldFifth, right.withheldFifth),
		fourthCount: left.fourthCount - right.fourthCount,
		employmentCount: left.employmentCount - right.employmentCount,
	};
}

function negateMoney(value: string): string {
	return value.startsWith("-") ? value.slice(1) : `-${value}`;
}

function subtractMoney(left: string, right: string): string {
	return addMoney(left, negateMoney(right));
}

function addMoney(left: string, right: string): string {
	return centsToMoney(moneyToCents(left) + moneyToCents(right));
}

function moneyToCents(value: string): bigint {
	const normalized = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);
	if (!normalized) throw new Error("Invalid money value in tax-income cache");
	const [, sign = "", integer = "0", decimal = ""] = normalized;
	const cents = BigInt(integer) * 100n + BigInt(decimal.padEnd(2, "0"));
	return sign === "-" ? -cents : cents;
}

function centsToMoney(value: bigint): string {
	const negative = value < 0n;
	const absolute = negative ? -value : value;
	const integer = absolute / 100n;
	const decimal = String(absolute % 100n).padStart(2, "0");
	return `${negative ? "-" : ""}${integer}.${decimal}`;
}
