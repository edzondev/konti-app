import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import {
	taxFilingRecords,
	taxFourthSuspensions,
	taxPaymentRecords,
	taxPeriodReviews,
} from "./core.schema";

describe("monthly fourth-category schema", () => {
	it.each([
		["period review", taxPeriodReviews],
		["suspension", taxFourthSuspensions],
		["payment", taxPaymentRecords],
	] as const)("keeps one active %s fact per profile and period", (_name, table) => {
		const config = getTableConfig(table);
		const activeIndex = config.indexes.find((index) =>
			index.config.name?.endsWith("profile_period_active_uidx"),
		);
		const idempotencyIndex = config.indexes.find((index) =>
			index.config.name?.endsWith("profile_idempotency_uidx"),
		);

		expect(activeIndex?.config.unique).toBe(true);
		expect(activeIndex?.config.where).toBeDefined();
		expect(idempotencyIndex?.config.unique).toBe(true);
	});

	it("keeps one active filing per profile, period and form", () => {
		const config = getTableConfig(taxFilingRecords);
		const activeIndex = config.indexes.find(
			(index) => index.config.name === "tax_filing_records_profile_period_form_active_uidx",
		);

		expect(activeIndex?.config.unique).toBe(true);
		expect(activeIndex?.config.where).toBeDefined();
		expect(
			activeIndex?.config.columns.map((column) => ("name" in column ? column.name : undefined)),
		).toEqual(["tax_profile_id", "period", "form_type"]);
	});

	it("enforces suspension effectiveness and restart dates in the database", () => {
		const config = getTableConfig(taxFourthSuspensions);
		const shapeCheck = config.checks.find(
			(constraint) => constraint.name === "tax_fourth_suspensions_shape_check",
		);
		if (!shapeCheck) throw new Error("Missing suspension shape constraint");
		const query = new PgDialect()
			.sqlToQuery(shapeCheck.value)
			.sql.replace(/"tax_fourth_suspensions"\./g, "")
			.replace(/\s+/g, " ");

		expect(query).toContain('"effective_from" = "authorization_date" + 1');
		expect(query).toContain("\"valid_through\" = '2026-12-31'");
		expect(query).toContain('"restart_date" >= "effective_from"');
		expect(query).toContain('"restart_date" <= "valid_through"');
	});

	it("stores filing and payment as independent resources", () => {
		const filing = getTableConfig(taxFilingRecords);
		const payment = getTableConfig(taxPaymentRecords);

		expect(filing.name).toBe("tax_filing_records");
		expect(payment.name).toBe("tax_payment_records");
		expect(filing.columns.map((column) => column.name)).toContain("filed_at");
		expect(filing.columns.map((column) => column.name)).not.toContain("paid_at");
		expect(payment.columns.map((column) => column.name)).toContain("paid_at");
		expect(payment.columns.map((column) => column.name)).not.toContain("filed_at");
	});

	it("does not persist a generic month-complete flag", () => {
		const columns = getTableConfig(taxPeriodReviews).columns.map((column) => column.name);

		expect(columns).not.toContain("complete");
		expect(columns).not.toContain("is_complete");
		expect(columns).toEqual(
			expect.arrayContaining(["coverage", "activity_classification", "period"]),
		);
	});
});
