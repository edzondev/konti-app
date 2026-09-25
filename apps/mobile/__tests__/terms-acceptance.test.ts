import { beforeEach, describe, expect, it } from "vitest";

import { __resetAppStorageForTests } from "../core/storage";
import {
	__resetTermsAcceptanceForTests,
	beginAccountDeletion,
	clearTermsAccepted,
	endAccountDeletion,
	hasAcceptedTerms,
	markTermsAccepted,
} from "../features/auth/terms-acceptance";

describe("terms acceptance", () => {
	beforeEach(() => {
		__resetTermsAcceptanceForTests();
		__resetAppStorageForTests();
		clearTermsAccepted();
	});

	it("starts unset so a new account must accept the terms", () => {
		expect(hasAcceptedTerms()).toBe(false);
	});

	it("stays set after a successful sign-in so a returning account skips the checkbox", () => {
		markTermsAccepted();
		expect(hasAcceptedTerms()).toBe(true);
	});

	it("clears when the account is deleted", () => {
		markTermsAccepted();
		clearTermsAccepted();
		expect(hasAcceptedTerms()).toBe(false);
	});

	it("does not record acceptance again while the account is being deleted", () => {
		markTermsAccepted();
		beginAccountDeletion();
		clearTermsAccepted();
		markTermsAccepted();
		expect(hasAcceptedTerms()).toBe(false);
	});

	it("records acceptance again once deletion has finished", () => {
		beginAccountDeletion();
		clearTermsAccepted();
		endAccountDeletion();
		markTermsAccepted();
		expect(hasAcceptedTerms()).toBe(true);
	});
});
