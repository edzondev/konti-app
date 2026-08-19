import { createContext, type PropsWithChildren, use, useCallback, useMemo, useState } from "react";

import type { IncomeChoice } from "@/features/tax-profile/income-mode";

type OnboardingContextValue = {
	incomeChoices: IncomeChoice[];
	toggleChoice: (choice: IncomeChoice) => void;
	trackDeductibles: boolean | null;
	setTrackDeductibles: (value: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
	const [incomeChoices, setIncomeChoices] = useState<IncomeChoice[]>([]);
	const [trackDeductibles, setTrackDeductibles] = useState<boolean | null>(null);

	const toggleChoice = useCallback((choice: IncomeChoice) => {
		setIncomeChoices((current) =>
			current.includes(choice) ? current.filter((item) => item !== choice) : [...current, choice],
		);
	}, []);

	const value = useMemo(
		() => ({
			incomeChoices,
			toggleChoice,
			trackDeductibles,
			setTrackDeductibles,
		}),
		[incomeChoices, toggleChoice, trackDeductibles],
	);

	return <OnboardingContext value={value}>{children}</OnboardingContext>;
}

export function useOnboarding() {
	const context = use(OnboardingContext);

	if (!context) {
		throw new Error("useOnboarding debe usarse dentro de OnboardingProvider");
	}

	return context;
}
