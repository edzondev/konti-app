import { View } from "react-native";

function SkeletonBar({ className }: { className: string }) {
	return <View className={`rounded-full bg-konti-skeleton ${className}`} />;
}

export function HomeSkeleton() {
	return (
		<View className="mt-8">
			<View className="flex-row items-center gap-2">
				<View className="size-1.5 shrink-0 rounded-full bg-konti-amber" />
				<SkeletonBar className="h-3 w-32" />
			</View>

			<View className="mt-5 h-15 w-50 rounded-xl bg-konti-skeleton" />

			<View className="mt-6 gap-2.5">
				<SkeletonBar className="h-3.5 w-75" />
				<SkeletonBar className="h-3.5 w-60" />
			</View>

			<View className="mt-10 gap-3.5">
				{Array.from({ length: 5 }, (_, index) => (
					<View key={index} className="flex-row items-center justify-between">
						<SkeletonBar className="h-3.5 w-30" />
						<SkeletonBar className="h-3.5 w-20" />
					</View>
				))}
			</View>

			<View className="mt-8 h-25 w-full rounded-2xl bg-konti-skeleton" />
		</View>
	);
}
