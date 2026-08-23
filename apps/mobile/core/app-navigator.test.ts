import { Children, isValidElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react")>();
	return {
		...actual,
		useEffect: vi.fn(),
		useRef: vi.fn(() => ({ current: false })),
	};
});

vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(() => ({
		data: {
			profile: { incomeMode: "mixed", trackDeductibles: true },
			requiresOnboarding: false,
		},
		isError: false,
		isPending: false,
	})),
}));

vi.mock("expo-router", () => {
	const Stack = Object.assign(vi.fn(), {
		Protected: vi.fn(),
		Screen: vi.fn(),
	});
	return { Stack };
});

vi.mock("expo-splash-screen", () => ({
	hide: vi.fn(),
}));

vi.mock("react-native", () => ({
	ActivityIndicator: vi.fn(),
	Pressable: vi.fn(),
	Text: vi.fn(),
	View: vi.fn(),
}));

vi.mock("./auth-client", () => ({
	authClient: {
		useSession: vi.fn(() => ({
			data: { user: { id: "user-1" } },
			isPending: false,
		})),
	},
}));

vi.mock("./app-access", () => ({
	taxFeatureAccess: vi.fn(() => ({
		deductions: true,
		monthlyFourth: true,
		workIncome: true,
	})),
}));

vi.mock("@/features/tax-profile/tax-profile.queries", () => ({
	currentTaxProfileQuery: vi.fn(() => ({ queryKey: ["tax-profile"] })),
}));

afterEach(() => {
	vi.resetModules();
	vi.unstubAllEnvs();
});

describe("AppNavigator protected tax forms", () => {
	it("keeps the iOS income form sheet mounted when the user drags vertically", async () => {
		const options = await taxIncomeFormOptionsFor("ios");

		expect(options).toMatchObject({
			presentation: "formSheet",
			gestureEnabled: false,
			sheetExpandsWhenScrolledToEdge: false,
		});
	});

	it("uses a non-draggable native modal for the Android income form", async () => {
		const options = await taxIncomeFormOptionsFor("android");

		expect(options).toMatchObject({
			presentation: "modal",
			headerShown: false,
		});
	});
});

async function taxIncomeFormOptionsFor(expoOs: "android" | "ios") {
	vi.stubEnv("EXPO_OS", expoOs);
	const { AppNavigator } = await import("./app-navigator.js");
	const tree = AppNavigator();
	const screen = findScreen(tree, "tax-income-form");

	expect(screen).toBeDefined();
	return screen?.props.options as Record<string, unknown>;
}

function findScreen(
	node: ReactNode,
	name: string,
): { props: { name?: string; options?: unknown; children?: ReactNode } } | undefined {
	if (!isValidElement<{ name?: string; options?: unknown; children?: ReactNode }>(node)) {
		return undefined;
	}
	if (node.props.name === name) return node;

	for (const child of Children.toArray(node.props.children)) {
		const match = findScreen(child, name);
		if (match) return match;
	}
	return undefined;
}
