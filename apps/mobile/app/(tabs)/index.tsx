import { HomeScreen } from "@/features/home/home-screen";
import { authClient } from "@/core/auth-client";

export default function InicioTabScreen() {
	const { data: session } = authClient.useSession();

	if (!session) {
		return null;
	}

	return <HomeScreen userId={session.user.id} firstName={session.user.name?.split(" ")[0]} />;
}
