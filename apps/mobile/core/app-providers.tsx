import type { PropsWithChildren } from "react";
import { GestureHandlerRootView as GestureHandlerRootViewComponent } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { withUniwind } from "uniwind";
import { MonthlyFourthOperationStatus } from "@/features/monthly-fourth/components/monthly-fourth-operation-status";
import { TaxDeductionOperationStatus } from "@/features/tax-deduction/components/tax-deduction-operation-status";
import { TaxIncomeOperationStatus } from "@/features/tax-income/components/tax-income-operation-status";
import { QueryProvider } from "./query-provider";

const GestureHandlerRootView = withUniwind(GestureHandlerRootViewComponent);

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<GestureHandlerRootView className="flex-1">
			<KeyboardProvider preload={false}>
				<QueryProvider>
					{children}
					<TaxIncomeOperationStatus />
					<TaxDeductionOperationStatus />
					<MonthlyFourthOperationStatus />
				</QueryProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
