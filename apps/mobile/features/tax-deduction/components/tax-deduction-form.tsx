import { zodResolver } from "@hookform/resolvers/zod";
import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Controller,
	type FieldPath,
	FormProvider,
	useForm,
	useFormContext,
	useWatch,
} from "react-hook-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, {
	Easing,
	FadeIn,
	FadeInDown,
	ReduceMotion,
	useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { triggerHaptic } from "@/core/haptics";
import { todayDateOnlyInLima } from "@/shared/date-only";
import {
	createTaxDeductionFormSchema,
	type TaxDeductionFormInput,
	type TaxDeductionFormValues,
	taxDeductionSubmissionFromValues,
} from "../tax-deduction.validation";
import { categoryCopy } from "../tax-deduction-copy";
import {
	type DeductionFormStepId,
	deductionFormDefaults,
	deductionFormSteps,
} from "../tax-deduction-form";
import { useSaveTaxDeduction } from "../tax-deduction-mutations";
import { createTaxDeductionSubmissionGate } from "../tax-deduction-operation-state";
import type { TaxDeductionCategory, TaxDeductionCollection, TaxDeductionRecord } from "../types";
import { TaxDeductionCandidateCard } from "./tax-deduction-candidate-card";
import { TaxDeductionPaidAtField } from "./tax-deduction-paid-at-field";
import { TaxDeductionSummary } from "./tax-deduction-summary";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const STEP_ENTER = FadeInDown.withInitialValues({
	opacity: 0,
	transform: [{ translateY: 8 }],
})
	.duration(180)
	.easing(EASE_OUT)
	.reduceMotion(ReduceMotion.System);
const REDUCED_STEP_ENTER = FadeIn.duration(100).easing(EASE_OUT);
const KEYBOARD_OFFSET = { closed: 0, opened: -8 } as const;
const UniKeyboardAwareScrollView = withUniwind(KeyboardAwareScrollView);

const CATEGORIES = Object.entries(categoryCopy).map(([value, copy]) => ({
	value: value as TaxDeductionCategory,
	label: copy.shortTitle,
}));
const TRI_STATE_OPTIONS = [
	{ value: "yes", label: "Sí" },
	{ value: "no", label: "No" },
	{ value: "unknown", label: "No estoy seguro" },
] as const;
const BANKING_OPTIONS = [
	...TRI_STATE_OPTIONS,
	{ value: "not_applicable", label: "No aplicaba bancarización" },
] as const;
const VERIFICATION_OPTIONS = [
	{ value: "user_confirmation", label: "Lo revisé en mi información de SUNAT" },
	{ value: "evidence_attached", label: "Usar la evidencia adjunta" },
	{ value: "unresolved", label: "No estoy seguro todavía" },
] as const;
const MEDICAL_BENEFICIARIES = [
	{ value: "self", label: "Para mí" },
	{ value: "spouse", label: "Para mi cónyuge" },
	{ value: "accredited_partner", label: "Para mi concubino o pareja acreditada" },
	{ value: "minor_child", label: "Para un hijo menor de 18" },
	{
		value: "adult_child_with_registered_disability",
		label: "Para un hijo adulto con discapacidad registrada",
	},
	{
		value: "adult_child_without_registered_disability",
		label: "Para un hijo adulto sin discapacidad registrada",
	},
	{ value: "other", label: "Para otra persona" },
	{ value: "unknown", label: "No estoy seguro" },
] as const;
const FOURTH_ACTIVITY_OPTIONS = [
	{ value: "ordinary", label: "Sí, fue un servicio ordinario" },
	{ value: "special", label: "Fue director, síndico o una actividad similar" },
	{ value: "unknown", label: "No estoy seguro" },
] as const;
const RENT_ATTRIBUTION_OPTIONS = [
	{ value: "taxpayer", label: "Sí, me corresponde a mí" },
	{ value: "spouse_or_partner", label: "Podría corresponder a mi cónyuge o pareja" },
	{ value: "unknown", label: "No estoy seguro" },
] as const;

