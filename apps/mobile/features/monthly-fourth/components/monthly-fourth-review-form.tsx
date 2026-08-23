import { zodResolver } from "@hookform/resolvers/zod";
import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { ControlledDateOnlyField } from "@/shared/ui/date-only-field";
import {
	type MonthlyFourthReviewValues,
	monthlyFourthReviewSchema,
} from "../monthly-fourth.validation";
import { monthlyReviewStepsFor } from "../monthly-fourth-copy";
import {
	MONTHLY_FOURTH_MINIMUM_DATE,
	monthlyFourthDateLimits,
	reconcileRestartDate,
	restartDateLimits,
} from "../monthly-fourth-date-fields";
import {
	monthlyFourthDefaultsFromPeriod,
	monthlyFourthReviewFromValues,
} from "../monthly-fourth-form";
import { useSaveMonthlyFourthReview } from "../monthly-fourth-mutations";
import { createMonthlyFourthSubmissionGate } from "../monthly-fourth-operation-state";
import type { MonthlyFourthPeriod, MonthlyReviewStepId } from "../types";
import { MonthlyFourthSummary } from "./monthly-fourth-summary";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const STEP_ENTER = FadeInDown.withInitialValues({
	opacity: 0,
	transform: [{ translateY: 8 }],
})
	.duration(180)
	.easing(EASE_OUT)
	.reduceMotion(ReduceMotion.System);
const REDUCED_STEP_ENTER = FadeIn.duration(100).easing(EASE_OUT);
const KEYBOARD_STICKY_OFFSET = { closed: 0, opened: -8 } as const;
const UniKeyboardAwareScrollView = withUniwind(KeyboardAwareScrollView);

const COVERAGE_OPTIONS = [
	{ value: "complete", label: "Sí, ya registré todo" },
	{ value: "partial", label: "Sé que falta algo" },
	{ value: "unknown", label: "No estoy seguro" },
] as const;
const ACTIVITY_OPTIONS = [
	{ value: "ordinary", label: "Servicios independientes comunes" },
	{ value: "special", label: "Director, mandatario o función similar" },
	{ value: "unknown", label: "No estoy seguro" },
] as const;
const YES_NO_UNKNOWN_OPTIONS = [
	{ value: "yes", label: "Sí" },
	{ value: "no", label: "No" },
	{ value: "unknown", label: "No estoy seguro" },
] as const;
const RESTART_OPTIONS = [
	{ value: "not_required", label: "No cambiaron" },
	{ value: "required", label: "Sí, tuve que reiniciar" },
	{ value: "unknown", label: "No estoy seguro" },
] as const;

