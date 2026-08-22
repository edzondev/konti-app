import { zodResolver } from "@hookform/resolvers/zod";
import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { taxIncomeFormPendingState } from "../tax-income-form.helpers";
import { ControlledDateField } from "./controlled-date-field";

type TaxIncomeFormProps = {
	userId: string;
	initialValues: TaxIncomeFormInput;
	recordId?: string;
	documentId?: string;
	issueDate?: string | null;
};

export function TaxIncomeForm({
	userId,
	initialValues,
	recordId,
	documentId,
	issueDate,
}: TaxIncomeFormProps) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const [schema] = useState(() => createTaxIncomeFormSchema());
	const [idempotencyKey] = useState(() => randomUUID());
	const [submitError, setSubmitError] = useState<string | null>(null);
	const methods = useForm<TaxIncomeFormInput, unknown, TaxIncomeFormValues>({
		resolver: zodResolver(schema),
		defaultValues: initialValues,
		shouldFocusError: true,
	});
	const createMutation = useCreateTaxIncome(userId);
	const updateMutation = useUpdateTaxIncome(userId, recordId ?? "");
	const deleteMutation = useDeleteTaxIncome(userId);
	const documentDecisionMutation = useDecideDocumentIncome(userId);
	const { isAnyPending, isDeleting, isSaving } = taxIncomeFormPendingState({
		isCreatePending: createMutation.isPending,
		isUpdatePending: updateMutation.isPending,
		isDeletePending: deleteMutation.isPending,
		isDocumentDecisionPending: documentDecisionMutation.isPending,
	});

	const submit = methods.handleSubmit(async (values) => {
		setSubmitError(null);
		try {
			if (recordId) {
				await updateMutation.mutateAsync(values);
			} else if (documentId) {
				await documentDecisionMutation.mutateAsync({
					...values,
					documentId,
					decision: "confirmed",
				});
			} else {
				await createMutation.mutateAsync({ ...values, idempotencyKey });
			}
			router.back();
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: "No pudimos guardar el ingreso. Inténtalo nuevamente.",
			);
		}
	});

	const confirmDelete = () => {
		if (!recordId || isAnyPending) return;
		Alert.alert("Eliminar ingreso", "La estimación se actualizará sin este ingreso.", [
			{ text: "Cancelar", style: "cancel" },
			{
				text: "Eliminar",
				style: "destructive",
				onPress: () => {
					setSubmitError(null);
					void deleteMutation
						.mutateAsync(recordId)
						.then(() => router.back())
						.catch((error: unknown) => {
							setSubmitError(
								error instanceof Error ? error.message : "No pudimos eliminar el ingreso.",
							);
						});
				},
			},
		]);
	};

	return (
		<FormProvider {...methods}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				className="flex-1 bg-konti-bg"
			>
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

				<ScrollView
					contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 28 }}
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
									Fecha de emisión del RHE: {issueDate}. La fecha de cobro se registra por separado.
								</Text>
							) : null}
						</View>

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

						{submitError ? (
							<Text accessibilityRole="alert" className="text-[13px] leading-5 text-konti-primary">
								{submitError}
							</Text>
						) : null}

						<Pressable
							accessibilityRole="button"
							className={`min-h-14 items-center justify-center rounded-[18px] px-6 ${isAnyPending ? "bg-konti-ivory/35" : "bg-konti-ivory"}`}
							disabled={isAnyPending}
							onPress={() => void submit()}
						>
							<Text className="text-[16px] font-semibold text-konti-bg">
								{isSaving
									? "Guardando…"
									: documentId
										? "Registrar como ingreso mío"
										: "Guardar ingreso"}
							</Text>
						</Pressable>

						{recordId ? (
							<Pressable
								accessibilityRole="button"
								className="min-h-12 items-center justify-center"
								disabled={isAnyPending}
								onPress={confirmDelete}
							>
								<Text className="text-[14px] text-konti-primary">
									{isDeleting ? "Eliminando…" : "Eliminar ingreso"}
								</Text>
							</Pressable>
						) : null}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</FormProvider>
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
