import type { Control } from "react-hook-form";

import { ControlledDateOnlyField } from "@/shared/ui/date-only-field";
import type { TaxDeductionFormInput, TaxDeductionFormValues } from "../tax-deduction.validation";

export function TaxDeductionPaidAtField({
	control,
	today,
}: {
	control: Control<TaxDeductionFormInput, unknown, TaxDeductionFormValues>;
	today: string;
}) {
	return (
		<ControlledDateOnlyField
			control={control}
			emptyViewportDate={today}
			helpText="Elige la fecha real en que pagaste; no usamos la fecha de emisión del comprobante."
			label="Fecha real de pago"
			maximumDate={today}
			minimumDate="2026-01-01"
			name="paidAt"
			placeholder="Selecciona cuándo pagaste"
		/>
	);
}
