import type { InfiniteData } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
	patchTaxIncomePages,
	pendingDocumentTaxIncomeRecord,
	pendingTaxIncomeRecord,
} from "./tax-income.optimistic";
import type { TaxIncomePage, TaxIncomeRecord } from "./types";

const existingRecord: TaxIncomeRecord = {
	id: "income-1",
	sourceDocumentId: null,
	incomeType: "fourth_ordinary",
	activityClassificationSource: "manual_confirmation",
	source: "manual",
	receivedAt: "2026-08-19",
	recordKind: "payment",
	coverageStart: null,
	coverageEnd: null,
	coverageScope: null,
	grossAmount: "100.00",
	withheldTaxAmount: "8.00",
	currencyCode: "PEN",
	grossAmountPen: "100.00",
	withheldTaxAmountPen: "8.00",
	payerName: "Cliente anterior",
	payerTaxId: null,
	calculationDisposition: "included",
	coveredByRecordId: null,
	coverageResolutionReason: null,
	status: "confirmed",
	notes: null,
	deletedAt: null,
	createdAt: "2026-08-19T12:00:00.000Z",
	updatedAt: "2026-08-19T12:00:00.000Z",
};

const fourthSummary: TaxIncomePage["summary"] = {
	grossAmount: "100.00",
	withheldTaxAmount: "8.00",
	count: 1,
	fourthGrossAmount: "100.00",
	employmentGrossAmount: "0.00",
	withheldFourth: "8.00",
	withheldFifth: "0.00",
	fourthCount: 1,
	employmentCount: 0,
};

const pages: InfiniteData<TaxIncomePage> = {
	pageParams: [undefined, "cursor-2"],
	pages: [
		{
			items: [existingRecord],
			nextCursor: "cursor-2",
			summary: fourthSummary,
		},
		{
			items: [{ ...existingRecord, id: "income-2", receivedAt: "2026-07-01" }],
			nextCursor: null,
			summary: fourthSummary,
		},
	],
};

describe("pendingTaxIncomeRecord", () => {
	it("creates an explicit non-editable pending row from a manual submission", () => {
		const record = pendingTaxIncomeRecord(
			{
				activityType: "fourth_ordinary",
				receivedAt: "2026-08-20",
				grossAmount: "100000.00",
				withheldTaxAmount: "5000.00",
				payerName: "Cliente SAC",
				notes: null,
				idempotencyKey: "request-1",
			},
			1_777_000_000_000,
		);

		expect(record).toEqual({
			id: "pending:request-1",
			sourceDocumentId: null,
			incomeType: "fourth_ordinary",
			activityClassificationSource: "manual_confirmation",
			source: "manual",
			receivedAt: "2026-08-20",
			recordKind: "payment",
			coverageStart: null,
			coverageEnd: null,
			coverageScope: null,
			grossAmount: "100000.00",
			withheldTaxAmount: "5000.00",
			currencyCode: "PEN",
			grossAmountPen: "100000.00",
			withheldTaxAmountPen: "5000.00",
			payerName: "Cliente SAC",
			payerTaxId: null,
			calculationDisposition: "included",
			coveredByRecordId: null,
			coverageResolutionReason: null,
			status: "pending_sync",
			notes: null,
			deletedAt: null,
			createdAt: "2026-04-24T03:06:40.000Z",
			updatedAt: "2026-04-24T03:06:40.000Z",
		});
	});

	it("creates a reversible pending row for an employment snapshot", () => {
		const record = pendingTaxIncomeRecord(
			{
				incomeType: "employment",
				recordKind: "year_to_date_snapshot",
				coverageStart: "2026-01-01",
				coverageEnd: "2026-06-30",
				coverageScope: "all_employers",
				grossAmount: "30000.00",
				withheldTaxAmount: "1500.00",
				payerName: null,
				payerTaxId: null,
				notes: null,
				idempotencyKey: "employment-request-1",
			},
			1_777_000_000_000,
		);

		expect(record).toMatchObject({
			id: "pending:employment-request-1",
			incomeType: "employment",
			recordKind: "year_to_date_snapshot",
			coverageStart: "2026-01-01",
			coverageEnd: "2026-06-30",
			coverageScope: "all_employers",
			receivedAt: null,
			calculationDisposition: "included",
			status: "pending_sync",
		});
	});

	it("creates a pending document row without inventing an idempotency key", () => {
		expect(
			pendingDocumentTaxIncomeRecord(
				{
					documentId: "document-1",
					decision: "paid",
					activityType: "fourth_special",
					receivedAt: "2026-08-20",
					grossAmount: "2500.00",
					withheldTaxAmount: "200.00",
					payerName: "Cliente SAC",
					notes: null,
				},
				1_777_000_000_000,
			),
		).toMatchObject({
			id: "pending:document:document-1",
			sourceDocumentId: "document-1",
			source: "document",
			status: "pending_sync",
			incomeType: "fourth_special",
		});
	});
});

