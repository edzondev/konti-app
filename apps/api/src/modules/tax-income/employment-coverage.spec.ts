import {
	EmploymentCoverageIntegrityError,
	type EmploymentCoverageRecord,
	resolveEmploymentCoverage,
} from "./employment-coverage";

const profileId = "11111111-1111-4111-8111-111111111111";
const otherProfileId = "22222222-2222-4222-8222-222222222222";

function period(
	id: string,
	payerTaxId: string | null,
	coverageStart = "2026-03-01",
	coverageEnd = "2026-03-31",
): EmploymentCoverageRecord {
	return {
		id,
		taxProfileId: profileId,
		recordKind: "period",
		coverageStart,
		coverageEnd,
		coverageScope: "single_payer",
		payerTaxId,
		payerName: "ACME SAC",
		status: "confirmed",
		calculationDisposition: "included",
		coveredByRecordId: null,
		grossAmount: "5000.00",
		withheldTaxAmount: "150.00",
		sourceDocumentId: `document-${id}`,
	};
}

function snapshot(
	id: string,
	options: Partial<EmploymentCoverageRecord> = {},
): EmploymentCoverageRecord {
	return {
		id,
		taxProfileId: profileId,
		recordKind: "year_to_date_snapshot",
		coverageStart: "2026-01-01",
		coverageEnd: "2026-06-30",
		coverageScope: "single_payer",
		payerTaxId: "20123456789",
		payerName: "ACME SAC",
		status: "confirmed",
		calculationDisposition: "included",
		coveredByRecordId: null,
		grossAmount: "30000.00",
		withheldTaxAmount: "900.00",
		sourceDocumentId: `document-${id}`,
		...options,
	};
}

