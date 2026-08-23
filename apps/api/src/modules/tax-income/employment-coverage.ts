import Decimal from "decimal.js";

export type TaxIncomeRecordKind = "period" | "year_to_date_snapshot";

export type CoverageScope = "single_payer" | "all_employers";

export type CalculationDisposition = "included" | "excluded_by_coverage" | "needs_resolution";

export type EmploymentCoverageStatus = "confirmed" | "pending";

export type CoverageResolutionReason =
	| "all_employers_snapshot_and_period"
	| "all_employers_snapshot_contains_record"
	| "exact_payer_tax_id_and_period"
	| "exact_payer_tax_id_and_coverage"
	| "exact_duplicate_period"
	| "normalized_payer_name_requires_confirmation"
	| "partial_coverage_overlap_requires_confirmation"
	| "unconfirmed_record_requires_confirmation"
	| "incompatible_coverage_requires_confirmation"
	| "conflicting_evidence_requires_confirmation"
	| "user_confirmed_separate_income"
	| "user_confirmed_covered_by_record";

export interface EmploymentCoverageRecord {
	readonly id: string;
	readonly taxProfileId: string;
	readonly recordKind: TaxIncomeRecordKind;
	readonly coverageStart: string;
	readonly coverageEnd: string;
	readonly coverageScope: CoverageScope;
	readonly payerTaxId: string | null;
	readonly payerName: string | null;
	readonly status: EmploymentCoverageStatus;
	readonly calculationDisposition: CalculationDisposition;
	readonly coveredByRecordId: string | null;
	readonly coverageResolutionReason?: CoverageResolutionReason | null;
	readonly grossAmount: string;
	readonly withheldTaxAmount: string;
	readonly sourceDocumentId: string | null;
}

export interface CoverageResolution {
	readonly recordId: string;
	readonly calculationDisposition: CalculationDisposition;
	readonly coveredByRecordId: string | null;
	readonly coverageResolutionReason: CoverageResolutionReason | null;
}

export type EmploymentCoverageIntegrityErrorCode =
	| "DUPLICATE_RECORD_ID"
	| "INVALID_COVERAGE_RANGE"
	| "DANGLING_COVERAGE"
	| "SELF_COVERAGE"
	| "CROSS_PROFILE_COVERAGE"
	| "COVERAGE_CYCLE";

export class EmploymentCoverageIntegrityError extends Error {
	constructor(
		readonly code: EmploymentCoverageIntegrityErrorCode,
		message: string,
	) {
		super(message);
		this.name = "EmploymentCoverageIntegrityError";
	}
}

type MutableResolution = {
	recordId: string;
	calculationDisposition: CalculationDisposition;
	coveredByRecordId: string | null;
	coverageResolutionReason: CoverageResolutionReason | null;
};

function getResolution(
	resolutions: ReadonlyMap<string, MutableResolution>,
	recordId: string,
): MutableResolution {
	const resolution = resolutions.get(recordId);
	if (!resolution)
		throw new EmploymentCoverageIntegrityError("DANGLING_COVERAGE", "Missing resolution");
	return resolution;
}

const includedResolution = (recordId: string): MutableResolution => ({
	recordId,
	calculationDisposition: "included",
	coveredByRecordId: null,
	coverageResolutionReason: null,
});

const initialResolution = (record: EmploymentCoverageRecord): MutableResolution => {
	if (record.coverageResolutionReason === "user_confirmed_separate_income") {
		return {
			...includedResolution(record.id),
			coverageResolutionReason: "user_confirmed_separate_income",
		};
	}
	if (
		record.coverageResolutionReason === "user_confirmed_covered_by_record" &&
		record.coveredByRecordId
	) {
		return {
			recordId: record.id,
			calculationDisposition: "excluded_by_coverage",
			coveredByRecordId: record.coveredByRecordId,
			coverageResolutionReason: "user_confirmed_covered_by_record",
		};
	}
	return record.status === "confirmed"
		? includedResolution(record.id)
		: {
				recordId: record.id,
				calculationDisposition: "needs_resolution",
				coveredByRecordId: null,
				coverageResolutionReason: "unconfirmed_record_requires_confirmation",
			};
};

function isManualResolution(resolution: MutableResolution): boolean {
	return (
		resolution.coverageResolutionReason === "user_confirmed_separate_income" ||
		resolution.coverageResolutionReason === "user_confirmed_covered_by_record"
	);
}

