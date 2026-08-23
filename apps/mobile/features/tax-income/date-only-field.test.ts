import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	dateOnlyToPickerDate,
	pickerDateToDateOnly,
	resolveDateOnlyViewport,
	todayDateOnlyInLima,
} from "@/shared/date-only";
import { ControlledDateOnlyField, DateOnlyField } from "@/shared/ui/date-only-field";

const nativeMocks = vi.hoisted(() => ({
	setPickerVisible: vi.fn(),
	haptic: vi.fn(),
	pickerVisible: true,
	platformOS: "android",
}));

vi.mock("react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react")>();
	return {
		...actual,
		useState: vi.fn(() => [nativeMocks.pickerVisible, nativeMocks.setPickerVisible]),
	};
});

vi.mock("react-native", () => ({
	Platform: {
		get OS() {
			return nativeMocks.platformOS;
		},
	},
	Pressable: "Pressable",
	Text: "Text",
	View: "View",
}));

vi.mock("@expo/ui/community/datetime-picker", () => ({ default: "DateTimePicker" }));
vi.mock("uniwind", () => ({ withUniwind: (component: unknown) => component }));
vi.mock("@/core/haptics", () => ({ triggerHaptic: nativeMocks.haptic }));

describe("date-only helpers", () => {
	it.each([
		["2026-07-01", "2026-07-01T12:00:00.000Z"],
		["2026-07-02", "2026-07-02T12:00:00.000Z"],
		["2024-02-29", "2024-02-29T12:00:00.000Z"],
	] as const)("anchors civil date %s at UTC noon", (value, expectedInstant) => {
		expect(dateOnlyToPickerDate(value).toISOString()).toBe(expectedInstant);
	});

	it("keeps the UTC-midnight date emitted by the Android picker", () => {
		expect(pickerDateToDateOnly(new Date("2026-07-01T00:00:00.000Z"))).toBe("2026-07-01");
		expect(pickerDateToDateOnly(new Date("2026-07-02T00:00:00.000Z"))).toBe("2026-07-02");
	});

	it("rejects impossible civil dates instead of rolling them into another month", () => {
		expect(() => dateOnlyToPickerDate("2026-02-29")).toThrow("Invalid date-only value");
	});

	it("clamps only the empty viewport while preserving a confirmed value", () => {
		expect(
			resolveDateOnlyViewport({
				value: "",
				emptyViewportDate: "2025-12-31",
				minimumDate: "2026-01-01",
				maximumDate: "2026-08-23",
			}),
		).toBe("2026-01-01");
		expect(
			resolveDateOnlyViewport({
				value: "2026-07-02",
				emptyViewportDate: "2026-08-23",
				minimumDate: "2026-01-01",
				maximumDate: "2026-08-23",
			}),
		).toBe("2026-07-02");
	});

	it("derives today from Lima at the UTC boundary", () => {
		expect(todayDateOnlyInLima(new Date("2026-07-02T04:59:59.000Z"))).toBe("2026-07-01");
		expect(todayDateOnlyInLima(new Date("2026-07-02T05:00:00.000Z"))).toBe("2026-07-02");
	});
});