describe("patchTaxIncomePages", () => {
	it("adds a pending create to the first page and updates the aggregate once", () => {
		const pending = pendingTaxIncomeRecord(
			{
				activityType: "fourth_special",
				receivedAt: "2026-08-20",
				grossAmount: "2500.00",
				withheldTaxAmount: "200.00",
				payerName: "Cliente SAC",
				notes: null,
				idempotencyKey: "request-2",
			},
			1_777_000_000_000,
		);

		const result = patchTaxIncomePages(pages, { kind: "create", record: pending });

		expect(result.pages[0]?.items.map((record) => record.id)).toEqual([
			"pending:request-2",
			"income-1",
		]);
		expect(result.pages[1]?.items).toHaveLength(1);
		expect(result.pages[0]?.summary).toEqual({
			grossAmount: "2600.00",
			withheldTaxAmount: "208.00",
			count: 2,
			fourthGrossAmount: "2600.00",
			employmentGrossAmount: "0.00",
			withheldFourth: "208.00",
			withheldFifth: "0.00",
			fourthCount: 2,
			employmentCount: 0,
		});
	});

	it("updates a record in any cached page and adjusts the aggregate by the delta", () => {
		const result = patchTaxIncomePages(pages, {
			kind: "update",
			recordId: "income-2",
			input: {
				activityType: "fourth_special",
				grossAmount: "175.50",
				withheldTaxAmount: "10.50",
				payerName: "Cliente actualizado",
			},
		});

		expect(result.pages[1]?.items[0]).toMatchObject({
			incomeType: "fourth_special",
			grossAmountPen: "175.50",
			withheldTaxAmountPen: "10.50",
			payerName: "Cliente actualizado",
			status: "pending_sync",
		});
		expect(result.pages[0]?.summary).toEqual({
			grossAmount: "175.50",
			withheldTaxAmount: "10.50",
			count: 1,
			fourthGrossAmount: "175.50",
			employmentGrossAmount: "0.00",
			withheldFourth: "10.50",
			withheldFifth: "0.00",
			fourthCount: 1,
			employmentCount: 0,
		});
	});

	it("removes a deleted record from any page and updates the aggregate", () => {
		const result = patchTaxIncomePages(pages, { kind: "delete", recordId: "income-2" });

		expect(result.pages[1]?.items).toEqual([]);
		expect(result.pages[0]?.summary).toEqual({
			grossAmount: "0.00",
			withheldTaxAmount: "0.00",
			count: 0,
			fourthGrossAmount: "0.00",
			employmentGrossAmount: "0.00",
			withheldFourth: "0.00",
			withheldFifth: "0.00",
			fourthCount: 0,
			employmentCount: 0,
		});
	});

	it("replaces the pending create with the committed server record without double counting", () => {
		const pending = { ...existingRecord, id: "pending:request-2", status: "pending_sync" as const };
		const withPending: InfiniteData<TaxIncomePage> = {
			pageParams: [undefined],
			pages: [
				{
					items: [pending],
					nextCursor: null,
					summary: fourthSummary,
				},
			],
		};

		const result = patchTaxIncomePages(withPending, {
			kind: "commit",
			optimisticId: "pending:request-2",
			record: { ...existingRecord, id: "income-created" },
		});

		expect(result.pages[0]?.items).toEqual([{ ...existingRecord, id: "income-created" }]);
		expect(result.pages[0]?.summary).toEqual({
			grossAmount: "100.00",
			withheldTaxAmount: "8.00",
			count: 1,
			fourthGrossAmount: "100.00",
			employmentGrossAmount: "0.00",
			withheldFourth: "8.00",
			withheldFifth: "0.00",
			fourthCount: 1,
			employmentCount: 0,
		});
	});

	it("removes an employment optimistic contribution when the server excludes it by coverage", () => {
		const pending = pendingTaxIncomeRecord(
			{
				incomeType: "employment",
				recordKind: "period",
				coverageStart: "2026-03-01",
				coverageEnd: "2026-03-31",
				coverageScope: "single_payer",
				grossAmount: "5000.00",
				withheldTaxAmount: "150.00",
				payerName: "ACME",
				payerTaxId: "20123456789",
				notes: null,
				idempotencyKey: "employment-1",
			},
			1_777_000_000_000,
		);
		const withPending: InfiniteData<TaxIncomePage> = {
			pageParams: [undefined],
			pages: [
				{
					items: [pending],
					nextCursor: null,
					summary: {
						grossAmount: "5000.00",
						withheldTaxAmount: "150.00",
						count: 1,
						fourthGrossAmount: "0.00",
						employmentGrossAmount: "5000.00",
						withheldFourth: "0.00",
						withheldFifth: "150.00",
						fourthCount: 0,
						employmentCount: 1,
					},
				},
			],
		};

		const result = patchTaxIncomePages(withPending, {
			kind: "commit",
			optimisticId: pending.id,
			record: {
				...pending,
				id: "server-employment-1",
				status: "confirmed",
				calculationDisposition: "excluded_by_coverage",
			},
		});

		expect(result.pages[0]?.summary).toMatchObject({
			grossAmount: "0.00",
			withheldTaxAmount: "0.00",
			count: 0,
			employmentGrossAmount: "0.00",
			withheldFifth: "0.00",
			employmentCount: 0,
		});
	});
});
