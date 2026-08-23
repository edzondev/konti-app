import { zodResolver } from "@hookform/resolvers/zod";
import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { triggerHaptic } from "@/core/haptics";
import { clampDateOnly, todayDateOnlyInLima } from "@/shared/date-only";
import { ControlledDateOnlyField } from "@/shared/ui/date-only-field";

import {
	createEmploymentIncomeFormSchema,
	type EmploymentIncomeFormInput,
	type EmploymentIncomeFormValues,
} from "../employment-form.validation";
import { employmentCoverageScopeDescription } from "../employment-income-copy";
import {
	useCreateTaxIncome,
	useDecideDocumentIncome,
	useDeleteTaxIncome,
	useResolveEmploymentCoverage,
	useUpdateTaxIncome,
} from "../tax-income.mutations";

type EmploymentIncomeFormProps = {
	userId: string;
	initialValues: EmploymentIncomeFormInput;
	recordId?: string;
	documentId?: string;
	coverageResolutionRequired?: boolean;
};

const KEYBOARD_STICKY_OFFSET = { closed: 0, opened: -8 } as const;
const MINIMUM_DATE = "2026-01-01";
const MAXIMUM_DATE = "2026-12-31";
const UniKeyboardAwareScrollView = withUniwind(KeyboardAwareScrollView);

const RECORD_KIND_OPTIONS = [
	{
		value: "period",
		label: "Una boleta mensual",
		description: "Registra lo pagado y retenido en un solo mes.",
	},
	{
		value: "year_to_date_snapshot",
		label: "Un reporte acumulado",
		description: "Por ejemplo, un certificado o reporte de enero a junio.",
	},
] as const;

const COVERAGE_SCOPE_OPTIONS = [
	{ value: "single_payer", label: "Corresponde a una empresa" },
	{ value: "all_employers", label: "Reúne a todos mis empleadores" },
] as const;

