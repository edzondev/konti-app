import { describe, expect, it } from "vitest";
import collectionFixture from "../../../api/src/modules/tax-deductions/fixtures/tax-deduction-collection.contract.json";

import { parseTaxDeductionCollection } from "./tax-deduction-contract";

describe("TaxDeductionCollection contract", () => {
	it("accepts the exact API fixture", () => {
		expect(parseTaxDeductionCollection(collectionFixture)).toEqual(collectionFixture);
	});

	it("rejects legacy list responses", () => {
		expect(() => parseTaxDeductionCollection({ items: collectionFixture.records })).toThrow(
			"TAX_DEDUCTION_CONTRACT_INVALID",
		);
	});
});