export function TaxDeductionForm({
	userId,
	collection,
	selectedRecord,
	defaultCategory,
	sourceDocumentId,
	prefillGrossAmountPen,
	onSelectRecord,
	onCreateNew,
}: {
	userId: string;
	collection: TaxDeductionCollection;
	selectedRecord: TaxDeductionRecord | null;
	defaultCategory: TaxDeductionCategory;
	sourceDocumentId: string | null;
	prefillGrossAmountPen: string | null;
	onSelectRecord: (record: TaxDeductionRecord) => void;
	onCreateNew: () => void;
}) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const reducedMotion = useReducedMotion();
	const [stepIndex, setStepIndex] = useState(0);
	const today = useRef(todayDateOnlyInLima()).current;
	const hasStoredIdentity = Boolean(collection.identityMasked);
	const methods = useForm<TaxDeductionFormInput, unknown, TaxDeductionFormValues>({
		resolver: zodResolver(createTaxDeductionFormSchema()),
		defaultValues: deductionFormDefaults({
			category: selectedRecord?.category ?? defaultCategory,
			hasStoredIdentity,
			sourceDocumentId,
			prefillGrossAmountPen,
			record: selectedRecord ?? undefined,
		}),
		shouldFocusError: true,
	});
	const category = useWatch({ control: methods.control, name: "category" }) ?? defaultCategory;
	const steps = useMemo(
		() => deductionFormSteps(category, { hasStoredIdentity }),
		[category, hasStoredIdentity],
	);
	const activeStep = steps[Math.min(stepIndex, steps.length - 1)] ?? steps[0];
	const submissionGate = useRef(createTaxDeductionSubmissionGate());
	const mutation = useSaveTaxDeduction(userId);

	useEffect(() => {
		methods.reset(
			deductionFormDefaults({
				category: selectedRecord?.category ?? defaultCategory,
				hasStoredIdentity,
				sourceDocumentId,
				prefillGrossAmountPen,
				record: selectedRecord ?? undefined,
			}),
		);
		setStepIndex(0);
		mutation.reset();
	}, [
		defaultCategory,
		hasStoredIdentity,
		methods,
		mutation.reset,
		prefillGrossAmountPen,
		selectedRecord,
		sourceDocumentId,
	]);

	const submit = (values: TaxDeductionFormValues) => {
		if (!submissionGate.current.tryBegin()) return;
		const input = taxDeductionSubmissionFromValues(values, randomUUID(), selectedRecord?.id);
		mutation.mutate(input);
		router.back();
	};

	const continueFlow = async () => {
		if (!activeStep) return;
		if (stepIndex < steps.length - 1) {
			const valid = await methods.trigger(activeStep.id as FieldPath<TaxDeductionFormInput>, {
				shouldFocus: true,
			});
			if (!valid) return;
			setStepIndex((current) => Math.min(current + 1, steps.length - 1));
			return;
		}
		await methods.handleSubmit(submit)();
	};

	return (
		<FormProvider {...methods}>
			<View className="flex-1 bg-konti-bg">
				<UniKeyboardAwareScrollView
					bottomOffset={112}
					contentContainerClassName="gap-7 px-5 pb-8 pt-5"
					contentInsetAdjustmentBehavior="automatic"
					keyboardDismissMode="interactive"
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<TaxDeductionSummary
						collection={collection}
						onCreateNew={onCreateNew}
						onSelectRecord={onSelectRecord}
						selectedRecordId={selectedRecord?.id ?? null}
					/>
					<TaxDeductionCandidateCard
						sourceDocumentId={selectedRecord?.sourceDocumentId ?? sourceDocumentId}
					/>

					<View className="border-t border-konti-ivory/10 pt-7">
						<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
							{selectedRecord ? "REVISAR GASTO" : "NUEVO GASTO"} · PASO {stepIndex + 1} DE{" "}
							{steps.length}
						</Text>
						{activeStep ? (
							<Animated.View
								entering={reducedMotion ? REDUCED_STEP_ENTER : STEP_ENTER}
								key={activeStep.id}
							>
								<View className="mt-4 gap-5">
									<View className="gap-2">
										<Text className="text-[25px] font-light leading-8 text-konti-ivory">
											{activeStep.title}
										</Text>
										<Text className="text-[13px] leading-5 text-konti-ivory/45">
											{activeStep.body}
										</Text>
									</View>
									<StepField
										hasEvidence={Boolean(selectedRecord?.sourceDocumentId ?? sourceDocumentId)}
										step={activeStep.id}
										today={today}
									/>
								</View>
							</Animated.View>
						) : null}
					</View>
				</UniKeyboardAwareScrollView>

				<KeyboardStickyView offset={KEYBOARD_OFFSET}>
					<View
						className="flex-row gap-3 border-t border-konti-ivory/10 bg-konti-bg px-5 pt-3"
						style={{ paddingBottom: Math.max(insets.bottom, 16) }}
					>
						{stepIndex > 0 ? (
							<Pressable
								accessibilityRole="button"
								className="min-h-14 items-center justify-center rounded-[18px] border border-konti-ivory/15 px-5"
								onPress={() => setStepIndex((current) => Math.max(0, current - 1))}
							>
								<Text className="text-[14px] text-konti-ivory">Atrás</Text>
							</Pressable>
						) : null}
						<Pressable
							accessibilityRole="button"
							className="min-h-14 flex-1 items-center justify-center rounded-[18px] bg-konti-ivory px-6"
							onPress={() => void continueFlow()}
						>
							<Text className="text-[15px] font-semibold text-konti-bg">
								{stepIndex === steps.length - 1
									? selectedRecord
										? "Guardar revisión"
										: "Registrar gasto"
									: "Continuar"}
							</Text>
						</Pressable>
					</View>
				</KeyboardStickyView>
			</View>
		</FormProvider>
	);
}