function normalizePayerName(value: string | null): string | null {
	if (!value) return null;
	const normalized = value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase("es-PE")
		.replace(/[^a-z0-9]/g, "");
	return normalized.length > 0 ? normalized : null;
}

function contains(
	container: EmploymentCoverageRecord,
	contained: EmploymentCoverageRecord,
): boolean {
	return (
		container.coverageStart <= contained.coverageStart &&
		container.coverageEnd >= contained.coverageEnd
	);
}

function overlaps(left: EmploymentCoverageRecord, right: EmploymentCoverageRecord): boolean {
	return left.coverageStart <= right.coverageEnd && right.coverageStart <= left.coverageEnd;
}

function hasExactPayer(left: EmploymentCoverageRecord, right: EmploymentCoverageRecord): boolean {
	return left.payerTaxId !== null && left.payerTaxId === right.payerTaxId;
}

function hasSuggestedPayerName(
	left: EmploymentCoverageRecord,
	right: EmploymentCoverageRecord,
): boolean {
	if (left.taxProfileId !== right.taxProfileId) return false;
	if (left.payerTaxId !== null && right.payerTaxId !== null) return false;
	const leftName = normalizePayerName(left.payerName);
	return leftName !== null && leftName === normalizePayerName(right.payerName);
}

function hasSameCoverageRange(
	left: EmploymentCoverageRecord,
	right: EmploymentCoverageRecord,
): boolean {
	return left.coverageStart === right.coverageStart && left.coverageEnd === right.coverageEnd;
}

function hasEquivalentCoveragePopulation(
	left: EmploymentCoverageRecord,
	right: EmploymentCoverageRecord,
): boolean {
	if (left.coverageScope !== right.coverageScope) return false;
	return left.coverageScope === "all_employers" || hasExactPayer(left, right);
}

function hasEquivalentEvidence(
	left: EmploymentCoverageRecord,
	right: EmploymentCoverageRecord,
): boolean {
	return (
		new Decimal(left.grossAmount).equals(right.grossAmount) &&
		new Decimal(left.withheldTaxAmount).equals(right.withheldTaxAmount) &&
		left.sourceDocumentId === right.sourceDocumentId
	);
}

function populationsMayOverlap(
	left: EmploymentCoverageRecord,
	right: EmploymentCoverageRecord,
): boolean {
	if (left.taxProfileId !== right.taxProfileId) return false;
	if (left.coverageScope === "all_employers" || right.coverageScope === "all_employers") {
		return true;
	}
	if (left.payerTaxId !== null && right.payerTaxId !== null) {
		return left.payerTaxId === right.payerTaxId;
	}
	return hasSuggestedPayerName(left, right);
}

function canAutomaticallyCover(
	provider: EmploymentCoverageRecord,
	target: EmploymentCoverageRecord,
): boolean {
	if (provider.status !== "confirmed" || provider.recordKind !== "year_to_date_snapshot") {
		return false;
	}
	if (!contains(provider, target) || provider.taxProfileId !== target.taxProfileId) return false;
	const coversTargetPopulation =
		provider.coverageScope === "all_employers" ||
		(target.coverageScope === "single_payer" && hasExactPayer(provider, target));
	if (!coversTargetPopulation) return false;

	if (hasSameCoverageRange(provider, target) && hasEquivalentCoveragePopulation(provider, target)) {
		return hasEquivalentEvidence(provider, target);
	}

	return true;
}

function automaticReason(
	provider: EmploymentCoverageRecord,
	target: EmploymentCoverageRecord,
): CoverageResolutionReason {
	if (provider.coverageScope === "all_employers") {
		return target.recordKind === "period"
			? "all_employers_snapshot_and_period"
			: "all_employers_snapshot_contains_record";
	}
	return target.recordKind === "period"
		? "exact_payer_tax_id_and_period"
		: "exact_payer_tax_id_and_coverage";
}

function compareProviderPriority(
	left: EmploymentCoverageRecord,
	right: EmploymentCoverageRecord,
): number {
	if (left.coverageScope !== right.coverageScope) {
		return left.coverageScope === "all_employers" ? -1 : 1;
	}
	return (
		left.coverageStart.localeCompare(right.coverageStart) ||
		right.coverageEnd.localeCompare(left.coverageEnd) ||
		left.id.localeCompare(right.id)
	);
}

