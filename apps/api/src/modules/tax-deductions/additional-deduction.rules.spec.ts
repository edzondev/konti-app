import {
	AdditionalDeductionRules,
	AdditionalDeductionRulesInputError,
} from "./additional-deduction.rules";
import goldenFixture from "./fixtures/pe-2026-additional-deductions.golden.json";
import type {
	DeductionRequirement,
	TaxDeductionCategory,
	TaxDeductionRecord,
} from "./tax-deduction.types";

const requirementsByCategory = {
	restaurants_hotels: [
		"accepted_document",
		"consumer_identity_correct",
		"payment_recorded",
		"compatible_economic_activity",
		"issuer_active_and_habido",
		"issued_in_tax_year",
		"banking_evidence_when_required",
	],
	medical_dental_services: [
		"fourth_category_receipt",
		"profession_registered",
		"beneficiary_identity_correct",
		"payment_recorded",
		"issuer_eligible",
		"banking_evidence_when_required",
	],
	other_fourth_services: [
		"fourth_category_receipt",
		"consumer_identity_correct",
		"payment_recorded",
		"issuer_eligible",
		"banking_evidence_when_required",
	],
	rent: [
		"accepted_rent_document",
		"consumer_identity_correct",
		"payment_recorded",
		"property_in_peru",
		"property_not_exclusively_business_use",
		"issuer_active_and_habido",
		"banking_evidence_when_required",
	],
	household_worker_essalud: ["worker_registration", "form_1676_evidence", "payment_recorded"],
} as const satisfies Record<TaxDeductionCategory, readonly DeductionRequirement["code"][]>;

function metRequirements(category: TaxDeductionCategory): DeductionRequirement[] {
	return requirementsByCategory[category].map((code) => ({ code, status: "met" }));
}

function record(
	category: TaxDeductionCategory,
	grossAmountPen: string,
	override: Partial<TaxDeductionRecord> = {},
): TaxDeductionRecord {
	const common = {
		id: `${category}-1`,
		paidAt: "2026-08-22",
		grossAmountPen,
		verificationStatus: "user_confirmed" as const,
		calculationStatus: "included" as const,
		requirements: metRequirements(category),
	};

	switch (category) {
		case "medical_dental_services":
			return {
				...common,
				category,
				beneficiary: "self",
				insuranceReimbursementAmountPen: "0.00",
				...override,
			} as TaxDeductionRecord;
		case "other_fourth_services":
			return {
				...common,
				category,
				fourthActivityType: "ordinary",
				...override,
			} as TaxDeductionRecord;
		case "rent":
			return {
				...common,
				category,
				attribution: "taxpayer",
				...override,
			} as TaxDeductionRecord;
		default:
			return { ...common, category, ...override } as TaxDeductionRecord;
	}
}

