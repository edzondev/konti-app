import { Inject, Injectable } from "@nestjs/common";
import { and, asc, count, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import type { Database, DatabaseExecutor } from "../../database/database.types";
import { attentionItems, taxProfiles } from "../../database/schema";
import {
	type AttentionRepositoryPort,
	OPEN_ACTIONABLE_ITEM_TYPES,
	type OpenAttentionRepositoryResult,
} from "./attention.types";

function hasActionablePayload() {
	return or(
		and(
			inArray(attentionItems.itemType, ["confirm_fourth_income", "confirm_rhe_payment"]),
			or(
				isNotNull(attentionItems.documentId),
				sql<boolean>`${attentionItems.actionPayload} ->> 'documentId' <> ''`,
			),
		),
		and(
			eq(attentionItems.itemType, "resolve_employment_coverage"),
			sql<boolean>`${attentionItems.actionPayload} ->> 'recordId' <> ''`,
		),
		and(
			inArray(attentionItems.itemType, ["review_tax_deduction", "verify_deduction"]),
			or(
				sql<boolean>`${attentionItems.actionPayload} ->> 'deductionId' <> ''`,
				sql<boolean>`${attentionItems.actionPayload} ->> 'recordId' <> ''`,
			),
		),
		and(
			eq(attentionItems.itemType, "review_monthly_fourth"),
			sql<boolean>`${attentionItems.actionPayload} ->> 'period' ~ '^2026-(0[1-9]|1[0-2])$'`,
		),
	);
}

@Injectable()
export class AttentionRepository implements AttentionRepositoryPort {
	constructor(
		@Inject(DATABASE)
		private readonly db: Database,
	) {}

	async readOpenOwned(
		userId: string,
		taxYear: 2026,
		limit: number,
	): Promise<OpenAttentionRepositoryResult> {
		return this.db.transaction(
			async (transaction) => {
				const [rows, summary] = await Promise.all([
					this.listOpenOwned(transaction, userId, taxYear, limit),
					this.summarizeOpenOwned(transaction, userId, taxYear),
				]);
				return {
					rows,
					totalCount: summary?.totalCount ?? 0,
				};
			},
			{ isolationLevel: "repeatable read", accessMode: "read only" },
		);
	}

	private async listOpenOwned(
		database: DatabaseExecutor,
		userId: string,
		taxYear: 2026,
		limit: number,
	) {
		const priorityRank = sql<number>`case ${attentionItems.priority}
			when 'urgent' then 0
			when 'high' then 1
			when 'normal' then 2
			else 3
		end`;

		return database
			.select({
				id: attentionItems.id,
				itemType: attentionItems.itemType,
				priority: attentionItems.priority,
				title: attentionItems.title,
				message: attentionItems.message,
				actionType: attentionItems.actionType,
				actionPayload: attentionItems.actionPayload,
				documentId: attentionItems.documentId,
				resolution: attentionItems.resolution,
				createdAt: attentionItems.createdAt,
			})
			.from(attentionItems)
			.innerJoin(taxProfiles, eq(taxProfiles.id, attentionItems.taxProfileId))
			.where(
				and(
					eq(taxProfiles.userId, userId),
					eq(taxProfiles.taxYear, taxYear),
					eq(attentionItems.status, "open"),
					inArray(attentionItems.itemType, [...OPEN_ACTIONABLE_ITEM_TYPES]),
					hasActionablePayload(),
				),
			)
			.orderBy(asc(priorityRank), asc(attentionItems.createdAt), asc(attentionItems.id))
			.limit(limit);
	}

	private async summarizeOpenOwned(database: DatabaseExecutor, userId: string, taxYear: 2026) {
		const [summary] = await database
			.select({ totalCount: count() })
			.from(attentionItems)
			.innerJoin(taxProfiles, eq(taxProfiles.id, attentionItems.taxProfileId))
			.where(
				and(
					eq(taxProfiles.userId, userId),
					eq(taxProfiles.taxYear, taxYear),
					eq(attentionItems.status, "open"),
					inArray(attentionItems.itemType, [...OPEN_ACTIONABLE_ITEM_TYPES]),
					hasActionablePayload(),
				),
			);
		return summary;
	}
}
