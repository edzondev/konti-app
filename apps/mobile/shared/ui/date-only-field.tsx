import DateTimePicker, { type DateTimePickerChangeEvent } from "@expo/ui/community/datetime-picker";
import { type Ref, useState } from "react";
import { type Control, Controller, type FieldPathByValue, type FieldValues } from "react-hook-form";
import { Platform, Pressable, Text, View } from "react-native";
import { withUniwind } from "uniwind";

import { triggerHaptic } from "@/core/haptics";
import {
	type DateOnly,
	dateOnlyToPickerDate,
	pickerDateToDateOnly,
	resolveDateOnlyViewport,
} from "@/shared/date-only";

const UniDateTimePicker = withUniwind(DateTimePicker);

export type DateOnlyFieldProps = {
	value: DateOnly | "";
	onChange: (value: DateOnly) => void;
	onBlur?: () => void;
	inputRef?: Ref<View>;
	label: string;
	error?: string;
	helpText?: string;
	minimumDate: DateOnly;
	maximumDate: DateOnly;
	emptyViewportDate?: DateOnly;
	placeholder?: string;
	disabled?: boolean;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	variant?: "surface" | "nested";
};

export function DateOnlyField({
	value,
	onChange,
	onBlur,
	inputRef,
	label,
	error,
	helpText,
	minimumDate,
	maximumDate,
	emptyViewportDate,
	placeholder = "Selecciona una fecha",
	disabled = false,
	accessibilityLabel = `Seleccionar ${label}`,
	accessibilityHint = "Abre un calendario",
	variant = "surface",
}: DateOnlyFieldProps) {
	const [showPicker, setShowPicker] = useState(false);
	const viewportDate = resolveDateOnlyViewport({
		value,
		emptyViewportDate,
		minimumDate,
		maximumDate,
	});
	const surfaceClass = variant === "nested" ? "bg-konti-bg" : "bg-konti-surface";
	const commitDate = (selectedDate: DateOnly) => {
		if (disabled) return;
		onChange(selectedDate);
		onBlur?.();
		setShowPicker(false);
		void triggerHaptic("selection");
	};
	const picker = (
		<UniDateTimePicker
			accentColor="#E2A654"
			className={disabled ? "opacity-50" : "opacity-100"}
			disabled={disabled}
			display={Platform.OS === "ios" ? "compact" : "default"}
			locale="es_PE"
			maximumDate={dateOnlyToPickerDate(maximumDate)}
			minimumDate={dateOnlyToPickerDate(minimumDate)}
			mode="date"
			onDismiss={() => {
				setShowPicker(false);
				onBlur?.();
			}}
			onValueChange={(_event: DateTimePickerChangeEvent, selectedDate: Date) => {
				commitDate(pickerDateToDateOnly(selectedDate));
			}}
			presentation={Platform.OS === "android" ? "dialog" : "inline"}
			themeVariant="dark"
			timeZoneName="America/Lima"
			value={dateOnlyToPickerDate(viewportDate)}
		/>
	);

	return (
		<View className="gap-2">
			<Text className="text-[13px] font-medium text-konti-ivory/60">{label}</Text>
			{Platform.OS === "android" ? (
				<>
					<Pressable
						ref={inputRef}
						accessibilityHint={accessibilityHint}
						accessibilityLabel={accessibilityLabel}
						accessibilityRole="button"
						accessibilityState={{ disabled }}
						accessibilityValue={{ text: value || "Sin fecha" }}
						className={`min-h-14 justify-center rounded-2xl border border-konti-ivory/10 px-4 ${surfaceClass} ${disabled ? "opacity-50" : "opacity-100"}`}
						disabled={disabled}
						onBlur={onBlur}
						onPress={() => setShowPicker(true)}
					>
						<Text
							className={value ? "text-base text-konti-ivory" : "text-base text-konti-ivory/35"}
						>
							{value || placeholder}
						</Text>
					</Pressable>
					{showPicker ? picker : null}
				</>
			) : value === "" && !showPicker ? (
				<Pressable
					ref={inputRef}
					accessibilityHint={accessibilityHint}
					accessibilityLabel={accessibilityLabel}
					accessibilityRole="button"
					accessibilityState={{ disabled }}
					accessibilityValue={{ text: "Sin fecha" }}
					className={`min-h-14 justify-center rounded-2xl border border-konti-ivory/10 px-4 ${surfaceClass} ${disabled ? "opacity-50" : "opacity-100"}`}
					disabled={disabled}
					onBlur={onBlur}
					onPress={() => setShowPicker(true)}
				>
					<Text className="text-base text-konti-ivory/35">{placeholder}</Text>
				</Pressable>
			) : (
				<View
					className={`min-h-14 gap-2 justify-center rounded-2xl border border-konti-ivory/10 px-3 ${surfaceClass} ${disabled ? "opacity-50" : "opacity-100"}`}
					pointerEvents={disabled ? "none" : "auto"}
				>
					{picker}
					{value === "" ? (
						<Pressable
							accessibilityLabel={`Confirmar ${viewportDate}`}
							accessibilityRole="button"
							className="min-h-11 items-center justify-center rounded-xl bg-konti-ivory/10 px-3"
							disabled={disabled}
							onPress={() => commitDate(viewportDate)}
						>
							<Text className="text-[13px] font-medium text-konti-ivory">Usar {viewportDate}</Text>
						</Pressable>
					) : null}
				</View>
			)}
			{helpText ? (
				<Text className="text-[12px] leading-5 text-konti-ivory/35">{helpText}</Text>
			) : null}
			{error ? (
				<Text accessibilityRole="alert" className="text-[12px] text-konti-primary">
					{error}
				</Text>
			) : null}
		</View>
	);
}

export type ControlledDateOnlyFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
	TTransformedValues = TFieldValues,
> = Omit<DateOnlyFieldProps, "value" | "onChange" | "onBlur" | "inputRef" | "error"> & {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
};

export function ControlledDateOnlyField<
	TFieldValues extends FieldValues,
	TName extends FieldPathByValue<TFieldValues, string>,
	TTransformedValues = TFieldValues,
>({
	control,
	name,
	...props
}: ControlledDateOnlyFieldProps<TFieldValues, TName, TTransformedValues>) {
	return (
		<Controller<TFieldValues, TName, TTransformedValues>
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<DateOnlyField
					{...props}
					error={fieldState.error?.message}
					inputRef={field.ref}
					onBlur={field.onBlur}
					onChange={field.onChange}
					value={field.value as string}
				/>
			)}
		/>
	);
}
