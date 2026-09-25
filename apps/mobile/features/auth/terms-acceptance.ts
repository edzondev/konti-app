import { getAppStorage } from "@/core/storage";

const TERMS_ACCEPTED_KEY = "konti_terms_accepted";

let deletingAccount = false;

export function hasAcceptedTerms(): boolean {
	return getAppStorage().getString(TERMS_ACCEPTED_KEY) === "1";
}

export function beginAccountDeletion(): void {
	deletingAccount = true;
}

export function endAccountDeletion(): void {
	deletingAccount = false;
}

export function __resetTermsAcceptanceForTests(): void {
	deletingAccount = false;
}

export function markTermsAccepted(): void {
	if (deletingAccount) return;
	getAppStorage().set(TERMS_ACCEPTED_KEY, "1");
}

export function clearTermsAccepted(): void {
	getAppStorage().remove(TERMS_ACCEPTED_KEY);
}
