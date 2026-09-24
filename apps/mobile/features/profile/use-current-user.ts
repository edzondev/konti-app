import { authClient } from "@/core/auth-client";

export function useCurrentUser() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user
		? { id: data.user.id, name: data.user.name, email: data.user.email }
		: null;
	return { user, isPending };
}
