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

vi.hoisted(() => {
	const { Module } = require("node:module") as {
		Module: { _extensions: Record<string, (mod: { exports: unknown }) => void> };
	};
	// Metro bundles this png; Node would parse it as JavaScript.
	Module._extensions[".png"] = (mod) => {
		mod.exports = 1;
	};
});

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
	Image: "Image",
	Pressable: "Pressable",
	Text: "Text",
	View: "View",
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

import { GoogleSignInButton } from "../features/auth/google-sign-in-button";

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

function renderButton(disabled?: boolean) {
	const root = GoogleSignInButton({ disabled }) as ReactElement<{ children: ReactNode }>;
	return Children.toArray(root.props.children)[0] as ReactElement<{
		disabled?: boolean;
		onPress: () => Promise<void>;
	}>;
}

function renderButtonPress(): () => Promise<void> {
	return renderButton().props.onPress;
}

function buttonTree(disabled?: boolean) {
	reactState.next = 0;
	const root = GoogleSignInButton({ disabled }) as ReactElement<{ children?: ReactNode }>;
	const texts: string[] = [];
	const images: ReactElement<{ style?: { flexShrink?: number; height?: number; width?: number } }>[] =
		[];

	function visit(node: ReactNode) {
		for (const child of Children.toArray(node)) {
			if (typeof child === "string" || typeof child === "number") {
				texts.push(String(child));
				continue;
			}

			const element = child as ReactElement<{
				children?: ReactNode;
				style?: { flexShrink?: number; height?: number; width?: number };
			}>;
			if (element.type === "Image") images.push(element);
			visit(element.props.children);
		}
	}

	visit(root);
	return { images, texts };
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

	it("keeps a fixed Google logo next to Continuar con Google when disabled", () => {
		const enabled = buttonTree();
		const disabled = buttonTree(true);

		expect(enabled.texts).toContain("Continuar con Google");
		expect(enabled.images).toHaveLength(1);
		expect(disabled.texts).toContain("Continuar con Google");
		expect(disabled.images).toHaveLength(1);
		expect(disabled.images[0]?.props.style).toMatchObject({
			flexShrink: 0,
			height: 20,
			width: 20,
		});
	});

	it("ignores press while disabled", async () => {
		const button = renderButton(true);

		expect(button.props.disabled).toBe(true);
		await button.props.onPress();

		expect(google.checkPlayServices).not.toHaveBeenCalled();
		expect(google.presentExplicitSignIn).not.toHaveBeenCalled();
		expect(auth.social).not.toHaveBeenCalled();
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