function assertValidExistingCoverage(records: readonly EmploymentCoverageRecord[]): void {
	const byId = new Map<string, EmploymentCoverageRecord>();
	for (const record of records) {
		if (byId.has(record.id)) {
			throw new EmploymentCoverageIntegrityError(
				"DUPLICATE_RECORD_ID",
				`Duplicate employment coverage record: ${record.id}`,
			);
		}
		if (record.coverageStart > record.coverageEnd) {
			throw new EmploymentCoverageIntegrityError(
				"INVALID_COVERAGE_RANGE",
				`Invalid employment coverage range: ${record.id}`,
			);
		}
		byId.set(record.id, record);
	}

	for (const record of records) {
		const coveredById = record.coveredByRecordId;
		if (!coveredById) continue;
		if (coveredById === record.id) {
			throw new EmploymentCoverageIntegrityError(
				"SELF_COVERAGE",
				`Employment record cannot cover itself: ${record.id}`,
			);
		}
		const provider = byId.get(coveredById);
		if (!provider) {
			throw new EmploymentCoverageIntegrityError(
				"DANGLING_COVERAGE",
				`Coverage provider does not exist: ${coveredById}`,
			);
		}
		if (provider.taxProfileId !== record.taxProfileId) {
			throw new EmploymentCoverageIntegrityError(
				"CROSS_PROFILE_COVERAGE",
				`Coverage cannot cross tax profiles: ${record.id}`,
			);
		}
	}

	const visited = new Set<string>();
	const visiting = new Set<string>();
	const visit = (recordId: string): void => {
		if (visited.has(recordId)) return;
		if (visiting.has(recordId)) {
			throw new EmploymentCoverageIntegrityError(
				"COVERAGE_CYCLE",
				`Coverage cycle detected at: ${recordId}`,
			);
		}
		visiting.add(recordId);
		const coveredById = byId.get(recordId)?.coveredByRecordId;
		if (coveredById) visit(coveredById);
		visiting.delete(recordId);
		visited.add(recordId);
	};
	for (const record of records) visit(record.id);
}

function markNeedsResolution(
	resolution: MutableResolution,
	reason: CoverageResolutionReason,
): void {
	if (isManualResolution(resolution)) return;
	resolution.calculationDisposition = "needs_resolution";
	resolution.coveredByRecordId = null;
	resolution.coverageResolutionReason = reason;
}

/**
 * Resolves which confirmed employment records contribute to tax calculation.
 * The input is treated as immutable and every exclusion remains auditable.
 */
