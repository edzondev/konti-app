import DateTimePicker from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Platform, Pressable, Text, View } from "react-native";
import type { TaxIncomeFormInput, TaxIncomeFormValues } from "../tax-income.validation";

import {
	dateStringToPickerDate,
	maximumPaymentDate,
	pickerDateToDateString,
} from "../tax-income-form.helpers";

const MINIMUM_DATE = new Date(2026, 0, 1, 12);

export function ControlledDateField() {
	const { control } = useFormContext<TaxIncomeFormInput, unknown, TaxIncomeFormValues>();
	const [showAndroidPicker, setShowAndroidPicker] = useState(false);
	const [maximumDate] = useState(() => maximumPaymentDate());

	return (
		<Controller
			control={control}
			name="receivedAt"
			render={({ field, fieldState }) => {
				const value = field.value ? dateStringToPickerDate(field.value) : maximumDate;
				const picker = (
					<DateTimePicker
						accentColor="#E2A654"
						display={Platform.OS === "ios" ? "compact" : "default"}
						locale="es_PE"
						maximumDate={maximumDate}
						minimumDate={MINIMUM_DATE}
						mode="date"
						onDismiss={() => setShowAndroidPicker(false)}
						onValueChange={(_event, selectedDate) => {
							field.onChange(pickerDateToDateString(selectedDate));
							setShowAndroidPicker(false);
						}}
						presentation={Platform.OS === "android" ? "dialog" : "inline"}
						themeVariant="dark"
						timeZoneName="America/Lima"
						value={value}
					/>
				);

				return (
					<View className="gap-2">
						<Text className="text-[13px] font-medium text-konti-ivory/60">Fecha de cobro</Text>
						{Platform.OS === "android" ? (
							<>
								<Pressable
									ref={field.ref}
									accessibilityLabel="Seleccionar fecha de cobro"
									accessibilityRole="button"
									className="min-h-14 justify-center rounded-2xl border border-konti-ivory/10 bg-konti-surface px-4"
									onPress={() => setShowAndroidPicker(true)}
								>
									<Text
										className={
											field.value ? "text-base text-konti-ivory" : "text-base text-konti-ivory/35"
										}
									>
										{field.value || "Selecciona la fecha en que cobraste"}
									</Text>
								</Pressable>
								{showAndroidPicker ? picker : null}
							</>
						) : (
							<View className="min-h-14 justify-center rounded-2xl border border-konti-ivory/10 bg-konti-surface px-3">
								{picker}
							</View>
						)}
						<Text className="text-[12px] leading-5 text-konti-ivory/35">
							Es la fecha en que recibiste el pago, no la fecha de emisión.
						</Text>
						{fieldState.error ? (
							<Text accessibilityRole="alert" className="text-[12px] text-konti-primary">
								{fieldState.error.message}
							</Text>
						) : null}
					</View>
				);
			}}
		/>
	);
}
