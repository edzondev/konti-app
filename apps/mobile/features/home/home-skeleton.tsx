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

			<View className="mt-5 h-[60px] w-[200px] rounded-xl bg-konti-skeleton" />

			<View className="mt-6 gap-2.5">
				<SkeletonBar className="h-3.5 w-[300px]" />
				<SkeletonBar className="h-3.5 w-[240px]" />
			</View>

			<View className="mt-10 gap-3.5">
				{Array.from({ length: 5 }, (_, index) => (
					<View key={index} className="flex-row items-center justify-between">
						<SkeletonBar className="h-3.5 w-[120px]" />
						<SkeletonBar className="h-3.5 w-20" />
					</View>
				))}
			</View>

			<View className="mt-8 h-[100px] w-full rounded-2xl bg-konti-skeleton" />
		</View>
	);
}