export function EmploymentIncomeForm({
	userId,
	initialValues,
	recordId,
	documentId,
	coverageResolutionRequired = false,
}: EmploymentIncomeFormProps) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const submitted = useRef(false);
	const [schema] = useState(() => createEmploymentIncomeFormSchema());
	const [idempotencyKey] = useState(() => randomUUID());
	const [today] = useState(() => clampDateOnly(todayDateOnlyInLima(), MINIMUM_DATE, MAXIMUM_DATE));
	const methods = useForm<EmploymentIncomeFormInput, unknown, EmploymentIncomeFormValues>({
		resolver: zodResolver(schema),
		defaultValues: initialValues,
		shouldFocusError: true,
	});
	const createMutation = useCreateTaxIncome(userId);
	const updateMutation = useUpdateTaxIncome(userId, recordId ?? "");
	const deleteMutation = useDeleteTaxIncome(userId);
	const documentDecisionMutation = useDecideDocumentIncome(userId);
	const coverageResolutionMutation = useResolveEmploymentCoverage(userId, recordId ?? "");

	const submit = methods.handleSubmit((values) => {
		if (submitted.current) return;
		submitted.current = true;
		if (documentId) {
			documentDecisionMutation.mutate({
				...values,
				documentId,
				decision: "employment_confirmed",
				incomeType: "employment",
			});
		} else if (recordId) {
			updateMutation.mutate({ ...values, incomeType: "employment" });
		} else {
			createMutation.mutate({
				...values,
				incomeType: "employment",
				idempotencyKey,
			});
		}
		router.back();
	});

	const confirmDelete = () => {
		if (!recordId) return;
		Alert.alert("Eliminar ingreso de planilla", "La estimación se actualizará sin este registro.", [
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
									? "DOCUMENTO DE PLANILLA"
									: recordId
										? "EDITAR PLANILLA"
										: "NUEVO INGRESO"}
							</Text>
							<Text className="text-[32px] font-light leading-[38px] tracking-tight text-konti-ivory">
								Registra lo que tu empresa pagó y retuvo.
							</Text>
							<Text className="text-[14px] leading-6 text-konti-ivory/45">
								Normalmente tu empleador hace la retención. Konti reúne la evidencia y evita sumar
								dos veces una boleta que ya está dentro de un acumulado.
							</Text>
							{documentId ? (
								<Text className="text-[13px] leading-5 text-konti-primary/80">
									Estos datos vienen del OCR y aún no están verificados por SUNAT. Puedes
									corregirlos antes de guardar.
								</Text>
							) : null}
						</View>
						{coverageResolutionRequired && recordId ? (
							<CoverageConflictReview
								isError={coverageResolutionMutation.isError}
								isPending={coverageResolutionMutation.isPending}
								onResolve={(decision) => coverageResolutionMutation.mutate({ decision })}
							/>
						) : null}

						<ControlledRecordKind />
						<View className="gap-4 rounded-[22px] border border-konti-ivory/10 bg-konti-surface p-4">
							<Text className="text-[13px] font-medium text-konti-ivory/60">
								¿Qué periodo cubre?
							</Text>
							<ControlledCoverageDate maximumDate={today} name="coverageStart" label="Desde" />
							<ControlledCoverageDate maximumDate={today} name="coverageEnd" label="Hasta" />
						</View>
						<ControlledCoverageScope />
						<ControlledEmploymentTextField
							autoCapitalize="words"
							label="Empresa"
							name="payerName"
							placeholder="Nombre de la empresa"
						/>
						<ControlledEmploymentTextField
							autoCapitalize="none"
							keyboardType="number-pad"
							label="RUC de la empresa (opcional)"
							name="payerTaxId"
							placeholder="11 dígitos"
							help="Es el RUC del empleador, no tu RUC personal. Si lo tienes, permite resolver cruces exactos."
						/>
						<ControlledEmploymentTextField
							keyboardType="decimal-pad"
							label="Ingreso bruto del periodo"
							name="grossAmount"
							placeholder="0.00"
							prefix="S/"
						/>
						<ControlledEmploymentTextField
							keyboardType="decimal-pad"
							label="Retención de quinta"
							name="withheldTaxAmount"
							placeholder="0.00"
							prefix="S/"
						/>
						<ControlledEmploymentTextField
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
							onPress={() => void submit()}
						>
							<Text className="text-[16px] font-semibold text-konti-bg">
								{documentId ? "Confirmar y registrar" : "Guardar ingreso"}
							</Text>
						</Pressable>
					</View>
				</KeyboardStickyView>
			</View>
		</FormProvider>
	);
}

function CoverageConflictReview({
	isError,
	isPending,
	onResolve,
}: {
	isError: boolean;
	isPending: boolean;
	onResolve: (decision: "include_separately" | "exclude_as_covered") => void;
}) {
	return (
		<View className="gap-3 rounded-[22px] border border-konti-primary/30 bg-konti-primary/10 p-4">
			<Text className="text-[16px] leading-6 text-konti-ivory">
				¿Este ingreso ya está en un acumulado?
			</Text>
			<Text className="text-[13px] leading-5 text-konti-ivory/55">
				Encontramos periodos que se cruzan. Confirma si deben sumarse por separado para evitar
				contarlos dos veces.
			</Text>
			<View className="gap-2">
				<Pressable
					accessibilityRole="button"
					className="min-h-12 items-center justify-center rounded-2xl bg-konti-ivory px-4"
					disabled={isPending}
					onPress={() => onResolve("include_separately")}
				>
					<Text className="text-[14px] font-semibold text-konti-bg">Sí, sumarlo por separado</Text>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					className="min-h-12 items-center justify-center rounded-2xl border border-konti-ivory/15 px-4"
					disabled={isPending}
					onPress={() => onResolve("exclude_as_covered")}
				>
					<Text className="text-[14px] text-konti-ivory">No, ya está dentro del acumulado</Text>
				</Pressable>
			</View>
			{isPending ? (
				<Text className="text-[12px] text-konti-primary">Guardando tu decisión…</Text>
			) : null}
			{isError ? (
				<Text accessibilityRole="alert" className="text-[12px] leading-5 text-konti-primary">
					No pudimos guardar la decisión. Puedes intentarlo otra vez con la misma opción.
				</Text>
			) : null}
		</View>
	);
}

