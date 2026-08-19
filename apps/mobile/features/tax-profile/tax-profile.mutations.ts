import { useMutation, useQueryClient } from "@tanstack/react-query";

import { homeKeys } from "@/features/home/home.queries";

import { updateCurrentTaxProfile } from "./tax-profile.api";
import { taxProfileKeys } from "./tax-profile.queries";

export function useUpdateCurrentTaxProfile(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateCurrentTaxProfile,

		onSuccess: (data) => {
			queryClient.setQueryData(taxProfileKeys.current(userId), data);
			void queryClient.invalidateQueries({ queryKey: homeKeys.all });
		},
	});
}