function StepField({
	step,
	hasEvidence,
	today,
}: {
	step: DeductionFormStepId;
	hasEvidence: boolean;
	today: string;
}) {
	const { control } = useFormContext<TaxDeductionFormInput, unknown, TaxDeductionFormValues>();
	if (step === "category") {
		return <ChoiceField label="Categoría" name="category" options={CATEGORIES} />;
	}
	if (step === "grossAmountPen") {
		return (
			<ControlledTextField
				keyboardType="decimal-pad"
				label="Importe total pagado"
				name="grossAmountPen"
				placeholder="0.00"
				prefix="S/"
			/>
		);
	}
	if (step === "paidAt") {
		return <TaxDeductionPaidAtField control={control} today={today} />;
	}
	if (step === "verificationBasis") {
		return (
			<ChoiceField
				label="Respaldo"
				name="verificationBasis"
				options={
					hasEvidence
						? VERIFICATION_OPTIONS
						: VERIFICATION_OPTIONS.filter((option) => option.value !== "evidence_attached")
				}
			/>
		);
	}
	if (step === "consumerDni") {
		return (
			<ControlledTextField
				keyboardType="number-pad"
				label="DNI"
				maxLength={8}
				name="consumerDni"
				placeholder="8 dígitos"
			/>
		);
	}
	if (step === "medicalBeneficiary") {
		return (
			<ChoiceField label="Beneficiario" name="medicalBeneficiary" options={MEDICAL_BENEFICIARIES} />
		);
	}
	if (step === "insuranceReimbursementAmountPen") {
		return (
			<ControlledTextField
				keyboardType="decimal-pad"
				label="Reembolso del seguro"
				name="insuranceReimbursementAmountPen"
				placeholder="Déjalo vacío si aún no sabes"
				prefix="S/"
			/>
		);
	}
	if (step === "fourthActivityType") {
		return (
			<ChoiceField
				label="Tipo de servicio"
				name="fourthActivityType"
				options={FOURTH_ACTIVITY_OPTIONS}
			/>
		);
	}
	if (step === "rentAttribution") {
		return (
			<ChoiceField label="Atribución" name="rentAttribution" options={RENT_ATTRIBUTION_OPTIONS} />
		);
	}
	if (step === "bankingEvidenceWhenRequired") {
		return <ChoiceField label="Respuesta" name={step} options={BANKING_OPTIONS} />;
	}
	return <ChoiceField label="Respuesta" name={step} options={TRI_STATE_OPTIONS} />;
}

type ChoiceFieldName =
	| "category"
	| "verificationBasis"
	| "medicalBeneficiary"
	| "fourthActivityType"
	| "rentAttribution"
	| "acceptedDocument"
	| "consumerIdentity"
	| "paymentRecorded"
	| "economicActivityCompatible"
	| "issuerStatus"
	| "issuedIn2026"
	| "bankingEvidenceWhenRequired"
	| "fourthCategoryReceipt"
	| "professionRegistered"
	| "beneficiaryIdentity"
	| "issuerEligible"
	| "propertyInPeru"
	| "propertyNotExclusivelyBusinessUse"
	| "workerRegistration"
	| "form1676Evidence";

function ChoiceField<Name extends ChoiceFieldName>({
	name,
	label,
	options,
}: {
	name: Name;
	label: string;
	options: readonly Readonly<{ value: TaxDeductionFormInput[Name]; label: string }>[];
}) {
	const { clearErrors, control } = useFormContext<TaxDeductionFormInput>();
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<View accessibilityRole="radiogroup" className="gap-2">
					<Text className="text-[13px] font-medium text-konti-ivory/60">{label}</Text>
					{options.map((option) => {
						const selected = field.value === option.value;
						return (
							<Pressable
								accessibilityRole="radio"
								accessibilityState={{ checked: selected }}
								className={`min-h-14 justify-center rounded-2xl border px-4 py-3 ${selected ? "border-konti-primary bg-konti-primary/10" : "border-konti-ivory/10 bg-konti-surface"}`}
								key={String(option.value)}
								onPress={() => {
									clearErrors(name);
									field.onChange(option.value);
									void triggerHaptic("selection");
								}}
							>
								<Text className="text-[14px] font-medium leading-5 text-konti-ivory">
									{option.label}
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

type TextFieldName = "grossAmountPen" | "consumerDni" | "insuranceReimbursementAmountPen";

function ControlledTextField({
	name,
	label,
	placeholder,
	prefix,
	maxLength,
	keyboardType = "default",
}: {
	name: TextFieldName;
	label: string;
	placeholder: string;
	prefix?: string;
	maxLength?: number;
	keyboardType?: "default" | "decimal-pad" | "number-pad";
}) {
	const { control } = useFormContext<TaxDeductionFormInput>();
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<View className="gap-2">
					<Text className="text-[13px] font-medium text-konti-ivory/60">{label}</Text>
					<View className="min-h-14 flex-row items-center rounded-2xl border border-konti-ivory/10 bg-konti-surface px-4">
						{prefix ? <Text className="mr-2 text-base text-konti-ivory/40">{prefix}</Text> : null}
						<TextInput
							ref={field.ref}
							autoCapitalize="none"
							className="flex-1 text-base text-konti-ivory"
							keyboardType={keyboardType}
							maxLength={maxLength}
							onBlur={field.onBlur}
							onChangeText={field.onChange}
							placeholder={placeholder}
							placeholderTextColor="rgba(237,233,226,0.28)"
							selectionColor="#E2A654"
							value={field.value}
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
