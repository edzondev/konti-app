import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { authClient } from "@/core/auth-client";
import { MonthlyFourthReviewForm } from "@/features/monthly-fourth/components/monthly-fourth-review-form";
import { monthlyFourthPeriodSchema } from "@/features/monthly-fourth/monthly-fourth.validation";
import { monthlyFourthPeriodQueryOptions } from "@/features/monthly-fourth/monthly-fourth-queries";

const MONTH_LABEL = new Intl.DateTimeFormat("es-PE", {
	month: "long",
	year: "numeric",
	timeZone: "UTC",
});

export default function MonthlyFourthPeriodScreen() {
	const params = useLocalSearchParams<{ period?: string }>();
	const { data: session } = authClient.useSession();
	const rawPeriod = typeof params.period === "string" ? params.period : "";
	const parsedPeriod = monthlyFourthPeriodSchema.safeParse(rawPeriod);
	const period = parsedPeriod.success ? parsedPeriod.data : "";
	const query = useQuery(monthlyFourthPeriodQueryOptions(session?.user.id ?? "", period));

	if (!parsedPeriod.success) {
		return <ScreenState message="El periodo solicitado no es válido." title="Revisión mensual" />;
	}

	const title = monthLabel(period);
	if (query.isPending) {
		return <ScreenState message="Preparando la información registrada…" title={title} />;
	}
	if (query.isError || !query.data) {
		return (
			<ScreenState
				message="No pudimos cargar este mes. Tus datos no se modificaron."
				onRetry={() => void query.refetch()}
				title={title}
			/>
		);
	}

	return (
		<>
			<NativeHeader title={title} />
			<MonthlyFourthReviewForm period={query.data} userId={session?.user.id ?? ""} />
		</>
	);
}

function NativeHeader({ title }: { title: string }) {
	return (
		<Stack.Screen
			options={{
				headerShown: true,
				headerBackButtonDisplayMode: "minimal",
				headerShadowVisible: false,
				headerStyle: { backgroundColor: "#151412" },
				headerTintColor: "#EDE9E2",
				title,
			}}
		/>
	);
}

function ScreenState({
	title,
	message,
	onRetry,
}: {
	title: string;
	message: string;
	onRetry?: () => void;
}) {
	return (
		<>
			<NativeHeader title={title} />
			<View className="flex-1 items-center justify-center gap-4 bg-konti-bg px-6">
				<Text selectable className="text-center text-[15px] leading-6 text-konti-ivory/50">
					{message}
				</Text>
				{onRetry ? (
					<Pressable
						accessibilityRole="button"
						className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
						onPress={onRetry}
					>
						<Text className="font-medium text-konti-bg">Reintentar</Text>
					</Pressable>
				) : null}
			</View>
		</>
	);
}

function monthLabel(period: string): string {
	const parsed = new Date(`${period}-01T00:00:00.000Z`);
	const label = MONTH_LABEL.format(parsed);
	return label.charAt(0).toLocaleUpperCase("es-PE") + label.slice(1);
}
