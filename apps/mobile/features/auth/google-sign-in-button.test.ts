import { Children, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reactState = vi.hoisted(() => ({
	next: 0,
	setters: [vi.fn(), vi.fn()],
}));

const google = vi.hoisted(() => ({
	authenticate: vi.fn(),
	checkPlayServices: vi.fn(),
	presentExplicitSignIn: vi.fn(),
}));

const auth = vi.hoisted(() => ({
	social: vi.fn(),
}));

const haptics = vi.hoisted(() => ({
	trigger: vi.fn<() => Promise<void>>(),
}));

vi.mock("react", async () => {
	const actual = await vi.importActual<typeof import("react")>("react");

	return {
		...actual,
		useState: (initialValue: unknown) => {
			const setter = reactState.setters[reactState.next++];
			return [initialValue, setter];
		},
	};
});

vi.mock("react-native", () => ({
	Text: "Text",
	View: "View",
}));

vi.mock("uniwind", () => ({
	useUniwind: () => ({ theme: "dark" }),
}));

vi.mock("@react-native-google-signin/google-signin", () => ({
	GoogleLogoButton: "GoogleLogoButton",
	GoogleOneTapSignIn: google,
	statusCodes: {
		IN_PROGRESS: "IN_PROGRESS",
		PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
	},
}));

vi.mock("@/core/auth-client", () => ({
	authClient: {
		signIn: {
			social: auth.social,
		},
	},
}));

vi.mock("@/core/haptics", () => ({
	triggerHaptic: haptics.trigger,
}));

import { GoogleSignInButton } from "./google-sign-in-button";

const GOOGLE_USER = {
	type: "success",
	data: {
		user: {
			id: "google-user",
			email: "person@example.com",
			name: "Konti User",
			givenName: "Konti",
			familyName: "User",
			phoneNumber: null,
			photo: null,
		},
		idToken: "google-id-token",
		credentialOrigin: "user",
		serverAuthCode: null,
	},
} as const;

function renderButtonPress(): () => Promise<void> {
	const root = GoogleSignInButton() as ReactElement<{ children: ReactNode }>;
	const button = Children.toArray(root.props.children)[0] as ReactElement<{
		onPress: () => Promise<void>;
	}>;

	return button.props.onPress;
}

describe("GoogleSignInButton", () => {
	beforeEach(() => {
		reactState.next = 0;
		for (const setter of reactState.setters) setter.mockReset();
		google.authenticate.mockReset().mockResolvedValue({
			user: GOOGLE_USER.data,
			error: null,
			isCancelled: false,
		});
		google.checkPlayServices.mockReset().mockResolvedValue({
			minRequiredVersion: 1,
			installedVersion: 1,
		});
		google.presentExplicitSignIn.mockReset().mockResolvedValue(GOOGLE_USER);
		auth.social.mockReset().mockResolvedValue({ data: {}, error: null });
		haptics.trigger.mockReset().mockResolvedValue();
	});

	it("checks Play Services before opening Google's explicit account selector", async () => {
		await renderButtonPress()();

		expect(google.checkPlayServices).toHaveBeenCalledWith(true);
		expect(google.presentExplicitSignIn).toHaveBeenCalledOnce();
		expect(google.checkPlayServices.mock.invocationCallOrder[0]).toBeLessThan(
			google.presentExplicitSignIn.mock.invocationCallOrder[0] ?? 0,
		);
		expect(google.authenticate).not.toHaveBeenCalled();
		expect(auth.social).toHaveBeenCalledWith({
			provider: "google",
			idToken: { token: "google-id-token" },
		});
	});

	it("does not open the account selector when the Play Services check fails", async () => {
		google.checkPlayServices.mockRejectedValueOnce({
			code: "PLAY_SERVICES_NOT_AVAILABLE",
		});

		await renderButtonPress()();

		expect(google.presentExplicitSignIn).not.toHaveBeenCalled();
		expect(auth.social).not.toHaveBeenCalled();
		expect(reactState.setters[1]).toHaveBeenCalledWith("Google Play Services no está disponible.");
		expect(haptics.trigger).toHaveBeenCalledWith("error");
		expect(reactState.setters[0]).toHaveBeenLastCalledWith(false);
	});

	it("emits success feedback only after Better Auth accepts the ID token", async () => {
		await renderButtonPress()();

		expect(haptics.trigger).toHaveBeenCalledWith("success");
	});

	it("treats account-picker cancellation as neutral", async () => {
		google.presentExplicitSignIn.mockResolvedValueOnce({ type: "cancelled" });

		await renderButtonPress()();

		expect(auth.social).not.toHaveBeenCalled();
		expect(haptics.trigger).not.toHaveBeenCalled();
	});

	it("shows the Better Auth error and emits error feedback", async () => {
		auth.social.mockResolvedValueOnce({
			data: null,
			error: { message: "La sesión fue rechazada." },
		});

		await renderButtonPress()();

		expect(reactState.setters[1]).toHaveBeenCalledWith("La sesión fue rechazada.");
		expect(haptics.trigger).toHaveBeenCalledWith("error");
	});
});
