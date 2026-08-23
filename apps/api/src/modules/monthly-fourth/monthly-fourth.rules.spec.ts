import { MonthlyFourthRules, MonthlyFourthRulesInputError } from "./monthly-fourth.rules";
import type {
	MonthlyFourthIncome,
	MonthlyFourthInput,
	MonthlyFourthSuspension,
	RecordedMonthlyFact,
} from "./monthly-fourth.types";

const rules = new MonthlyFourthRules();

function fourthIncome(
	grossAmountPen: string,
	overrides: Partial<MonthlyFourthIncome> = {},
): MonthlyFourthIncome {
	return {
		id: "fourth-1",
		activityType: "fourth_ordinary",
		receivedAt: "2026-01-15",
		grossAmountPen,
		withheldTaxAmountPen: "0.00",
		...overrides,
	};
}

function knownFact(
	state: "yes" | "no",
	verificationScope: "user_provided" | "evidence_attached" | "system_verified" = "user_provided",
): RecordedMonthlyFact {
	return { state, verificationScope };
}

function month(overrides: Partial<MonthlyFourthInput> = {}): MonthlyFourthInput {
	return {
		period: "2026-01",
		activityClassification: "ordinary",
		fourthIncomes: [],
		fifthGrossAmountPen: "0.00",
		coverage: "complete",
		pendingDocumentCount: 0,
		suspension: {
			status: "none",
			verificationScope: "user_provided",
		},
		...overrides,
	};
}

