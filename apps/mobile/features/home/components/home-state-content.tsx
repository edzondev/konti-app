import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import {
	homeAllClearContent,
	homeDecisionReceipt,
	homeMockProfile,
	homeUpcomingContent,
} from "@/features/home/mock-data";
import type { HomeUiState } from "@/features/home/types";
import { ArrowDown, ArrowRight, Calendar, Check, HelpCircle, Receipt } from "@/shared/ui/reicon";

type HomeStateContentProps = {
	state: HomeUiState;
	onPressComprobantes?: () => void;
	onConfirmDecision?: () => void;
	onReviewDecision?: () => void;
};

export function HomeStateContent({
	state,
	onPressComprobantes,
	onConfirmDecision,
	onReviewDecision,
}: HomeStateContentProps) {
	switch (state) {
		case "new-user":
			return <NewUserState />;
		case "all-clear":
			return <AllClearState onPressComprobantes={onPressComprobantes} />;
		case "needs-decision":
			return <NeedsDecisionState onConfirm={onConfirmDecision} onReview={onReviewDecision} />;
		case "upcoming":
			return <UpcomingState />;
	}
}

function NewUserState() {
	return (
		<StateShell
			icon={
				<IconBubble className="bg-konti-surface">
					<Receipt size={31} colorClassName="accent-konti-muted" />
				</IconBubble>
			}
			heading={`${homeMockProfile.firstName}, completa tu perfil.`}
			explanation={`${homeMockProfile.incomeLabel} · Ejercicio ${homeMockProfile.fiscalYear} · ${homeMockProfile.profileStatus}`}
			footer={
				<Pill className="bg-konti-indigo-soft">
					<ArrowDown size={15} colorClassName="accent-konti-muted" />
					<Text className="text-xs font-semibold text-konti-indigo">
						{homeMockProfile.currency} · {homeMockProfile.maskedRuc}
					</Text>
				</Pill>
			}
		/>
	);
}

function AllClearState({ onPressComprobantes }: { onPressComprobantes?: () => void }) {
	return (
		<StateShell
			icon={
				<IconBubble className="bg-konti-green-soft">
					<Check size={31} colorClassName="accent-konti-green" />
				</IconBubble>
			}
			heading={homeAllClearContent.heading}
			explanation={homeAllClearContent.explanation}
			footer={
				<View className="items-center gap-[7px]">
					<Text className="text-center text-sm font-semibold text-konti-indigo">
						{homeAllClearContent.highlight}
					</Text>
					<Pressable
						accessibilityRole="link"
						hitSlop={8}
						onPress={onPressComprobantes}
						className="flex-row items-center gap-[5px]"
					>
						<Text className="text-xs font-semibold text-konti-indigo">
							{homeAllClearContent.linkLabel}
						</Text>
						<ArrowRight size={15} colorClassName="accent-konti-ink" />
					</Pressable>
				</View>
			}
		/>
	);
}

function NeedsDecisionState({
	onConfirm,
	onReview,
}: {
	onConfirm?: () => void;
	onReview?: () => void;
}) {
	return (
		<StateShell
			gapClassName="gap-5"
			icon={
				<IconBubble className="bg-konti-amber-soft">
					<HelpCircle size={31} colorClassName="accent-konti-amber" />
				</IconBubble>
			}
			heading={`Confirma la fecha de ${homeDecisionReceipt.merchant}.`}
			explanation="Boleta · S/180 · Necesita revisión"
			footer={
				<View className="w-full gap-2">
					<View className="h-[70px] w-full flex-row items-center justify-between rounded-konti-card bg-konti-surface px-4">
						<View className="flex-1 gap-1 pr-3">
							<Text className="text-sm font-semibold text-konti-ink">
								{homeDecisionReceipt.merchant}
							</Text>
							<Text className="text-[11px] text-konti-muted">{homeDecisionReceipt.detail}</Text>
						</View>
						<Text className="text-[15px] font-semibold text-konti-ink">
							{homeDecisionReceipt.amount}
						</Text>
					</View>

					<Pressable
						accessibilityRole="button"
						onPress={onConfirm}
						className="h-[50px] w-full items-center justify-center rounded-konti-button bg-konti-ink"
					>
						<Text className="text-sm font-semibold text-konti-surface">
							{homeDecisionReceipt.confirmLabel}
						</Text>
					</Pressable>

					<Pressable
						accessibilityRole="button"
						hitSlop={8}
						onPress={onReview}
						className="h-[42px] w-full items-center justify-center"
					>
						<Text className="text-[13px] font-medium text-konti-indigo">
							{homeDecisionReceipt.reviewLabel}
						</Text>
					</Pressable>
				</View>
			}
		/>
	);
}

function UpcomingState() {
	return (
		<StateShell
			icon={
				<IconBubble className="bg-konti-surface">
					<Calendar size={31} colorClassName="accent-konti-muted" />
				</IconBubble>
			}
			heading={homeUpcomingContent.heading}
			explanation={homeUpcomingContent.explanation}
			footer={
				<Pill className="bg-konti-surface">
					<Calendar size={17} colorClassName="accent-konti-muted" />
					<Text className="text-xs font-semibold text-konti-indigo">
						{homeUpcomingContent.suggestion}
					</Text>
				</Pill>
			}
		/>
	);
}

function StateShell({
	icon,
	heading,
	explanation,
	footer,
	gapClassName = "gap-[22px]",
}: {
	icon: ReactNode;
	heading: string;
	explanation: string;
	footer?: ReactNode;
	gapClassName?: string;
}) {
	return (
		<View className={`w-full max-w-[350px] items-center self-center px-5 ${gapClassName}`}>
			{icon}
			<View className="w-full items-center gap-[11px]">
				<Text className="text-center text-[30px] font-semibold leading-9 tracking-tight text-konti-ink">
					{heading}
				</Text>
				<Text className="text-center text-[15px] leading-[21px] text-konti-muted">
					{explanation}
				</Text>
			</View>
			{footer}
		</View>
	);
}

function IconBubble({ className, children }: { className: string; children: ReactNode }) {
	return (
		<View className={`size-[74px] items-center justify-center rounded-konti-bubble ${className}`}>
			{children}
		</View>
	);
}

function Pill({ className, children }: { className: string; children: ReactNode }) {
	return (
		<View className={`flex-row items-center gap-[7px] rounded-konti-pill px-3 py-2 ${className}`}>
			{children}
		</View>
	);
}