export function MonthlyFourthReviewForm({
	userId,
	period,
}: {
	userId: string;
	period: MonthlyFourthPeriod;
}) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const reducedMotion = useReducedMotion();
	const [stepIndex, setStepIndex] = useState(0);
	const [dateLimits] = useState(() => monthlyFourthDateLimits());
	const [reviewSteps] = useState(() =>
		monthlyReviewStepsFor(period.activityClassification ?? "unknown"),
	);
	const methods = useForm<MonthlyFourthReviewValues>({
		resolver: zodResolver(monthlyFourthReviewSchema),
		defaultValues: monthlyFourthDefaultsFromPeriod(period),
		shouldFocusError: true,
	});
	const mutation = useSaveMonthlyFourthReview(userId);
	const submissionGate = useRef(createMonthlyFourthSubmissionGate());
	const idempotencyKey = useRef(randomUUID());
	const activeStep = reviewSteps[stepIndex] ?? reviewSteps[0];
	const values = useWatch({ control: methods.control });
	const suspensionAnswer = values.suspensionAnswer;
	const restartAnswer = values.restartAnswer;
	const filingAnswer = values.filingAnswer;
	const paymentAnswer = values.paymentAnswer;
	const authorizationDate = values.suspensionAuthorizationDate ?? "";
	const restartDate = values.restartDate ?? "";
	const restartLimits = restartDateLimits(authorizationDate, dateLimits.suspensionMaximumDate);

	useEffect(() => {
		const reconciled = reconcileRestartDate(
			restartDate,
			restartLimits.effectiveMinimumDate,
			restartLimits.maximumDate,
		);
		if (reconciled === restartDate) return;
		methods.setValue("restartDate", reconciled, {
			shouldDirty: true,
			shouldValidate: true,
		});
	}, [methods, restartDate, restartLimits.effectiveMinimumDate, restartLimits.maximumDate]);

	const submitStep = async () => {
		if (!submissionGate.current.tryBegin()) return;
		const isLastStep = stepIndex === reviewSteps.length - 1;
		const fields = isLastStep ? undefined : fieldsForStep(activeStep.id, methods.getValues());
		const valid = await methods.trigger(fields, { shouldFocus: true });
		if (!valid) {
			submissionGate.current.settle();
			return;
		}
		if (!isLastStep) {
			setStepIndex((current) => Math.min(current + 1, reviewSteps.length - 1));
			submissionGate.current.settle();
			return;
		}
		mutation.mutate(
			monthlyFourthReviewFromValues(methods.getValues(), period.period, idempotencyKey.current),
		);
		router.back();
	};

	return (
		<FormProvider {...methods}>
			<View className="flex-1 bg-konti-bg">
				<UniKeyboardAwareScrollView
					bottomOffset={104}
					contentContainerClassName="gap-7 px-5 pb-8 pt-5"
					contentInsetAdjustmentBehavior="automatic"
					keyboardDismissMode="interactive"
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<MonthlyFourthSummary period={period} />

					<View className="border-t border-konti-ivory/10 pt-7">
						<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
							PASO {stepIndex + 1} DE {reviewSteps.length}
						</Text>
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
								<StepFields
									filingAnswer={filingAnswer}
									dateLimits={dateLimits}
									paymentAnswer={paymentAnswer}
									restartLimits={restartLimits}
									restartAnswer={restartAnswer}
									step={activeStep.id}
									suspensionAnswer={suspensionAnswer}
								/>
							</View>
						</Animated.View>
					</View>
				</UniKeyboardAwareScrollView>

				<KeyboardStickyView offset={KEYBOARD_STICKY_OFFSET}>
					<View
						className="flex-row gap-3 border-t border-konti-ivory/10 bg-konti-bg px-5 pt-3"
						style={{ paddingBottom: Math.max(insets.bottom, 16) }}
					>
						{stepIndex > 0 ? (
							<Pressable
								accessibilityRole="button"
								className="min-h-14 items-center justify-center rounded-[18px] border border-konti-ivory/15 px-5"
								onPress={() => {
									setStepIndex((current) => Math.max(0, current - 1));
								}}
							>
								<Text className="text-[14px] text-konti-ivory">Atrás</Text>
							</Pressable>
						) : null}
						<Pressable
							accessibilityRole="button"
							className="min-h-14 flex-1 items-center justify-center rounded-[18px] bg-konti-ivory px-6"
							onPress={() => void submitStep()}
						>
							<Text className="text-[15px] font-semibold text-konti-bg">
								{stepIndex === reviewSteps.length - 1 ? "Guardar revisión" : "Continuar"}
							</Text>
						</Pressable>
					</View>
				</KeyboardStickyView>
			</View>
		</FormProvider>
	);
}

function fieldsForStep(
	step: MonthlyReviewStepId,
	values: MonthlyFourthReviewValues,
): FieldPath<MonthlyFourthReviewValues>[] {
	if (step === "coverage") return ["coverage"];
	if (step === "activity") return ["activityClassification"];
	if (step === "suspension") {
		const fields: FieldPath<MonthlyFourthReviewValues>[] = ["suspensionAnswer"];
		if (values.suspensionAnswer === "yes") {
			fields.push("suspensionAuthorizationDate", "restartAnswer");
			if (values.restartAnswer === "required") fields.push("restartDate");
		}
		return fields;
	}
	if (step === "filing") {
		return values.filingAnswer === "yes"
			? ["filingAnswer", "filingDate", "filingConfirmationNumber"]
			: ["filingAnswer"];
	}
	return values.paymentAnswer === "yes"
		? ["paymentAnswer", "paymentAmount", "paymentDate", "paymentConfirmationCode"]
		: ["paymentAnswer"];
}