describe("MonthlyFourthRules", () => {
	it.each([
		{
			name: "general threshold exactly",
			input: month({ fourthIncomes: [fourthIncome("4010.00")] }),
			status: "no_action_detected",
			thresholdKind: "general",
			threshold: "4010.00",
			estimatedAdvancePayment: "0.00",
		},
		{
			name: "general threshold one cent over",
			input: month({ fourthIncomes: [fourthIncome("4010.01")] }),
			status: "awaiting_user_confirmation",
			thresholdKind: "general",
			threshold: "4010.00",
			estimatedAdvancePayment: "320.80",
		},
		{
			name: "special threshold exactly with fifth income",
			input: month({
				fourthIncomes: [fourthIncome("3108.00", { activityType: "fourth_special" })],
				fifthGrossAmountPen: "100.00",
			}),
			status: "no_action_detected",
			thresholdKind: "special",
			threshold: "3208.00",
			estimatedAdvancePayment: "0.00",
		},
		{
			name: "special threshold one cent over with fifth income",
			input: month({
				fourthIncomes: [fourthIncome("3108.01", { activityType: "fourth_special" })],
				fifthGrossAmountPen: "100.00",
			}),
			status: "awaiting_user_confirmation",
			thresholdKind: "special",
			threshold: "3208.00",
			estimatedAdvancePayment: "248.64",
		},
	] as const)(
		"uses the 2026 $name boundary",
		({ input, status, thresholdKind, threshold, estimatedAdvancePayment }) => {
			expect(rules.calculate(input)).toMatchObject({
				status,
				thresholdKind,
				monthlyThreshold: threshold,
				estimatedAdvancePayment,
			});
		},
	);

	it("uses the special threshold whenever any special fourth activity participates", () => {
		const result = rules.calculate(
			month({
				fourthIncomes: [
					fourthIncome("3208.00"),
					fourthIncome("0.01", {
						id: "special",
						activityType: "fourth_special",
					}),
				],
			}),
		);

		expect(result).toMatchObject({
			status: "awaiting_user_confirmation",
			thresholdKind: "special",
			monthlyCombinedGross: "3208.01",
			estimatedAdvancePayment: "256.64",
		});
	});

	it("does not choose a monthly threshold while the activity classification is unknown", () => {
		const result = rules.calculate(
			month({
				activityClassification: "unknown",
				fourthIncomes: [fourthIncome("5000.00")],
			}),
		);

		expect(result).toMatchObject({
			status: "insufficient_data",
			activityClassification: "unknown",
			thresholdKind: null,
			monthlyThreshold: null,
			estimatedAdvancePayment: null,
			reasons: ["activity_classification_unknown"],
		});
	});

	it.each([
		["partial", "100.00", "300.00", "awaiting_user_confirmation"],
		["full", "400.00", "0.00", "no_action_detected"],
		["more than eight percent", "500.00", "0.00", "no_action_detected"],
	] as const)(
		"floors the advance payment at zero with %s monthly withholding",
		(_name, withholding, estimatedAdvancePayment, status) => {
			const result = rules.calculate(
				month({
					fourthIncomes: [
						fourthIncome("5000.00", {
							withheldTaxAmountPen: withholding,
						}),
					],
				}),
			);

			expect(result).toMatchObject({ estimatedAdvancePayment, status });
		},
	);

	it("does not apply a suspension retroactively and applies it from the next calendar day", () => {
		const suspension: MonthlyFourthSuspension = {
			status: "authorized",
			authorizationDate: "2026-01-10",
			restart: { status: "not_required" },
			verificationScope: "evidence_attached",
		};
		const result = rules.calculate(
			month({
				fourthIncomes: [
					fourthIncome("2500.00", {
						id: "before",
						receivedAt: "2026-01-10",
					}),
					fourthIncome("2500.00", {
						id: "effective-day",
						receivedAt: "2026-01-11",
					}),
				],
				suspension,
			}),
		);

		expect(result).toMatchObject({
			status: "awaiting_user_confirmation",
			suspensionEffect: "partial",
			suspensionEffectiveFrom: "2026-01-11",
			unsuspendedFourthGross: "2500.00",
			estimatedAdvancePayment: "200.00",
		});
	});

	it("detects no action when every fourth income is inside a valid suspension", () => {
		const result = rules.calculate(
			month({
				fourthIncomes: [fourthIncome("5000.00", { receivedAt: "2026-01-11" })],
				suspension: {
					status: "authorized",
					authorizationDate: "2026-01-10",
					restart: { status: "not_required" },
					verificationScope: "evidence_attached",
				},
			}),
		);

		expect(result).toMatchObject({
			status: "no_action_detected",
			suspensionEffect: "active",
			unsuspendedFourthGross: "0.00",
			estimatedAdvancePayment: "0.00",
		});
	});

	it("does not apply an authorization that becomes effective after the reviewed period", () => {
		const result = rules.calculate(
			month({
				fourthIncomes: [fourthIncome("5000.00")],
				suspension: {
					status: "authorized",
					authorizationDate: "2026-02-01",
					restart: { status: "not_required" },
					verificationScope: "user_provided",
				},
			}),
		);

		expect(result).toMatchObject({
			status: "awaiting_user_confirmation",
			suspensionEffect: "future",
			estimatedAdvancePayment: "400.00",
		});
	});

	it("does not let unknown restart conditions obscure income received before suspension took effect", () => {
		const result = rules.calculate(
			month({
				fourthIncomes: [fourthIncome("5000.00", { receivedAt: "2026-01-10" })],
				suspension: {
					status: "authorized",
					authorizationDate: "2026-01-10",
					restart: { status: "unknown" },
					verificationScope: "user_provided",
				},
			}),
		);

		expect(result).toMatchObject({
			status: "awaiting_user_confirmation",
			suspensionEffectiveFrom: "2026-01-11",
			estimatedAdvancePayment: "400.00",
		});
	});

	it("restarts the monthly calculation from the user-provided restart date", () => {
		const result = rules.calculate(
			month({
				period: "2026-02",
				fourthIncomes: [
					fourthIncome("2500.00", {
						id: "before-restart",
						receivedAt: "2026-02-09",
					}),
					fourthIncome("2500.00", {
						id: "restart-day",
						receivedAt: "2026-02-10",
					}),
				],
				suspension: {
					status: "authorized",
					authorizationDate: "2026-01-01",
					restart: { status: "required", restartDate: "2026-02-10" },
					verificationScope: "user_provided",
				},
			}),
		);

		expect(result).toMatchObject({
			status: "awaiting_user_confirmation",
			suspensionEffect: "partial",
			unsuspendedFourthGross: "2500.00",
			estimatedAdvancePayment: "200.00",
		});
	});

	it.each([
		[
			"unknown suspension",
			month({
				fourthIncomes: [fourthIncome("5000.00")],
				suspension: { status: "unknown" },
			}),
		],
		[
			"unknown restart conditions for an effective suspension",
			month({
				fourthIncomes: [fourthIncome("5000.00")],
				suspension: {
					status: "authorized",
					authorizationDate: "2026-01-01",
					restart: { status: "unknown" },
					verificationScope: "user_provided",
				},
			}),
		],
		[
			"partial income coverage",
			month({
				fourthIncomes: [fourthIncome("5000.00")],
				coverage: "partial",
			}),
		],
		[
			"a pending document",
			month({
				fourthIncomes: [fourthIncome("5000.00")],
				pendingDocumentCount: 1,
			}),
		],
	] as const)("keeps %s as insufficient data", (_name, input) => {
		const result = rules.calculate(input);

		expect(result).toMatchObject({
			status: "insufficient_data",
			estimatedAdvancePayment: null,
			officialCompliance: "not_determined",
		});
	});

	it("moves an actionable period to awaiting confirmation only when the guided facts are present but unknown", () => {
		const result = rules.calculate(
			month({
				fourthIncomes: [fourthIncome("5000.00")],
				filing: { state: "unknown" },
				payment: { state: "unknown" },
			}),
		);

		expect(result.status).toBe("awaiting_user_confirmation");
	});

	it("keeps action required when a requested payment was recorded as no", () => {
		const filing = knownFact("yes", "evidence_attached");
		const payment = knownFact("no", "user_provided");
		const result = rules.calculate(
			month({
				fourthIncomes: [fourthIncome("5000.00")],
				filing,
				payment,
			}),
		);

		expect(result).toMatchObject({
			status: "action_likely_required",
			filing,
			payment,
			officialCompliance: "not_determined",
		});
		expect(result.filing).not.toBe(result.payment);
	});

	it("marks the guided record complete only when every requested fact is yes", () => {
		const result = rules.calculate(
			month({
				fourthIncomes: [fourthIncome("5000.00")],
				filing: knownFact("yes", "evidence_attached"),
				payment: knownFact("yes", "user_provided"),
			}),
		);

		expect(result.status).toBe("user_recorded_complete");
	});

	it("reports an intramonth restart when all income arrived after the restart date", () => {
		const result = rules.calculate(
			month({
				period: "2026-02",
				fourthIncomes: [fourthIncome("5000.00", { receivedAt: "2026-02-15" })],
				suspension: {
					status: "authorized",
					authorizationDate: "2026-01-01",
					restart: { status: "required", restartDate: "2026-02-10" },
					verificationScope: "user_provided",
				},
			}),
		);

		expect(result).toMatchObject({
			status: "awaiting_user_confirmation",
			suspensionEffect: "restarted",
			unsuspendedFourthGross: "5000.00",
			estimatedAdvancePayment: "400.00",
		});
	});

	it("does not project missing information and does not mutate inputs", () => {
		const input = month({
			fourthIncomes: Object.freeze([Object.freeze(fourthIncome("5000.00"))]),
		});
		Object.freeze(input.suspension);
		Object.freeze(input);

		const result = rules.calculate(input);

		expect(result.monthlyFourthGross).toBe("5000.00");
		expect(result.status).toBe("awaiting_user_confirmation");
		expect(Object.isFrozen(result)).toBe(true);
		expect(Object.isFrozen(result.reasons)).toBe(true);
	});

	it.each([
		["period outside 2026", month({ period: "2025-12" })],
		[
			"income outside the period",
			month({ fourthIncomes: [fourthIncome("100.00", { receivedAt: "2026-02-01" })] }),
		],
		["negative fifth income", month({ fifthGrossAmountPen: "-0.01" })],
		[
			"withholding above gross",
			month({
				fourthIncomes: [fourthIncome("100.00", { withheldTaxAmountPen: "100.01" })],
			}),
		],
		["fractional pending-document count", month({ pendingDocumentCount: 0.5 })],
		[
			"restart before suspension becomes effective",
			month({
				suspension: {
					status: "authorized",
					authorizationDate: "2026-01-10",
					restart: { status: "required", restartDate: "2026-01-10" },
					verificationScope: "user_provided",
				},
			}),
		],
	] as const)("rejects %s instead of guessing", (_name, input) => {
		expect(() => rules.calculate(input)).toThrow(MonthlyFourthRulesInputError);
	});
});