describe("AdditionalDeductionRules", () => {
	it("treats banking not_applicable as resolved without weakening other requirements", () => {
		const base = record("restaurants_hotels", "100.00", { id: "banking-na" });
		const result = new AdditionalDeductionRules().calculate([
			{
				...base,
				requirements: base.requirements.map((requirement) =>
					requirement.code === "banking_evidence_when_required"
						? { ...requirement, status: "not_applicable" as const }
						: requirement,
				),
			},
		]);

		expect(result.decisions[0]).toMatchObject({
			disposition: "included",
			attentionReasons: [],
		});
	});
	const rules = new AdditionalDeductionRules();

	it("matches the approved 2026 golden breakdown across all five categories", () => {
		const result = rules.calculate(goldenFixture.input as readonly TaxDeductionRecord[]);

		expect(result).toMatchObject(goldenFixture.expected);
	});

	it("applies the shared three-UIT cap once across all categories", () => {
		const result = rules.calculate([
			record("restaurants_hotels", "100000.00"),
			record("rent", "10000.00"),
		]);

		expect(result).toMatchObject({
			totalBeforeCap: "18000.00",
			includedAdditionalDeduction: "16500.00",
			amountDiscardedByCap: "1500.00",
			capPen: "16500.00",
		});
	});

	it.each([
		["below", "16499.99", "16499.99", "0.00"],
		["at", "16500.00", "16500.00", "0.00"],
		["above", "16500.01", "16500.00", "0.01"],
	] as const)(
		"handles the shared cap boundary %s S/16,500",
		(_position, contribution, included, discarded) => {
			const result = rules.calculate([record("household_worker_essalud", contribution)]);

			expect(result.includedAdditionalDeduction).toBe(included);
			expect(result.amountDiscardedByCap).toBe(discarded);
		},
	);

	it("keeps verification and calculation as independent axes", () => {
		const result = rules.calculate([
			record("restaurants_hotels", "100.00", {
				id: "unknown-but-marked-included",
				verificationStatus: "unknown",
			}),
			record("restaurants_hotels", "200.00", {
				id: "evidence-excluded",
				verificationStatus: "evidence_attached",
				calculationStatus: "excluded",
			}),
			record("restaurants_hotels", "300.00", {
				id: "evidence-included",
				verificationStatus: "evidence_attached",
			}),
		]);

		expect(result).toMatchObject({
			restaurantsHotelsDeduction: "45.00",
			potentialAmountBeforeCap: "15.00",
			includedAdditionalDeduction: "45.00",
		});
		expect(result.decisions).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					recordId: "unknown-but-marked-included",
					disposition: "potential",
					attentionReasons: ["verification_required"],
				}),
				expect.objectContaining({
					recordId: "evidence-excluded",
					disposition: "excluded",
					rejectionReasons: ["excluded_by_canonical_status"],
				}),
			]),
		);
	});

	it.each([
		"self",
		"spouse",
		"accredited_partner",
		"minor_child",
		"adult_child_with_registered_disability",
	] as const)("accepts the allowed medical beneficiary %s", (beneficiary) => {
		const result = rules.calculate([
			record("medical_dental_services", "1000.00", {
				beneficiary,
				insuranceReimbursementAmountPen: "200.00",
			}),
		]);

		expect(result.medicalDentalDeduction).toBe("240.00");
		expect(result.decisions[0]).toMatchObject({
			disposition: "included",
			qualifyingBasePen: "800.00",
		});
	});

	it("leaves an unknown medical beneficiary and reimbursement as potential", () => {
		const result = rules.calculate([
			record("medical_dental_services", "1000.00", {
				beneficiary: "unknown",
				insuranceReimbursementAmountPen: null,
			}),
		]);

		expect(result).toMatchObject({
			medicalDentalDeduction: "0.00",
			potentialAmountBeforeCap: "300.00",
		});
		expect(result.decisions[0]).toMatchObject({
			disposition: "potential",
			qualifyingBasePen: null,
			attentionReasons: ["medical_beneficiary_unknown", "medical_reimbursement_unknown"],
		});
	});

	it.each(["other", "adult_child_without_registered_disability"] as const)(
		"excludes the non-qualifying medical beneficiary %s",
		(beneficiary) => {
			const result = rules.calculate([
				record("medical_dental_services", "1000.00", { beneficiary }),
			]);

			expect(result.medicalDentalDeduction).toBe("0.00");
			expect(result.decisions[0]).toMatchObject({
				disposition: "excluded",
				rejectionReasons: ["medical_beneficiary_not_allowed"],
			});
		},
	);

	it("excludes a fully reimbursed medical expense", () => {
		const result = rules.calculate([
			record("medical_dental_services", "1000.00", {
				insuranceReimbursementAmountPen: "1000.00",
			}),
		]);

		expect(result.decisions[0]).toMatchObject({
			disposition: "excluded",
			qualifyingBasePen: "0.00",
			rejectionReasons: ["medical_fully_reimbursed"],
		});
	});

	it("never grants the deduction to special fourth-category services", () => {
		const result = rules.calculate([
			record("other_fourth_services", "500.00", {
				fourthActivityType: "special",
			}),
			record("other_fourth_services", "500.00", {
				id: "activity-unknown",
				fourthActivityType: "unknown",
			}),
		]);

		expect(result.otherFourthServicesDeduction).toBe("0.00");
		expect(result.decisions).toEqual([
			expect.objectContaining({
				disposition: "excluded",
				rejectionReasons: ["fourth_special_service_not_deductible"],
			}),
			expect.objectContaining({
				disposition: "potential",
				attentionReasons: ["fourth_service_activity_unknown"],
			}),
		]);
	});

	it("turns unknown requirements into attention and failed requirements into rejection", () => {
		const unknownRequirements = metRequirements("restaurants_hotels");
		unknownRequirements[0] = { code: "accepted_document", status: "unknown" };
		const failedRequirements = metRequirements("restaurants_hotels");
		failedRequirements[1] = { code: "consumer_identity_correct", status: "not_met" };

		const result = rules.calculate([
			record("restaurants_hotels", "100.00", {
				id: "unknown-requirement",
				requirements: unknownRequirements,
			}),
			record("restaurants_hotels", "100.00", {
				id: "failed-requirement",
				requirements: failedRequirements,
			}),
		]);

		expect(result.decisions).toEqual([
			expect.objectContaining({
				disposition: "potential",
				attentionReasons: ["requirement_unknown:accepted_document"],
			}),
			expect.objectContaining({
				disposition: "excluded",
				rejectionReasons: ["requirement_not_met:consumer_identity_correct"],
			}),
		]);
	});

	it("excludes a restaurant receipt that was not issued in the 2026 tax year", () => {
		const requirements = metRequirements("restaurants_hotels");
		const issueYearIndex = requirements.findIndex(({ code }) => code === "issued_in_tax_year");
		requirements[issueYearIndex] = { code: "issued_in_tax_year", status: "not_met" };

		const result = rules.calculate([record("restaurants_hotels", "100.00", { requirements })]);

		expect(result.restaurantsHotelsDeduction).toBe("0.00");
		expect(result.decisions[0]).toMatchObject({
			disposition: "excluded",
			rejectionReasons: ["requirement_not_met:issued_in_tax_year"],
		});
	});

	it.each(["unknown", "spouse_or_partner"] as const)(
		"does not infer rent attribution when it is %s",
		(attribution) => {
			const result = rules.calculate([record("rent", "1000.00", { attribution })]);

			expect(result.rentDeduction).toBe("0.00");
			expect(result.excludedFactors).toEqual(["rent_attribution"]);
			expect(result.decisions[0]).toMatchObject({
				disposition: "potential",
				attentionReasons: [
					attribution === "unknown"
						? "rent_attribution_unknown"
						: "rent_attribution_requires_official_confirmation",
				],
			});
		},
	);

	it("excludes rent when the issuer eligibility requirement is not met", () => {
		const requirements = metRequirements("rent");
		const issuerStatusIndex = requirements.findIndex(
			({ code }) => code === "issuer_active_and_habido",
		);
		requirements[issuerStatusIndex] = {
			code: "issuer_active_and_habido",
			status: "not_met",
		};

		const result = rules.calculate([record("rent", "1000.00", { requirements })]);

		expect(result.rentDeduction).toBe("0.00");
		expect(result.decisions[0]).toMatchObject({
			disposition: "excluded",
			rejectionReasons: ["requirement_not_met:issuer_active_and_habido"],
		});
	});

	it.each([
		["date outside 2026", { paidAt: "2025-12-31" }],
		["invalid date", { paidAt: "2026-02-30" }],
		["zero gross", { grossAmountPen: "0.00" }],
		["malformed gross", { grossAmountPen: "one hundred" }],
		[
			"unknown medical beneficiary vocabulary",
			{
				category: "medical_dental_services",
				beneficiary: "unrecognized_beneficiary",
			},
		],
		[
			"medical reimbursement over gross",
			{
				category: "medical_dental_services",
				insuranceReimbursementAmountPen: "100.01",
			},
		],
	] as const)("rejects %s", (_label, override) => {
		const base =
			"category" in override && override.category === "medical_dental_services"
				? record("medical_dental_services", "100.00")
				: record("restaurants_hotels", "100.00");

		expect(() => rules.calculate([{ ...base, ...override } as TaxDeductionRecord])).toThrow(
			AdditionalDeductionRulesInputError,
		);
	});

	it("rejects duplicated and category-incompatible requirement facts", () => {
		const duplicate = metRequirements("restaurants_hotels");
		duplicate.push({ code: "accepted_document", status: "met" });
		const incompatible = metRequirements("restaurants_hotels");
		incompatible[0] = { code: "form_1676_evidence", status: "met" };

		expect(() =>
			rules.calculate([record("restaurants_hotels", "100.00", { requirements: duplicate })]),
		).toThrow(AdditionalDeductionRulesInputError);
		expect(() =>
			rules.calculate([record("restaurants_hotels", "100.00", { requirements: incompatible })]),
		).toThrow(AdditionalDeductionRulesInputError);
	});

	it("rejects a malformed record with the domain input error", () => {
		expect(() => rules.calculate([null] as unknown as readonly TaxDeductionRecord[])).toThrow(
			AdditionalDeductionRulesInputError,
		);
	});

	it("does not mutate inputs and returns an immutable result graph", () => {
		const input = Object.freeze([
			Object.freeze({
				...record("medical_dental_services", "1000.00"),
				requirements: Object.freeze(metRequirements("medical_dental_services")),
			}),
		]) as readonly TaxDeductionRecord[];
		const before = JSON.stringify(input);

		const result = rules.calculate(input);

		expect(JSON.stringify(input)).toBe(before);
		expect(Object.isFrozen(result)).toBe(true);
		expect(Object.isFrozen(result.decisions)).toBe(true);
		expect(Object.isFrozen(result.decisions[0])).toBe(true);
		expect(Object.isFrozen(result.decisions[0]?.attentionReasons)).toBe(true);
		expect(Object.isFrozen(result.decisions[0]?.rejectionReasons)).toBe(true);
	});
});
