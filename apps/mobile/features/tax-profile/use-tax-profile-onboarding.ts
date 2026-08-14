import { authClient } from "@/core/auth-client";

import { useUpdateCurrentTaxProfile } from "./tax-profile.mutations";
import type { IncomeMode } from "./types";

export function useTaxProfileOnboarding() {
	const { data: session } = authClient.useSession();

	const mutation = useUpdateCurrentTaxProfile(session?.user.id ?? "");

	async function saveIncomeMode(incomeMode: IncomeMode) {
		if (!session) {
			throw new Error("No existe una sesión activa");
		}

		return mutation.mutateAsync({
			incomeMode,
		});
	}

	return {
		saveIncomeMode,
		isSaving: mutation.isPending,
		error: mutation.error,
	};
}
