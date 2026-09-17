import { Text, View } from "react-native";
import { authClient } from "@/core/auth-client";

export default function HomePage() {
	const { data: session } = authClient.useSession();

	return (
		<View>
			<Text>{JSON.stringify(session)}</Text>
		</View>
	);
}
