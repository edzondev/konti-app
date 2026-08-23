import type {
	DeductionCalculationStatus,
	DeductionQuestionState,
	DeductionVerificationBasis,
} from "./types";

export function deriveRequestedDeductionStatus(input: {
	verificationBasis: DeductionVerificationBasis;
	requirementStates: readonly DeductionQuestionState[];
}): DeductionCalculationStatus {
	if (input.requirementStates.includes("no")) return "excluded";
	if (input.verificationBasis === "unresolved" || input.requirementStates.includes("unknown")) {
		return "potential";
	}
	return "included";
}
