import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "src/database/database.constants";
import type { Database } from "src/database/database.types";
import { taxProfiles } from "src/database/schema";
import type { UpdateTaxProfileInput } from "./tax-profile.validation";

const PERU_TIMEZONE = "America/Lima";

function getCurrentTaxYear() {
	const year = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		timeZone: PERU_TIMEZONE,
	}).format(new Date());

	return Number(year);
}

@Injectable()
export class TaxProfileService {
	constructor(
		@Inject(DATABASE)
		private readonly db: Database,
	) {}

	async getCurrentUser(userId: string) {
		const taxYear = getCurrentTaxYear();

		const [profile] = await this.db
			.select()
			.from(taxProfiles)
			.where(and(eq(taxProfiles.userId, userId), eq(taxProfiles.taxYear, taxYear)))
			.limit(1);

		return {
			taxYear,
			requiresOnboarding: profile?.status !== "complete",
			profile: profile ? this.toResponse(profile) : null,
		};
	}

	async upsertCurrent(userId: string, input: UpdateTaxProfileInput) {
		const taxYear = getCurrentTaxYear();
		const now = new Date();

		const [profile] = await this.db
			.insert(taxProfiles)
			.values({
				userId,
				taxYear,
				incomeMode: input.incomeMode,
				status: "complete",
				completedAt: now,
			})
			.onConflictDoUpdate({
				target: [taxProfiles.userId, taxProfiles.taxYear],
				set: {
					incomeMode: input.incomeMode,
					status: "complete",
					completedAt: now,
					updatedAt: now,
				},
			})
			.returning();

		if (!profile) {
			throw new Error("Tax profile could not be persisted");
		}

		return {
			taxYear,
			requiresOnboarding: false,
			profile: this.toResponse(profile),
		};
	}

	private toResponse(profile: typeof taxProfiles.$inferSelect) {
		return {
			id: profile.id,
			taxYear: profile.taxYear,
			incomeMode: profile.incomeMode,
			status: profile.status,
			jurisdictionCode: profile.jurisdictionCode,
			currencyCode: profile.currencyCode,
			timezone: profile.timezone,
			completedAt: profile.completedAt,
		};
	}
}