function StepFields({
	step,
	dateLimits,
	suspensionAnswer,
	restartAnswer,
	restartLimits,
	filingAnswer,
	paymentAnswer,
}: {
	step: MonthlyReviewStepId;
	dateLimits: ReturnType<typeof monthlyFourthDateLimits>;
	suspensionAnswer: MonthlyFourthReviewValues["suspensionAnswer"] | undefined;
	restartAnswer: MonthlyFourthReviewValues["restartAnswer"] | undefined;
	restartLimits: ReturnType<typeof restartDateLimits>;
	filingAnswer: MonthlyFourthReviewValues["filingAnswer"] | undefined;
	paymentAnswer: MonthlyFourthReviewValues["paymentAnswer"] | undefined;
}) {
	const { control } = useFormContext<MonthlyFourthReviewValues>();
	if (step === "coverage") {
		return <ChoiceField label="Cobertura del mes" name="coverage" options={COVERAGE_OPTIONS} />;
	}
	if (step === "activity") {
		return (
			<View className="gap-3">
				<ChoiceField
					label="Tipo de actividad"
					name="activityClassification"
					options={ACTIVITY_OPTIONS}
				/>
				<Text className="text-[12px] leading-5 text-konti-ivory/35">
					Una función especial incluye, por ejemplo, ser director de empresa, mandatario o
					desempeñar una función similar. Si no lo tienes claro, deja “No estoy seguro”: Konti no
					elegirá un límite por ti.
				</Text>
			</View>
		);
	}
	if (step === "suspension") {
		return (
			<View className="gap-5">
				<ChoiceField label="Suspensión" name="suspensionAnswer" options={YES_NO_UNKNOWN_OPTIONS} />
				{suspensionAnswer === "yes" ? (
					<>
						<ControlledDateOnlyField
							control={control}
							emptyViewportDate={dateLimits.today}
							label="Fecha de emisión de la autorización"
							maximumDate={dateLimits.suspensionMaximumDate}
							minimumDate={MONTHLY_FOURTH_MINIMUM_DATE}
							name="suspensionAuthorizationDate"
							placeholder="Selecciona la fecha de autorización"
						/>
						<ChoiceField
							label="¿Tus condiciones cambiaron y tuviste que reiniciar?"
							name="restartAnswer"
							options={RESTART_OPTIONS}
						/>
						{restartAnswer === "required" ? (
							<ControlledDateOnlyField
								control={control}
								disabled={!restartLimits.hasSelectableDate}
								emptyViewportDate={dateLimits.today}
								helpText={
									restartLimits.hasSelectableDate
										? undefined
										: "Todavía no hay una fecha posterior disponible para registrar el reinicio."
								}
								label="Fecha de reinicio"
								maximumDate={restartLimits.maximumDate}
								minimumDate={restartLimits.minimumDate}
								name="restartDate"
								placeholder="Selecciona la fecha de reinicio"
							/>
						) : null}
						<Text className="text-[12px] leading-5 text-konti-ivory/35">
							Konti usará la vigencia que devuelva el servidor: desde el día siguiente a la emisión
							hasta el 31 de diciembre, salvo reinicio.
						</Text>
					</>
				) : null}
			</View>
		);
	}
	if (step === "filing") {
		return (
			<View className="gap-5">
				<ChoiceField label="Declaración" name="filingAnswer" options={YES_NO_UNKNOWN_OPTIONS} />
				{filingAnswer === "yes" ? (
					<>
						<ControlledDateOnlyField
							control={control}
							emptyViewportDate={dateLimits.today}
							label="Fecha de presentación"
							maximumDate={dateLimits.occurredFactMaximumDate}
							minimumDate={MONTHLY_FOURTH_MINIMUM_DATE}
							name="filingDate"
							placeholder="Selecciona la fecha de presentación"
						/>
						<ControlledTextField
							label="Número de constancia (opcional)"
							name="filingConfirmationNumber"
							placeholder="Número de constancia"
						/>
					</>
				) : null}
			</View>
		);
	}
	return (
		<View className="gap-5">
			<ChoiceField label="Pago" name="paymentAnswer" options={YES_NO_UNKNOWN_OPTIONS} />
			{paymentAnswer === "yes" ? (
				<>
					<ControlledTextField
						keyboardType="decimal-pad"
						label="Monto pagado"
						name="paymentAmount"
						placeholder="0.00"
						prefix="S/"
					/>
					<ControlledDateOnlyField
						control={control}
						emptyViewportDate={dateLimits.today}
						label="Fecha de pago"
						maximumDate={dateLimits.occurredFactMaximumDate}
						minimumDate={MONTHLY_FOURTH_MINIMUM_DATE}
						name="paymentDate"
						placeholder="Selecciona la fecha de pago"
					/>
					<ControlledTextField
						label="Código o constancia (opcional)"
						name="paymentConfirmationCode"
						placeholder="Código del pago"
					/>
				</>
			) : null}
		</View>
	);
}

type ChoiceFieldName =
	| "coverage"
	| "activityClassification"
	| "suspensionAnswer"
	| "restartAnswer"
	| "filingAnswer"
	| "paymentAnswer";

function ChoiceField<Name extends ChoiceFieldName>({
	name,
	label,
	options,
}: {
	name: Name;
	label: string;
	options: readonly { value: MonthlyFourthReviewValues[Name]; label: string }[];
}) {
	const { clearErrors, control } = useFormContext<MonthlyFourthReviewValues>();
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
								<Text className="text-[14px] font-medium text-konti-ivory">{option.label}</Text>
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

type TextFieldName = "filingConfirmationNumber" | "paymentAmount" | "paymentConfirmationCode";

function ControlledTextField({
	name,
	label,
	placeholder,
	prefix,
	keyboardType = "default",
}: {
	name: TextFieldName;
	label: string;
	placeholder: string;
	prefix?: string;
	keyboardType?: "default" | "decimal-pad";
}) {
	const { control } = useFormContext<MonthlyFourthReviewValues>();
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
