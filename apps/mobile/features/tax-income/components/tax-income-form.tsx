import { zodResolver } from "@hookform/resolvers/zod";
import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { triggerHaptic } from "@/core/haptics";

import {
	useCreateTaxIncome,
	useDecideDocumentIncome,
	useDeleteTaxIncome,
	useUpdateTaxIncome,
} from "../tax-income.mutations";
import {
	createTaxIncomeFormSchema,
	type TaxIncomeFormInput,
	type TaxIncomeFormValues,
} from "../tax-income.validation";
import { ControlledDateField } from "./controlled-date-field";

type TaxIncomeFormProps = {
	userId: string;
	initialValues: TaxIncomeFormInput;
	recordId?: string;
	documentId?: string;
	issueDate?: string | null;
	dueDate?: string | null;
	documentReportedPaymentDate?: string | null;
};

const KEYBOARD_STICKY_OFFSET = { closed: 0, opened: -8 } as const;
const UniKeyboardAwareScrollView = withUniwind(KeyboardAwareScrollView);
const ACTIVITY_OPTIONS = [
	{
		value: "fourth_ordinary",
		label: "Un trabajo o servicio",
		description: "Por ejemplo, consultoría, diseño, un oficio u otro servicio independiente.",
	},
	{
		value: "fourth_special",
		label: "Un cargo especial",
		description: "Director de empresa, síndico, mandatario, gestor de negocios o albacea.",
	},
	{
		value: "unsure",
		label: "No estoy seguro",
		description:
			"No elegiremos la categoría más favorable ni incluiremos el ingreso hasta que lo confirmes.",
	},
] as const;

export function TaxIncomeForm({
	userId,
	initialValues,
	recordId,
	documentId,
	issueDate,
	dueDate,
	documentReportedPaymentDate,
}: TaxIncomeFormProps) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const [schema] = useState(() => createTaxIncomeFormSchema());
	const [idempotencyKey] = useState(() => randomUUID());
	const methods = useForm<TaxIncomeFormInput, unknown, TaxIncomeFormValues>({
		resolver: zodResolver(schema),
		defaultValues: initialValues,
		shouldFocusError: true,
	});
	const createMutation = useCreateTaxIncome(userId);
	const updateMutation = useUpdateTaxIncome(userId, recordId ?? "");
	const deleteMutation = useDeleteTaxIncome(userId);
	const documentDecisionMutation = useDecideDocumentIncome(userId);
	const selectedActivity = useWatch({ control: methods.control, name: "activityType" });

	const submit = methods.handleSubmit((values) => {
		if (!recordId && !documentId) {
			createMutation.mutate({ ...values, idempotencyKey });
		} else if (recordId) {
			updateMutation.mutate(values);
		} else if (documentId) {
			documentDecisionMutation.mutate({
				...values,
				documentId,
				decision: "paid",
			});
		}
		router.back();
	});
	const leaveActivityPending = () => {
		if (!documentId) {
			methods.setError("activityType", {
				type: "manual",
				message:
					"Para un ingreso manual, conserva este formulario y confirma la actividad antes de registrarlo.",
			});
			return;
		}
		documentDecisionMutation.mutate({ documentId, decision: "activity_unsure" });
		router.back();
	};

	const confirmDelete = () => {
		if (!recordId) return;
		Alert.alert("Eliminar ingreso", "La estimación se actualizará sin este ingreso.", [
			{ text: "Cancelar", style: "cancel" },
			{
				text: "Eliminar",
				style: "destructive",
				onPress: () => {
					deleteMutation.mutate(recordId);
					router.back();
				},
			},
		]);
	};

	return (
		<FormProvider {...methods}>
			<View className="flex-1 bg-konti-bg">
				<View className="flex-row items-center justify-between px-5 pt-4">
					<Pressable
						accessibilityRole="button"
						className="min-h-11 justify-center"
						hitSlop={12}
						onPress={() => router.back()}
					>
						<Text className="text-[15px] text-konti-ivory/55">Cancelar</Text>
					</Pressable>
					<Text className="text-[13px] font-medium uppercase tracking-[1.5px] text-konti-ivory/35">
						2026
					</Text>
				</View>

				<UniKeyboardAwareScrollView
					bottomOffset={96}
					contentContainerClassName="pb-7"
					keyboardDismissMode="interactive"
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View className="gap-7 px-5 pb-4 pt-5">
						<View className="gap-3">
							<Text className="font-mono text-[11px] tracking-[2.5px] text-konti-primary">
								{documentId
									? "RECIBO POR HONORARIOS"
									: recordId
										? "EDITAR INGRESO"
										: "NUEVO INGRESO"}
							</Text>
							<Text className="text-[32px] font-light leading-[38px] tracking-tight text-konti-ivory">
								{documentId
									? "Revisa lo que efectivamente cobraste."
									: "Registra un cobro de cuarta."}
							</Text>
							{documentId && issueDate ? (
								<Text className="text-[14px] leading-6 text-konti-ivory/45">
									Emitido el {issueDate}
									{dueDate ? ` y con vencimiento el ${dueDate}` : ""}. La fecha de cobro se confirma
									por separado.
								</Text>
							) : null}
							{documentId && documentReportedPaymentDate ? (
								<Text className="text-[13px] leading-5 text-konti-primary/80">
									El documento indica {documentReportedPaymentDate}, pero no la usaremos sin tu
									confirmación.
								</Text>
							) : null}
						</View>

						<ControlledActivityField />
						<ControlledDateField />
						<ControlledTextField
							label="Importe bruto"
							name="grossAmount"
							placeholder="0.00"
							keyboardType="decimal-pad"
							prefix="S/"
						/>
						<ControlledTextField
							label="Retención de renta"
							name="withheldTaxAmount"
							placeholder="0.00"
							keyboardType="decimal-pad"
							prefix="S/"
						/>
						<ControlledTextField
							autoCapitalize="words"
							label="Pagador (opcional)"
							name="payerName"
							placeholder="Nombre del cliente"
						/>
						<ControlledTextField
							label="Notas (opcional)"
							multiline
							name="notes"
							placeholder="Algo que quieras recordar"
						/>

						{recordId ? (
							<Pressable
								accessibilityRole="button"
								className="min-h-12 items-center justify-center"
								onPress={confirmDelete}
							>
								<Text className="text-[14px] text-konti-primary">Eliminar ingreso</Text>
							</Pressable>
						) : null}
					</View>
				</UniKeyboardAwareScrollView>

				<KeyboardStickyView offset={KEYBOARD_STICKY_OFFSET}>
					<View
						className="border-t border-konti-ivory/10 bg-konti-bg px-5 pt-3"
						style={{ paddingBottom: Math.max(insets.bottom, 16) }}
					>
						<Pressable
							accessibilityRole="button"
							className="min-h-14 items-center justify-center rounded-[18px] bg-konti-ivory px-6"
							onPress={() => {
								if (selectedActivity === "unsure") {
									leaveActivityPending();
									return;
								}
								void submit();
							}}
						>
							<Text className="text-[16px] font-semibold text-konti-bg">
								{selectedActivity === "unsure"
									? documentId
										? "Dejar para revisar"
										: "Continuar sin clasificar"
									: documentId
										? "Registrar como ingreso mío"
										: "Guardar ingreso"}
							</Text>
						</Pressable>
					</View>
				</KeyboardStickyView>
			</View>
		</FormProvider>
	);
}