export function resolveEmploymentCoverage(
	records: readonly EmploymentCoverageRecord[],
): CoverageResolution[] {
	assertValidExistingCoverage(records);

	const resolutions = new Map(
		records.map((record) => [record.id, initialResolution(record)] as const),
	);
	const snapshots = records
		.filter(
			(record) => record.recordKind === "year_to_date_snapshot" && record.status === "confirmed",
		)
		.sort(compareProviderPriority);

	for (let leftIndex = 0; leftIndex < snapshots.length; leftIndex += 1) {
		const left = snapshots[leftIndex];
		if (!left) continue;
		for (let rightIndex = leftIndex + 1; rightIndex < snapshots.length; rightIndex += 1) {
			const right = snapshots[rightIndex];
			if (!right || !populationsMayOverlap(left, right) || !overlaps(left, right)) continue;
			const leftResolution = getResolution(resolutions, left.id);
			const rightResolution = getResolution(resolutions, right.id);
			if (
				(leftResolution.coverageResolutionReason === "user_confirmed_covered_by_record" &&
					leftResolution.coveredByRecordId === right.id) ||
				(rightResolution.coverageResolutionReason === "user_confirmed_covered_by_record" &&
					rightResolution.coveredByRecordId === left.id)
			) {
				continue;
			}

			if (canAutomaticallyCover(left, right) || canAutomaticallyCover(right, left)) continue;

			if (contains(left, right) || contains(right, left)) {
				const reason: CoverageResolutionReason = hasSuggestedPayerName(left, right)
					? "normalized_payer_name_requires_confirmation"
					: hasSameCoverageRange(left, right) && hasEquivalentCoveragePopulation(left, right)
						? "conflicting_evidence_requires_confirmation"
						: "incompatible_coverage_requires_confirmation";
				markNeedsResolution(getResolution(resolutions, left.id), reason);
				markNeedsResolution(getResolution(resolutions, right.id), reason);
				continue;
			}

			markNeedsResolution(
				getResolution(resolutions, left.id),
				"partial_coverage_overlap_requires_confirmation",
			);
			markNeedsResolution(
				getResolution(resolutions, right.id),
				"partial_coverage_overlap_requires_confirmation",
			);
		}
	}

	const activeProviders: EmploymentCoverageRecord[] = [];
	for (const snapshotRecord of snapshots) {
		const resolution = getResolution(resolutions, snapshotRecord.id);
		if (resolution.calculationDisposition !== "included") continue;
		if (resolution.coverageResolutionReason === "user_confirmed_separate_income") {
			activeProviders.push(snapshotRecord);
			activeProviders.sort(compareProviderPriority);
			continue;
		}

		const automaticProvider = activeProviders.find((provider) =>
			canAutomaticallyCover(provider, snapshotRecord),
		);
		if (automaticProvider) {
			resolution.calculationDisposition = "excluded_by_coverage";
			resolution.coveredByRecordId = automaticProvider.id;
			resolution.coverageResolutionReason = automaticReason(automaticProvider, snapshotRecord);
			continue;
		}

		const suggestedProvider = activeProviders.find(
			(provider) =>
				contains(provider, snapshotRecord) && hasSuggestedPayerName(provider, snapshotRecord),
		);
		if (suggestedProvider) {
			markNeedsResolution(resolution, "normalized_payer_name_requires_confirmation");
			continue;
		}

		activeProviders.push(snapshotRecord);
		activeProviders.sort(compareProviderPriority);
	}

	const periods = records
		.filter((record) => record.recordKind === "period")
		.sort(
			(left, right) =>
				left.coverageStart.localeCompare(right.coverageStart) ||
				left.coverageEnd.localeCompare(right.coverageEnd) ||
				left.id.localeCompare(right.id),
		);
	const includedPeriods: EmploymentCoverageRecord[] = [];
	for (const periodRecord of periods) {
		const resolution = getResolution(resolutions, periodRecord.id);
		if (resolution.calculationDisposition !== "included") continue;
		if (resolution.coverageResolutionReason === "user_confirmed_separate_income") {
			includedPeriods.push(periodRecord);
			continue;
		}
		const automaticProvider = activeProviders.find((provider) =>
			canAutomaticallyCover(provider, periodRecord),
		);
		if (automaticProvider) {
			resolution.calculationDisposition = "excluded_by_coverage";
			resolution.coveredByRecordId = automaticProvider.id;
			resolution.coverageResolutionReason = automaticReason(automaticProvider, periodRecord);
			continue;
		}

		const suggestedProvider = activeProviders.find(
			(provider) =>
				contains(provider, periodRecord) && hasSuggestedPayerName(provider, periodRecord),
		);
		if (suggestedProvider) {
			markNeedsResolution(resolution, "normalized_payer_name_requires_confirmation");
			continue;
		}

		const partialProvider = activeProviders.find(
			(provider) =>
				populationsMayOverlap(provider, periodRecord) &&
				overlaps(provider, periodRecord) &&
				!contains(provider, periodRecord),
		);
		if (partialProvider) {
			markNeedsResolution(resolution, "partial_coverage_overlap_requires_confirmation");
			continue;
		}

		const duplicatePeriod = includedPeriods.find(
			(included) =>
				included.taxProfileId === periodRecord.taxProfileId &&
				included.coverageStart === periodRecord.coverageStart &&
				included.coverageEnd === periodRecord.coverageEnd &&
				included.coverageScope === periodRecord.coverageScope &&
				hasExactPayer(included, periodRecord),
		);
		if (duplicatePeriod) {
			const duplicateResolution = getResolution(resolutions, duplicatePeriod.id);
			if (
				duplicateResolution.calculationDisposition === "included" &&
				hasEquivalentEvidence(duplicatePeriod, periodRecord)
			) {
				resolution.calculationDisposition = "excluded_by_coverage";
				resolution.coveredByRecordId = duplicatePeriod.id;
				resolution.coverageResolutionReason = "exact_duplicate_period";
			} else {
				markNeedsResolution(duplicateResolution, "conflicting_evidence_requires_confirmation");
				markNeedsResolution(resolution, "conflicting_evidence_requires_confirmation");
			}
			continue;
		}

		const suggestedDuplicate = includedPeriods.find(
			(included) =>
				included.taxProfileId === periodRecord.taxProfileId &&
				included.coverageStart === periodRecord.coverageStart &&
				included.coverageEnd === periodRecord.coverageEnd &&
				hasSuggestedPayerName(included, periodRecord),
		);
		if (suggestedDuplicate) {
			markNeedsResolution(resolution, "normalized_payer_name_requires_confirmation");
			continue;
		}

		includedPeriods.push(periodRecord);
	}

	return records.map((record) => ({ ...getResolution(resolutions, record.id) }));
}