function ControlledRecordKind() {
	const { control } = useFormContext<
		EmploymentIncomeFormInput,
		unknown,
		EmploymentIncomeFormValues
	>();
	return (
		<Controller
			control={control}
			name="recordKind"
			render={({ field, fieldState }) => (
				<View className="gap-2" accessibilityRole="radiogroup">
					<Text className="text-[13px] font-medium text-konti-ivory/60">
						¿Qué estás registrando?
					</Text>
					{RECORD_KIND_OPTIONS.map((option) => {
						const selected = field.value === option.value;
						return (
							<Pressable
								accessibilityRole="radio"
								accessibilityState={{ checked: selected }}
								className={`min-h-18 rounded-2xl border px-4 py-3 ${selected ? "border-konti-primary bg-konti-primary/10" : "border-konti-ivory/10 bg-konti-surface"}`}
								key={option.value}
								onPress={() => {
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
					<FieldError message={fieldState.error?.message} />
				</View>
			)}
		/>
	);
}

function ControlledCoverageScope() {
	const { control } = useFormContext<
		EmploymentIncomeFormInput,
		unknown,
		EmploymentIncomeFormValues
	>();
	const payerTaxId = useWatch({ control, name: "payerTaxId" });
	return (
		<Controller
			control={control}
			name="coverageScope"
			render={({ field, fieldState }) => (
				<View className="gap-2" accessibilityRole="radiogroup">
					<Text className="text-[13px] font-medium text-konti-ivory/60">
						¿A quiénes incluye este documento?
					</Text>
					{COVERAGE_SCOPE_OPTIONS.map((option) => {
						const selected = field.value === option.value;
						return (
							<Pressable
								accessibilityRole="radio"
								accessibilityState={{ checked: selected }}
								className={`min-h-13 justify-center rounded-2xl border px-4 ${selected ? "border-konti-primary bg-konti-primary/10" : "border-konti-ivory/10 bg-konti-surface"}`}
								key={option.value}
								onPress={() => {
									field.onChange(option.value);
									void triggerHaptic("selection");
								}}
							>
								<Text className="text-[14px] text-konti-ivory">{option.label}</Text>
							</Pressable>
						);
					})}
					{field.value ? (
						<Text className="text-[12px] leading-5 text-konti-ivory/40">
							{employmentCoverageScopeDescription(field.value, payerTaxId || null)}
						</Text>
					) : null}
					<FieldError message={fieldState.error?.message} />
				</View>
			)}
		/>
	);
}

function ControlledCoverageDate({
	name,
	label,
	maximumDate,
}: {
	name: "coverageStart" | "coverageEnd";
	label: string;
	maximumDate: string;
}) {
	const { control } = useFormContext<
		EmploymentIncomeFormInput,
		unknown,
		EmploymentIncomeFormValues
	>();
	return (
		<ControlledDateOnlyField
			control={control}
			emptyViewportDate={maximumDate}
			label={label}
			maximumDate={maximumDate}
			minimumDate={MINIMUM_DATE}
			name={name}
			variant="nested"
		/>
	);
}

type EmploymentTextFieldName =
	| "grossAmount"
	| "withheldTaxAmount"
	| "payerName"
	| "payerTaxId"
	| "notes";

function ControlledEmploymentTextField({
	name,
	label,
	placeholder,
	prefix,
	help,
	keyboardType = "default",
	multiline = false,
	autoCapitalize = "sentences",
}: {
	name: EmploymentTextFieldName;
	label: string;
	placeholder: string;
	prefix?: string;
	help?: string;
	keyboardType?: "default" | "decimal-pad" | "number-pad";
	multiline?: boolean;
	autoCapitalize?: "none" | "sentences" | "words";
}) {
	const { control } = useFormContext<
		EmploymentIncomeFormInput,
		unknown,
		EmploymentIncomeFormValues
	>();
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
					{help ? <Text className="text-[12px] leading-5 text-konti-ivory/35">{help}</Text> : null}
					<FieldError message={fieldState.error?.message} />
				</View>
			)}
		/>
	);
}

function FieldError({ message }: { message?: string }) {
	return message ? (
		<Text accessibilityRole="alert" className="text-[12px] text-konti-primary">
			{message}
		</Text>
	) : null;
}