describe("DateOnlyField", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		nativeMocks.pickerVisible = true;
		nativeMocks.platformOS = "android";
	});

	it("exposes an accessible Android dialog and emits a canonical selected date", () => {
		const onChange = vi.fn();
		const onBlur = vi.fn();
		const tree = DateOnlyField({
			value: "",
			onChange,
			onBlur,
			label: "Fecha de cobro",
			helpText: "Usa la fecha real del pago.",
			error: "Confirma una fecha.",
			minimumDate: "2026-01-01",
			maximumDate: "2026-08-23",
			emptyViewportDate: "2026-07-02",
			placeholder: "Selecciona cuándo cobraste",
		});

		const trigger = findElement(tree, "Pressable");
		const picker = findElement(tree, "DateTimePicker");
		expect(trigger.props).toMatchObject({
			accessibilityLabel: "Seleccionar Fecha de cobro",
			accessibilityRole: "button",
			accessibilityState: { disabled: false },
			accessibilityValue: { text: "Sin fecha" },
		});
		expect(picker.props).toMatchObject({
			disabled: false,
			locale: "es_PE",
			mode: "date",
			presentation: "dialog",
			timeZoneName: "America/Lima",
		});
		expect((picker.props.value as Date).toISOString()).toBe("2026-07-02T12:00:00.000Z");

		(picker.props.onValueChange as (event: unknown, value: Date) => void)(
			{},
			new Date("2026-07-02T00:00:00.000Z"),
		);
		expect(onChange).toHaveBeenCalledWith("2026-07-02");
		expect(onBlur).toHaveBeenCalledTimes(1);
		expect(nativeMocks.haptic).toHaveBeenCalledWith("selection");
	});

	it("keeps an empty iOS value visibly unconfirmed, then can confirm its viewport day", () => {
		nativeMocks.platformOS = "ios";
		nativeMocks.pickerVisible = false;
		const onChange = vi.fn();
		const unopened = DateOnlyField({
			value: "",
			onChange,
			label: "Fecha de cobro",
			minimumDate: "2026-01-01",
			maximumDate: "2026-08-23",
			emptyViewportDate: "2026-07-02",
			placeholder: "Seleccionar fecha",
		});

		expect(findElement(unopened, "Pressable").props.accessibilityValue).toEqual({
			text: "Sin fecha",
		});
		expect(findElementByText(unopened, "Seleccionar fecha").props.children).toBe(
			"Seleccionar fecha",
		);
		expect(findElementOrNull(unopened, "DateTimePicker")).toBeNull();

		nativeMocks.pickerVisible = true;
		const opened = DateOnlyField({
			value: "",
			onChange,
			label: "Fecha de cobro",
			minimumDate: "2026-01-01",
			maximumDate: "2026-08-23",
			emptyViewportDate: "2026-07-02",
		});
		const confirm = findElementByAccessibilityLabel(opened, "Confirmar 2026-07-02");
		(confirm.props.onPress as () => void)();
		expect(onChange).toHaveBeenCalledWith("2026-07-02");
	});

	it("forwards RHF value, callbacks, ref and error to the presentational field", () => {
		const field = {
			value: "2026-07-01",
			onChange: vi.fn(),
			onBlur: vi.fn(),
			ref: vi.fn(),
			name: "receivedAt",
		};
		const controllerElement = ControlledDateOnlyField({
			control: {} as never,
			name: "receivedAt" as never,
			label: "Fecha de cobro",
			minimumDate: "2026-01-01",
			maximumDate: "2026-08-23",
			emptyViewportDate: "2026-08-23",
		});
		const rendered = (controllerElement.props as Record<string, unknown>).render as (input: {
			field: typeof field;
			fieldState: { error?: { message?: string } };
		}) => ReactElement<Record<string, unknown>>;

		const dateField = rendered({ field, fieldState: { error: { message: "Fecha requerida" } } });
		expect(dateField.type).toBe(DateOnlyField);
		expect(dateField.props).toMatchObject({
			value: "2026-07-01",
			onChange: field.onChange,
			onBlur: field.onBlur,
			inputRef: field.ref,
			error: "Fecha requerida",
		});
	});
});

function findElement(root: unknown, type: string): ReactElement<Record<string, unknown>> {
	const result = findElementOrNull(root, type);
	if (result) return result;
	throw new Error(`Element ${type} not found`);
}

function findElementOrNull(
	root: unknown,
	type: string,
): ReactElement<Record<string, unknown>> | null {
	if (isValidElement<Record<string, unknown>>(root)) {
		if (root.type === type) return root;
		for (const child of Children.toArray(root.props.children as ReactNode)) {
			const result = findElementOrNull(child, type);
			if (result) return result;
		}
	}
	return null;
}

function findElementByAccessibilityLabel(
	root: unknown,
	label: string,
): ReactElement<Record<string, unknown>> {
	const result = findElementByAccessibilityLabelOrNull(root, label);
	if (result) return result;
	throw new Error(`Element with accessibilityLabel ${label} not found`);
}

function findElementByAccessibilityLabelOrNull(
	root: unknown,
	label: string,
): ReactElement<Record<string, unknown>> | null {
	if (isValidElement<Record<string, unknown>>(root)) {
		if (root.props.accessibilityLabel === label) return root;
		for (const child of Children.toArray(root.props.children as ReactNode)) {
			const result = findElementByAccessibilityLabelOrNull(child, label);
			if (result) return result;
		}
	}
	return null;
}

function findElementByText(root: unknown, text: string): ReactElement<Record<string, unknown>> {
	if (isValidElement<Record<string, unknown>>(root)) {
		if (root.props.children === text) return root;
		for (const child of Children.toArray(root.props.children as ReactNode)) {
			try {
				return findElementByText(child, text);
			} catch {}
		}
	}
	throw new Error(`Element with text ${text} not found`);
}
