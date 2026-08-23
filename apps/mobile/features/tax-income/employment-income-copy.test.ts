import { describe, expect, it } from "vitest";

import {
	employmentCoverageScopeDescription,
	employmentIncomeRowCopy,
} from "./employment-income-copy";

describe("employmentIncomeRowCopy", () => {
	it("describes a monthly payroll record in beginner language", () => {
		expect(
			employmentIncomeRowCopy({
				recordKind: "period",
				coverageStart: "2026-03-01",
				coverageEnd: "2026-03-31",
				payerName: "ACME SAC",
				calculationDisposition: "included",
				coveredByRecordId: null,
			}),
		).toEqual({
			title: "ACME SAC",
			periodLabel: "Marzo · ACME SAC",
			statusLabel: null,
			statusTone: "muted",
		});
	});

	it("describes an accumulated range without calling it another monthly salary", () => {
		expect(
			employmentIncomeRowCopy({
				recordKind: "year_to_date_snapshot",
				coverageStart: "2026-01-01",
				coverageEnd: "2026-06-30",
				payerName: null,
				calculationDisposition: "included",
				coveredByRecordId: null,
			}).periodLabel,
		).toBe("Enero–junio · acumulado");
	});

	it("makes unresolved and covered overlap states explicit", () => {
		expect(
			employmentIncomeRowCopy({
				recordKind: "period",
				coverageStart: "2026-03-01",
				coverageEnd: "2026-03-31",
				payerName: "ACME SAC",
				calculationDisposition: "needs_resolution",
				coveredByRecordId: null,
			}).statusLabel,
		).toBe("Revisa este cruce: no se sumará hasta que confirmes si está repetido.");

		expect(
			employmentIncomeRowCopy({
				recordKind: "period",
				coverageStart: "2026-03-01",
				coverageEnd: "2026-03-31",
				payerName: "ACME SAC",
				calculationDisposition: "excluded_by_coverage",
				coveredByRecordId: "snapshot-1",
			}).statusLabel,
		).toBe("Ya está dentro de un acumulado; no se suma dos veces.");
	});
});

describe("employmentCoverageScopeDescription", () => {
	it("does not promise automatic matching from a similar employer name", () => {
		expect(employmentCoverageScopeDescription("single_payer", null)).toContain(
			"Un nombre parecido no basta para excluir otro registro",
		);
	});

	it("explains that all-employer scope must be stated by the document", () => {
		expect(employmentCoverageScopeDescription("all_employers", null)).toContain(
			"solo si el reporte dice que reúne a todos tus empleadores",
		);
	});
});