function ControlledActivityField() {
	const { clearErrors, control } = useFormContext<
		TaxIncomeFormInput,
		unknown,
		TaxIncomeFormValues
	>();

	return (
		<Controller
			control={control}
			name="activityType"
			render={({ field, fieldState }) => (
				<View className="gap-2" accessibilityRole="radiogroup">
					<Text className="text-[13px] font-medium text-konti-ivory/60">
						¿Qué tipo de actividad generó este ingreso?
					</Text>
					<Text className="mb-1 text-[12px] leading-5 text-konti-ivory/40">
						Esto define si corresponde la deducción automática del 20%.
					</Text>
					{ACTIVITY_OPTIONS.map((option) => {
						const selected = field.value === option.value;
						return (
							<Pressable
								accessibilityRole="radio"
								accessibilityState={{ checked: selected }}
								className={`min-h-18 rounded-2xl border px-4 py-3 ${selected ? "border-konti-primary bg-konti-primary/10" : "border-konti-ivory/10 bg-konti-surface"}`}
								key={option.value}
								onBlur={field.onBlur}
								onPress={() => {
									clearErrors("activityType");
									field.onChange(option.value);
									void triggerHaptic("selection");
								}}
							>
								<Text className="text-[14px] font-medium text-konti-ivory">{option.label}</Text>
								<Text className="mt-1 text-[12px] leading-5 text-konti-ivory/45">
									{option.description}
								</Text>
							</Pressable>
						);
					})}
					{fieldState.error ? (
						<Text accessibilityRole="alert" className="text-[12px] text-konti-primary">
							{fieldState.error.message}
						</Text>
					) : null}
				</View>
			)}
		/>
	);
}

type ControlledTextFieldProps = {
	name: "grossAmount" | "withheldTaxAmount" | "payerName" | "notes";
	label: string;
	placeholder: string;
	prefix?: string;
	keyboardType?: "default" | "decimal-pad";
	multiline?: boolean;
	autoCapitalize?: "none" | "sentences" | "words";
};

function ControlledTextField({
	name,
	label,
	placeholder,
	prefix,
	keyboardType = "default",
	multiline = false,
	autoCapitalize = "sentences",
}: ControlledTextFieldProps) {
	const { control } = useFormContext<TaxIncomeFormInput, unknown, TaxIncomeFormValues>();

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<View className="gap-2">
					<Text className="text-[13px] font-medium text-konti-ivory/60">{label}</Text>
					<View
						className={`flex-row rounded-2xl border border-konti-ivory/10 bg-konti-surface px-4 ${multiline ? "min-h-28 items-start py-4" : "min-h-14 items-center"}`}
					>
						{prefix ? <Text className="mr-2 text-base text-konti-ivory/40">{prefix}</Text> : null}
						<TextInput
							ref={field.ref}
							autoCapitalize={autoCapitalize}
							className="flex-1 text-base text-konti-ivory"
							keyboardType={keyboardType}
							multiline={multiline}
							onBlur={field.onBlur}
							onChangeText={field.onChange}
							placeholder={placeholder}
							placeholderTextColor="rgba(237,233,226,0.28)"
							selectionColor="#E2A654"
							textAlignVertical={multiline ? "top" : "center"}
							value={field.value ?? ""}
						/>
					</View>
					{fieldState.error ? (
						<Text accessibilityRole="alert" className="text-[12px] text-konti-primary">
							{fieldState.error.message}
						</Text>
					) : null}
				</View>
			)}
		/>
	);
}
