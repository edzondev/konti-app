import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCurrentTaxProfile } from "./tax-profile.api";
import { taxProfileKeys } from "./tax-profile.queries";

export function useUpdateCurrentTaxProfile(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateCurrentTaxProfile,

		onSuccess: (data) => {
			queryClient.setQueryData(taxProfileKeys.current(userId), data);
		},
	});
}