describe("resolveEmploymentCoverage", () => {
	it("excludes a contained period when a confirmed snapshot has the exact payer tax id", () => {
		const result = resolveEmploymentCoverage([period("march", "20123456789"), snapshot("jan-jun")]);

		expect(result).toContainEqual({
			recordId: "march",
			calculationDisposition: "excluded_by_coverage",
			coveredByRecordId: "jan-jun",
			coverageResolutionReason: "exact_payer_tax_id_and_period",
		});
	});

	it("lets a confirmed all-employer snapshot cover contained periods from different payers", () => {
		const result = resolveEmploymentCoverage([
			period("acme-march", "20123456789"),
			{
				...period("beta-april", "20987654321", "2026-04-01", "2026-04-30"),
				payerName: "Beta SAC",
			},
			snapshot("all-jan-jun", {
				coverageScope: "all_employers",
				payerTaxId: null,
				payerName: null,
			}),
		]);

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					recordId: "acme-march",
					calculationDisposition: "excluded_by_coverage",
					coveredByRecordId: "all-jan-jun",
					coverageResolutionReason: "all_employers_snapshot_and_period",
				}),
				expect.objectContaining({
					recordId: "beta-april",
					calculationDisposition: "excluded_by_coverage",
					coveredByRecordId: "all-jan-jun",
				}),
			]),
		);
	});

	it("keeps a period after the snapshot range included", () => {
		const result = resolveEmploymentCoverage([
			snapshot("jan-jun"),
			period("july", "20123456789", "2026-07-01", "2026-07-31"),
		]);

		expect(result).toContainEqual({
			recordId: "july",
			calculationDisposition: "included",
			coveredByRecordId: null,
			coverageResolutionReason: null,
		});
	});

	it("does not let a single-payer snapshot exclude a simultaneous second employer", () => {
		const result = resolveEmploymentCoverage([
			snapshot("acme-jan-jun"),
			period("acme-march", "20123456789"),
			{ ...period("beta-march", "20987654321"), payerName: "Beta SAC" },
		]);

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					recordId: "acme-march",
					calculationDisposition: "excluded_by_coverage",
				}),
				{
					recordId: "beta-march",
					calculationDisposition: "included",
					coveredByRecordId: null,
					coverageResolutionReason: null,
				},
			]),
		);
	});

	it("marks a normalized name-only overlap for review instead of excluding it", () => {
		const result = resolveEmploymentCoverage([
			{ ...period("march", null), payerName: "ACME SAC" },
			snapshot("jan-jun", { payerTaxId: null, payerName: "Acme S.A.C." }),
		]);

		expect(result).toContainEqual({
			recordId: "march",
			calculationDisposition: "needs_resolution",
			coveredByRecordId: null,
			coverageResolutionReason: "normalized_payer_name_requires_confirmation",
		});
	});

	it("chooses one deterministic winner for exact duplicate snapshots", () => {
		const firstOrder = resolveEmploymentCoverage([
			snapshot("snapshot-b", { sourceDocumentId: "same-evidence" }),
			snapshot("snapshot-a", { sourceDocumentId: "same-evidence" }),
		]);
		const reverseOrder = resolveEmploymentCoverage([
			snapshot("snapshot-a", { sourceDocumentId: "same-evidence" }),
			snapshot("snapshot-b", { sourceDocumentId: "same-evidence" }),
		]);

		for (const result of [firstOrder, reverseOrder]) {
			expect(result).toEqual(
				expect.arrayContaining([
					{
						recordId: "snapshot-a",
						calculationDisposition: "included",
						coveredByRecordId: null,
						coverageResolutionReason: null,
					},
					expect.objectContaining({
						recordId: "snapshot-b",
						calculationDisposition: "excluded_by_coverage",
						coveredByRecordId: "snapshot-a",
					}),
				]),
			);
		}
	});

	it("marks partially overlapping accumulated ranges for review", () => {
		const result = resolveEmploymentCoverage([
			snapshot("jan-jun"),
			snapshot("may-aug", {
				coverageStart: "2026-05-01",
				coverageEnd: "2026-08-31",
			}),
		]);

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					recordId: "jan-jun",
					calculationDisposition: "needs_resolution",
					coverageResolutionReason: "partial_coverage_overlap_requires_confirmation",
				}),
				expect.objectContaining({
					recordId: "may-aug",
					calculationDisposition: "needs_resolution",
					coverageResolutionReason: "partial_coverage_overlap_requires_confirmation",
				}),
			]),
		);
	});

	it("does not use an unconfirmed snapshot as automatic coverage", () => {
		const result = resolveEmploymentCoverage([
			period("march", "20123456789"),
			snapshot("pending-snapshot", { status: "pending" }),
		]);

		expect(result).toContainEqual({
			recordId: "march",
			calculationDisposition: "included",
			coveredByRecordId: null,
			coverageResolutionReason: null,
		});
		expect(result).toContainEqual({
			recordId: "pending-snapshot",
			calculationDisposition: "needs_resolution",
			coveredByRecordId: null,
			coverageResolutionReason: "unconfirmed_record_requires_confirmation",
		});
	});

	it("does not let a name-only suggestion cross tax profiles", () => {
		const foreignSnapshot = snapshot("foreign-jan-jun", {
			taxProfileId: otherProfileId,
			payerTaxId: null,
			payerName: "Acme S.A.C.",
		});
		const localPeriod = { ...period("local-march", null), payerName: "ACME SAC" };

		const result = resolveEmploymentCoverage([foreignSnapshot, localPeriod]);

		expect(result).toContainEqual({
			recordId: "local-march",
			calculationDisposition: "included",
			coveredByRecordId: null,
			coverageResolutionReason: null,
		});
	});

	it("marks incompatible contained scopes for review instead of summing both", () => {
		const result = resolveEmploymentCoverage([
			snapshot("acme-year", {
				coverageStart: "2026-01-01",
				coverageEnd: "2026-12-31",
			}),
			snapshot("all-feb-jun", {
				coverageStart: "2026-02-01",
				coverageEnd: "2026-06-30",
				coverageScope: "all_employers",
				payerTaxId: null,
				payerName: null,
			}),
		]);

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					recordId: "acme-year",
					calculationDisposition: "needs_resolution",
					coverageResolutionReason: "incompatible_coverage_requires_confirmation",
				}),
				expect.objectContaining({
					recordId: "all-feb-jun",
					calculationDisposition: "needs_resolution",
					coverageResolutionReason: "incompatible_coverage_requires_confirmation",
				}),
			]),
		);
	});

	it("does not auto-discard same-range snapshots with different amounts", () => {
		const result = resolveEmploymentCoverage([
			snapshot("original", {
				grossAmount: "30000.00",
				withheldTaxAmount: "900.00",
				sourceDocumentId: "certificate-original",
			}),
			snapshot("corrected", {
				grossAmount: "32000.00",
				withheldTaxAmount: "1100.00",
				sourceDocumentId: "certificate-corrected",
			}),
		]);

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					recordId: "original",
					calculationDisposition: "needs_resolution",
					coverageResolutionReason: "conflicting_evidence_requires_confirmation",
				}),
				expect.objectContaining({
					recordId: "corrected",
					calculationDisposition: "needs_resolution",
					coverageResolutionReason: "conflicting_evidence_requires_confirmation",
				}),
			]),
		);
	});

	it("does not auto-discard same-period records with different evidence or amounts", () => {
		const first = period("payroll-a", "20123456789");
		const second = {
			...period("payroll-b", "20123456789"),
			grossAmount: "5500.00",
			withheldTaxAmount: "180.00",
		};

		const result = resolveEmploymentCoverage([first, second]);

		expect(result).not.toContainEqual(
			expect.objectContaining({ calculationDisposition: "excluded_by_coverage" }),
		);
		expect(result).toContainEqual(
			expect.objectContaining({
				recordId: "payroll-b",
				calculationDisposition: "needs_resolution",
				coverageResolutionReason: "conflicting_evidence_requires_confirmation",
			}),
		);
	});

	it("excludes an exact duplicate period only when amounts and evidence match", () => {
		const first = { ...period("payroll-a", "20123456789"), sourceDocumentId: "same-evidence" };
		const second = { ...period("payroll-b", "20123456789"), sourceDocumentId: "same-evidence" };

		const result = resolveEmploymentCoverage([first, second]);

		expect(result).toContainEqual({
			recordId: "payroll-b",
			calculationDisposition: "excluded_by_coverage",
			coveredByRecordId: "payroll-a",
			coverageResolutionReason: "exact_duplicate_period",
		});
	});

	it("rejects duplicate record identifiers", () => {
		expect(() =>
			resolveEmploymentCoverage([
				period("duplicate", "20123456789"),
				period("duplicate", "20123456789"),
			]),
		).toThrow(
			expect.objectContaining<Partial<EmploymentCoverageIntegrityError>>({
				code: "DUPLICATE_RECORD_ID",
			}),
		);
	});

	it("rejects an inverted coverage range", () => {
		expect(() =>
			resolveEmploymentCoverage([period("invalid", "20123456789", "2026-04-01", "2026-03-31")]),
		).toThrow(
			expect.objectContaining<Partial<EmploymentCoverageIntegrityError>>({
				code: "INVALID_COVERAGE_RANGE",
			}),
		);
	});

	it("rejects a dangling existing coverage link", () => {
		const dangling = {
			...period("march", "20123456789"),
			coveredByRecordId: "missing-provider",
		};

		expect(() => resolveEmploymentCoverage([dangling])).toThrow(
			expect.objectContaining<Partial<EmploymentCoverageIntegrityError>>({
				code: "DANGLING_COVERAGE",
			}),
		);
	});

	it("rejects an existing self-reference", () => {
		const selfCovered = {
			...period("march", "20123456789"),
			coveredByRecordId: "march",
		};

		expect(() => resolveEmploymentCoverage([selfCovered])).toThrow(
			expect.objectContaining<Partial<EmploymentCoverageIntegrityError>>({
				code: "SELF_COVERAGE",
			}),
		);
	});

	it("rejects a cycle in existing coverage links", () => {
		const first = snapshot("first", { coveredByRecordId: "second" });
		const second = snapshot("second", { coveredByRecordId: "first" });

		expect(() => resolveEmploymentCoverage([first, second])).toThrow(
			expect.objectContaining<Partial<EmploymentCoverageIntegrityError>>({
				code: "COVERAGE_CYCLE",
			}),
		);
	});

	it("rejects an existing link to a record from another tax profile", () => {
		const source = {
			...period("march", "20123456789"),
			coveredByRecordId: "foreign-snapshot",
		};
		const foreign = snapshot("foreign-snapshot", { taxProfileId: otherProfileId });

		expect(() => resolveEmploymentCoverage([source, foreign])).toThrow(
			expect.objectContaining<Partial<EmploymentCoverageIntegrityError>>({
				code: "CROSS_PROFILE_COVERAGE",
			}),
		);
	});

	it("does not mutate canonical records while recalculating dispositions", () => {
		const records = [period("march", "20123456789"), snapshot("jan-jun")];
		const before = structuredClone(records);

		resolveEmploymentCoverage(records);

		expect(records).toEqual(before);
	});

	it("preserves a user decision that overlapping records are separate incomes", () => {
		const first = {
			...period("payroll-a", "20123456789"),
			grossAmount: "5000.00",
			coverageResolutionReason: "user_confirmed_separate_income" as const,
		};
		const second = {
			...period("payroll-b", "20123456789"),
			grossAmount: "5500.00",
			coverageResolutionReason: "user_confirmed_separate_income" as const,
		};

		expect(resolveEmploymentCoverage([first, second])).toEqual([
			{
				recordId: "payroll-a",
				calculationDisposition: "included",
				coveredByRecordId: null,
				coverageResolutionReason: "user_confirmed_separate_income",
			},
			{
				recordId: "payroll-b",
				calculationDisposition: "included",
				coveredByRecordId: null,
				coverageResolutionReason: "user_confirmed_separate_income",
			},
		]);
	});

	it("preserves a user-confirmed coverage exclusion", () => {
		const provider = snapshot("certificate", { grossAmount: "32000.00" });
		const covered = {
			...period("payroll", "20123456789"),
			calculationDisposition: "excluded_by_coverage" as const,
			coveredByRecordId: "certificate",
			coverageResolutionReason: "user_confirmed_covered_by_record" as const,
		};

		expect(resolveEmploymentCoverage([covered, provider])).toContainEqual({
			recordId: "payroll",
			calculationDisposition: "excluded_by_coverage",
			coveredByRecordId: "certificate",
			coverageResolutionReason: "user_confirmed_covered_by_record",
		});
	});
});
