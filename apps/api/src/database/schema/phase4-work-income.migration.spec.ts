import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = join(process.cwd(), "drizzle", "0007_phase4_work_income_4_1_to_4_6.sql");
const migrationSql = readFileSync(migrationPath, "utf8");
const normalizedSql = migrationSql.replace(/\s+/g, " ");

function requiredPosition(fragment: string): number {
	const position = migrationSql.indexOf(fragment);
	expect(position).toBeGreaterThanOrEqual(0);
	return position;
}

describe("phase 4 work-income migration", () => {
	it("preflights and backfills legacy fourth income before relaxing received_at and adding constraints", () => {
		const lastAddedColumn = requiredPosition(
			'ALTER TABLE "tax_profiles" ADD COLUMN "deduction_dni_last4" char(4);',
		);
		const preflight = requiredPosition("DO $$");
		const backfill = requiredPosition('UPDATE "tax_income_records"');
		const dropReceivedAtNotNull = requiredPosition(
			'ALTER TABLE "tax_income_records" ALTER COLUMN "received_at" DROP NOT NULL;',
		);
		const firstForeignKey = requiredPosition('ALTER TABLE "tax_deduction_records" ADD CONSTRAINT');
		const firstIncomeCheck = requiredPosition(
			'ALTER TABLE "tax_income_records" ADD CONSTRAINT "tax_income_records_kind_shape_check"',
		);

		expect(lastAddedColumn).toBeLessThan(preflight);
		expect(preflight).toBeLessThan(backfill);
		expect(backfill).toBeLessThan(dropReceivedAtNotNull);
		expect(dropReceivedAtNotNull).toBeLessThan(firstForeignKey);
		expect(dropReceivedAtNotNull).toBeLessThan(firstIncomeCheck);
	});

	it("aborts unsupported historical income types and sources instead of inferring employment", () => {
		expect(normalizedSql).toContain(
			"\"income_type\" NOT IN ('independent_services', 'fourth_ordinary', 'fourth_special')",
		);
		expect(normalizedSql).toContain(
			"\"source\" NOT IN ('manual', 'document', 'import', 'integration')",
		);
		expect(normalizedSql).toContain("RAISE EXCEPTION");
		expect(normalizedSql).not.toContain("WHEN \"income_type\" = 'employment' THEN");
	});

	it("backfills every fourth row, including soft-deleted rows, with canonical defaults", () => {
		const start = requiredPosition('UPDATE "tax_income_records"');
		const end = migrationSql.indexOf("--> statement-breakpoint", start);
		expect(end).toBeGreaterThan(start);
		const backfill = migrationSql.slice(start, end).replace(/\s+/g, " ");

		expect(backfill).toContain(
			"WHERE \"income_type\" IN ('independent_services', 'fourth_ordinary', 'fourth_special')",
		);
		expect(backfill).toContain(
			'"income_type" = CASE WHEN "income_type" = \'independent_services\' THEN \'fourth_ordinary\' ELSE "income_type" END',
		);
		expect(backfill).toContain("\"activity_classification_source\" = 'migrated_default'");
		expect(backfill).toContain("\"record_kind\" = 'payment'");
		expect(backfill).toContain("\"calculation_disposition\" = 'included'");
		expect(backfill).not.toContain("deleted_at");
	});

	it("preserves immutable evaluations and the reviewed relational invariants", () => {
		expect(normalizedSql).not.toMatch(/(?:UPDATE|DELETE FROM|ALTER TABLE) "tax_evaluations"/);
		expect(normalizedSql).toContain(
			'FOREIGN KEY ("covered_by_record_id") REFERENCES "public"."tax_income_records"("id") ON DELETE no action ON UPDATE no action',
		);
		expect(normalizedSql).toContain(
			'CREATE UNIQUE INDEX "tax_filing_records_profile_period_form_active_uidx" ON "tax_filing_records" USING btree ("tax_profile_id","period","form_type")',
		);
		expect(normalizedSql).toContain("\"coverage_scope\" IN ('single_payer', 'all_employers')");
	});
});
