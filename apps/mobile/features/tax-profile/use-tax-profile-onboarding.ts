import { authClient } from "@/core/auth-client";

import { useUpdateCurrentTaxProfile } from "./tax-profile.mutations";
import type { IncomeMode } from "./types";

export function useTaxProfileOnboarding() {
	const { data: session } = authClient.useSession();

	const mutation = useUpdateCurrentTaxProfile(session?.user.id ?? "");

	async function completeProfile(input: { incomeMode: IncomeMode; trackDeductibles: boolean }) {
		if (!session) {
			throw new Error("No existe una sesión activa");
		}

		return mutation.mutateAsync(input);
	}

	return {
		completeProfile,
		isSaving: mutation.isPending,
		error: mutation.error,
	};
}
