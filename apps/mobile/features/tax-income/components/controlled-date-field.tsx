import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { clampDateOnly, todayDateOnlyInLima } from "@/shared/date-only";
import { ControlledDateOnlyField } from "@/shared/ui/date-only-field";

import type { TaxIncomeFormInput, TaxIncomeFormValues } from "../tax-income.validation";

const MINIMUM_DATE = "2026-01-01";
const MAXIMUM_DATE = "2026-12-31";

export function ControlledDateField() {
	const { control } = useFormContext<TaxIncomeFormInput, unknown, TaxIncomeFormValues>();
	const [today] = useState(() => clampDateOnly(todayDateOnlyInLima(), MINIMUM_DATE, MAXIMUM_DATE));

	return (
		<ControlledDateOnlyField
			control={control}
			emptyViewportDate={today}
			helpText="Es la fecha en que recibiste el pago, no la fecha de emisión."
			label="Fecha de cobro"
			maximumDate={today}
			minimumDate={MINIMUM_DATE}
			name="receivedAt"
			placeholder="Selecciona la fecha en que cobraste"
		/>
	);
}
