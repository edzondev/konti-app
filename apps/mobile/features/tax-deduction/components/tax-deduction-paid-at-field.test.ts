import { expect, it, vi } from "vitest";

vi.mock("@/shared/ui/date-only-field", () => ({
	ControlledDateOnlyField: () => null,
}));

import { ControlledDateOnlyField } from "@/shared/ui/date-only-field";
import { TaxDeductionPaidAtField } from "./tax-deduction-paid-at-field";

it("requests a calendar-only payment date bounded by tax year and today", () => {
	const control = {} as never;
	const element = TaxDeductionPaidAtField({
		control,
		today: "2026-07-02",
	});

	expect(element.type).toBe(ControlledDateOnlyField);
	expect(element.props).toMatchObject({
		control,
		name: "paidAt",
		minimumDate: "2026-01-01",
		maximumDate: "2026-07-02",
		emptyViewportDate: "2026-07-02",
	});
	expect(element.props).not.toHaveProperty("keyboardType");
});
