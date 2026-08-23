import { Inject, Injectable } from "@nestjs/common";
import type { AttentionPriority } from "../../database/schema/schema.types";
import {
	ATTENTION_REPOSITORY,
	type AttentionRepositoryPort,
	type HomeAttentionItem,
	type OpenAttentionReadModel,
	type OpenAttentionRow,
} from "./attention.types";

const PRIORITY_RANK: Readonly<Record<AttentionPriority, number>> = {
	urgent: 0,
	high: 1,
	normal: 2,
	low: 3,
};

function stringValue(value: unknown): string | null {
	return typeof value === "string" && value.length > 0 ? value : null;
}

function projectAttention(row: OpenAttentionRow): HomeAttentionItem | null {
	const description = row.message ?? "Revisa esta información antes de continuar.";
	if (row.itemType === "confirm_fourth_income" || row.itemType === "confirm_rhe_payment") {
		const documentId = stringValue(row.actionPayload.documentId) ?? row.documentId;
		const classificationTask =
			row.actionPayload.attentionKind === "classify_fourth_activity" ||
			row.resolution?.decision === "activity_unsure";
		return documentId
			? {
					id: row.id,
					itemType: classificationTask ? "classify_fourth_activity" : "confirm_rhe_payment",
					title: row.title,
					description,
					action: classificationTask
						? { kind: "classify_fourth_activity", documentId }
						: { kind: "review_rhe_payment", documentId },
				}
			: null;
	}

	if (row.itemType === "resolve_employment_coverage") {
		const recordId = stringValue(row.actionPayload.recordId);
		return recordId
			? {
					id: row.id,
					itemType: "resolve_employment_coverage",
					title: row.title,
					description,
					action: { kind: "resolve_employment_coverage", recordId },
				}
			: null;
	}

	if (row.itemType === "review_tax_deduction" || row.itemType === "verify_deduction") {
		const deductionId =
			stringValue(row.actionPayload.deductionId) ?? stringValue(row.actionPayload.recordId);
		return deductionId
			? {
					id: row.id,
					itemType: "verify_deduction",
					title: row.title,
					description,
					action: { kind: "verify_deduction", deductionId },
				}
			: null;
	}

	if (row.itemType === "review_monthly_fourth") {
		const period = stringValue(row.actionPayload.period);
		return period && /^2026-(?:0[1-9]|1[0-2])$/.test(period)
			? {
					id: row.id,
					itemType: "review_monthly_fourth",
					title: row.title,
					description,
					action: { kind: "review_monthly_fourth", period },
				}
			: null;
	}

	return null;
}

function compareAttention(left: OpenAttentionRow, right: OpenAttentionRow): number {
	return (
		PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority] ||
		left.createdAt.getTime() - right.createdAt.getTime() ||
		left.id.localeCompare(right.id)
	);
}

export function selectPrimaryAttention(
	rows: readonly OpenAttentionRow[],
): HomeAttentionItem | null {
	for (const row of [...rows].sort(compareAttention)) {
		const projected = projectAttention(row);
		if (projected) return projected;
	}
	return null;
}

@Injectable()
export class AttentionService {
	constructor(
		@Inject(ATTENTION_REPOSITORY)
		private readonly repository: AttentionRepositoryPort,
	) {}

	async getOpenForUser(userId: string, taxYear: 2026, limit = 20): Promise<OpenAttentionReadModel> {
		const boundedLimit = Math.max(1, Math.min(20, Math.trunc(limit)));
		const { rows, totalCount } = await this.repository.readOpenOwned(userId, taxYear, boundedLimit);
		const sortedRows = [...rows].sort(compareAttention);
		const items = sortedRows.flatMap((row) => {
			const item = projectAttention(row);
			return item ? [item] : [];
		});

		return {
			count: totalCount,
			items,
			nextItem: items[0] ?? null,
		};
	}
}
