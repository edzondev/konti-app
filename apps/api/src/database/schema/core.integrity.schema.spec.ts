import { getTableConfig, PgDialect, type PgTable } from "drizzle-orm/pg-core";
import {
	taxDeductionRecords,
	taxFilingRecords,
	taxFourthSuspensions,
	taxIncomeRecords,
	taxPaymentRecords,
} from "./core.schema";

const dialect = new PgDialect();

function constraintSql(table: PgTable, name: string): string {
	const constraint = getTableConfig(table).checks.find((check) => check.name === name);
	if (!constraint) throw new Error(`Missing schema constraint: ${name}`);
	return dialect.sqlToQuery(constraint.value).sql.replace(/\s+/g, " ");
}

describe("tax schema integrity", () => {
	it("preserves covered employment links while allowing profile cascades", () => {
		const config = getTableConfig(taxIncomeRecords);
		const coveredByForeignKey = config.foreignKeys.find(
			(foreignKey) => foreignKey.reference().columns[0]?.name === "covered_by_record_id",
		);
		const profileForeignKey = config.foreignKeys.find(
			(foreignKey) => foreignKey.reference().columns[0]?.name === "tax_profile_id",
		);

		expect(coveredByForeignKey?.reference().foreignTable).toBe(taxIncomeRecords);
		expect(coveredByForeignKey?.onDelete).toBe("no action");
		expect(profileForeignKey?.onDelete).toBe("cascade");
	});

	it.each([
		["suspension", taxFourthSuspensions, "tax_fourth_suspensions_fact_values_check"],
		["filing", taxFilingRecords, "tax_filing_records_fact_values_check"],
		["payment", taxPaymentRecords, "tax_payment_records_fact_values_check"],
	] as const)("constrains monthly %s verification scope and source", (_name, table, checkName) => {
		const query = constraintSql(table, checkName);

		expect(query).toContain("verification_scope");
		expect(query).toContain("user_provided");
		expect(query).toContain("evidence_attached");
		expect(query).toContain("system_verified");
		expect(query).toContain("source");
		expect(query).toContain("manual");
		expect(query).toContain("document");
		expect(query).toContain("integration");
	});

	it("constrains employment calculation disposition, source and activity classification source", () => {
		const query = constraintSql(taxIncomeRecords, "tax_income_records_canonical_values_check");

		expect(query).toContain("calculation_disposition");
		expect(query).toContain("excluded_by_coverage");
		expect(query).toContain("activity_classification_source");
		expect(query).toContain('"activity_classification_source" IS NOT NULL');
		expect(query).toContain("manual_confirmation");
		expect(query).toContain("migrated_default");
		expect(query).toContain("source");
		expect(query).toContain("import");
	});

	it("constrains employment coverage scope to the two auditable modes", () => {
		const query = constraintSql(taxIncomeRecords, "tax_income_records_kind_shape_check");

		expect(query).toContain("\"coverage_scope\" IN ('single_payer', 'all_employers')");
	});

	it("constrains deduction verification, calculation and source values", () => {
		const query = constraintSql(
			taxDeductionRecords,
			"tax_deduction_records_canonical_values_check",
		);

		expect(query).toContain("verification_status");
		expect(query).toContain("system_verified");
		expect(query).toContain("calculation_status");
		expect(query).toContain("potential");
		expect(query).toContain("source");
		expect(query).toContain("integration");
	});
});
