import { useLocalSearchParams } from "expo-router";

import { DeductionsYearScreen } from "@/features/deductions/deductions-year-screen";

export default function DeduccionesYearPage() {
	const { year } = useLocalSearchParams<{ year: string }>();
	return <DeductionsYearScreen year={Number(year)} />;
}
