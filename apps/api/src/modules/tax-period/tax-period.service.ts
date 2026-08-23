import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import type { DatabaseExecutor } from "../../database/database.types";
import { MonthlyFourthRules } from "../monthly-fourth/monthly-fourth.rules";
import type {
	MonthlyFourthInput,
	MonthlyFourthResult,
	MonthlyFourthSuspension,
	RecordedMonthlyFact,
	SuspensionRestart,
} from "../monthly-fourth/monthly-fourth.types";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { TaxStatusService } from "../tax-status/tax-status.service";
import {
	type MonthlyFourthPeriod,
	type MonthlyPeriodData,
	type StoredTaxFiling,
	type StoredTaxPayment,
	type StoredTaxPeriodReview,
	type StoredTaxSuspension,
	TAX_PERIOD_REPOSITORY,
	type TaxPeriodRepositoryPort,
} from "./tax-period.types";
import {
	type CreateTaxFilingInput,
	type CreateTaxPaymentInput,
	type CreateTaxSuspensionInput,
	type ReviewTaxPeriodCommandInput,
	taxPeriodParamSchema,
	type UpdateTaxPeriodInput,
} from "./tax-period.validation";

type MonthlyTrigger =
	| "tax_period_reviewed"
	| "tax_suspension_recorded"
	| "tax_filing_recorded"
	| "tax_payment_recorded";

function nextCalendarDay(value: string): string {
	const parsed = new Date(`${value}T00:00:00.000Z`);
	parsed.setUTCDate(parsed.getUTCDate() + 1);
	return parsed.toISOString().slice(0, 10);
}

@Injectable()
export class TaxPeriodService {
	private readonly rules = new MonthlyFourthRules();

	constructor(
		@Inject(TAX_PERIOD_REPOSITORY)
		private readonly repository: TaxPeriodRepositoryPort,
		private readonly database: DatabaseService,
		private readonly taxProfile: TaxProfileService,
		private readonly taxStatus: TaxStatusService,
	) {}

	async getPeriod(userId: string, period: string): Promise<MonthlyFourthPeriod> {
		this.assertPeriod(period);
		const profile = await this.getProfile(userId);
		return this.calculatePeriod(undefined, profile.id, period);
	}

	async updatePeriod(
		userId: string,
		period: string,
		input: UpdateTaxPeriodInput,
	): Promise<MonthlyFourthPeriod> {
		this.assertPeriod(period);
		const profile = await this.getProfile(userId);
		return this.database.db.transaction(async (executor) => {
			await this.repository.lockTaxProfile(executor, profile.id);
			const replay = await this.repository.findPeriodReviewByIdempotencyKey(
				executor,
				profile.id,
				input.idempotencyKey,
			);
			if (replay) {
				this.assertReviewReplay(replay, period, input);
				return this.calculatePeriod(executor, profile.id, period);
			}

			const current = await this.repository.loadPeriodData(executor, profile.id, period);
			const review = await this.repository.replacePeriodReview(executor, {
				taxProfileId: profile.id,
				period,
				coverage: input.coverage ?? current.review?.coverage ?? "unknown",
				activityClassification:
					input.activityClassification ?? current.review?.activityClassification ?? "unknown",
				idempotencyKey: input.idempotencyKey,
			});
			return (
				await this.evaluateAndPersist(executor, profile, period, "tax_period_reviewed", {
					...current,
					review,
				})
			).period;
		});
	}

	async reviewPeriod(userId: string, period: string, input: ReviewTaxPeriodCommandInput) {
		this.assertPeriod(period);
		const profile = await this.getProfile(userId);
		const outcome = await this.database.db.transaction(async (executor) => {
			await this.repository.lockTaxProfile(executor, profile.id);
			const existing = await this.repository.findPeriodReviewByIdempotencyKey(
				executor,
				profile.id,
				input.idempotencyKey,
			);
			if (existing) {
				const current = await this.repository.loadPeriodData(executor, profile.id, period);
				this.assertAtomicReviewReplay(current, period, input);
				return {
					kind: "replay" as const,
					period: await this.calculatePeriod(executor, profile.id, period, current),
				};
			}

			const current = await this.repository.loadPeriodData(executor, profile.id, period);
			await this.assertReviewEvidenceOwned(executor, profile.id, input);
			const review = await this.repository.replacePeriodReview(executor, {
				taxProfileId: profile.id,
				period,
				coverage: input.coverage,
				activityClassification: input.activityClassification,
				idempotencyKey: input.idempotencyKey,
			});
			const suspension = input.suspension
				? await this.repository.replaceSuspension(executor, {
						taxProfileId: profile.id,
						input: this.atomicSuspensionInput(period, input),
						effectiveFrom:
							input.suspension.answer === "yes"
								? nextCalendarDay(input.suspension.authorizationDate)
								: null,
						validThrough: input.suspension.answer === "yes" ? "2026-12-31" : null,
						source: input.suspension.sourceDocumentId === null ? "manual" : "document",
					})
				: current.suspension;
			const filing = await this.repository.replaceFiling(executor, {
				taxProfileId: profile.id,
				input: this.atomicFilingInput(period, input),
				source: input.filing.sourceDocumentId === null ? "manual" : "document",
			});
			const payment = await this.repository.replacePayment(executor, {
				taxProfileId: profile.id,
				input: this.atomicPaymentInput(period, input),
				source: input.payment.sourceDocumentId === null ? "manual" : "document",
			});
			const result = await this.evaluateAndPersist(
				executor,
				profile,
				period,
				"tax_period_reviewed",
				{ ...current, review, suspension, filing, payment },
			);
			return { kind: "created" as const, ...result };
		});
		if (outcome.kind === "replay") {
			return { period: outcome.period, taxStatus: await this.taxStatus.getCurrent(userId) };
		}
		return { period: outcome.period, taxStatus: outcome.taxStatus };
	}

	async recordSuspension(
		userId: string,
		input: CreateTaxSuspensionInput,
	): Promise<MonthlyFourthPeriod> {
		return this.writeFact(userId, input.period, async (executor, profile) => {
			const replay = await this.repository.findSuspensionByIdempotencyKey(
				executor,
				profile.id,
				input.idempotencyKey,
			);
			if (replay) {
				this.assertSuspensionReplay(replay, input);
				return this.calculatePeriod(executor, profile.id, input.period);
			}
			await this.assertEvidenceOwned(executor, profile.id, input.sourceDocumentId);
			await this.repository.replaceSuspension(executor, {
				taxProfileId: profile.id,
				input,
				effectiveFrom: input.answer === "yes" ? nextCalendarDay(input.authorizationDate) : null,
				validThrough: input.answer === "yes" ? "2026-12-31" : null,
				source: input.sourceDocumentId === null ? "manual" : "document",
			});
			return (
				await this.evaluateAndPersist(executor, profile, input.period, "tax_suspension_recorded")
			).period;
		});
	}

	async recordFiling(userId: string, input: CreateTaxFilingInput): Promise<MonthlyFourthPeriod> {
		return this.writeFact(userId, input.period, async (executor, profile) => {
			const replay = await this.repository.findFilingByIdempotencyKey(
				executor,
				profile.id,
				input.idempotencyKey,
			);
			if (replay) {
				this.assertFilingReplay(replay, input);
				return this.calculatePeriod(executor, profile.id, input.period);
			}
			await this.assertEvidenceOwned(executor, profile.id, input.sourceDocumentId);
			await this.repository.replaceFiling(executor, {
				taxProfileId: profile.id,
				input,
				source: input.sourceDocumentId === null ? "manual" : "document",
			});
			return (await this.evaluateAndPersist(executor, profile, input.period, "tax_filing_recorded"))
				.period;
		});
	}

	async recordPayment(userId: string, input: CreateTaxPaymentInput): Promise<MonthlyFourthPeriod> {
		return this.writeFact(userId, input.period, async (executor, profile) => {
			const replay = await this.repository.findPaymentByIdempotencyKey(
				executor,
				profile.id,
				input.idempotencyKey,
			);
			if (replay) {
				this.assertPaymentReplay(replay, input);
				return this.calculatePeriod(executor, profile.id, input.period);
			}
			await this.assertEvidenceOwned(executor, profile.id, input.sourceDocumentId);
			await this.repository.replacePayment(executor, {
				taxProfileId: profile.id,
				input,
				source: input.sourceDocumentId === null ? "manual" : "document",
			});
			return (
				await this.evaluateAndPersist(executor, profile, input.period, "tax_payment_recorded")
			).period;
		});
	}

	async countOutstandingPeriods(userId: string, taxYear: 2026): Promise<number> {
		const profile = await this.getProfile(userId);
		if (taxYear !== 2026) {
			throw new BadRequestException({
				code: "PERIOD_OUTSIDE_TAX_YEAR",
				message: "El conteo mensual solo está disponible para 2026.",
			});
		}
		return this.repository.countOutstandingPeriods(undefined, profile.id, taxYear);
	}

	private async writeFact<T>(
		userId: string,
		period: string,
		work: (
			executor: DatabaseExecutor,
			profile: Awaited<ReturnType<TaxPeriodService["getProfile"]>>,
		) => Promise<T>,
	): Promise<T> {
		this.assertPeriod(period);
		const profile = await this.getProfile(userId);
		return this.database.db.transaction(async (executor) => {
			await this.repository.lockTaxProfile(executor, profile.id);
			return work(executor, profile);
		});
	}

	private async evaluateAndPersist(
		executor: DatabaseExecutor,
		profile: Awaited<ReturnType<TaxPeriodService["getProfile"]>>,
		period: string,
		triggeredBy: MonthlyTrigger,
		data?: MonthlyPeriodData,
	) {
		const { input, result, response } = await this.calculate(executor, profile.id, period, data);
		const previous = await this.repository.findLatestPeriodEvaluation(executor, profile.id, period);
		const evaluation = await this.repository.insertPeriodEvaluation(executor, {
			taxProfileId: profile.id,
			period,
			rulesetVersion: "pe-2026.2.0",
			triggeredBy,
			inputSnapshot: input,
			outputSnapshot: result,
			supersedesId: previous?.id ?? null,
		});
		const attentionOpen =
			result.status === "insufficient_data" ||
			result.status === "action_likely_required" ||
			result.status === "awaiting_user_confirmation";
		await this.repository.syncMonthlyAttention(executor, {
			taxProfileId: profile.id,
			period,
			taxEvaluationId: evaluation.id,
			status: result.status,
			reasons: result.reasons,
			open: attentionOpen,
		});
		const taxStatus = await this.taxStatus.evaluateAndPersist(executor, {
			taxProfileId: profile.id,
			taxYear: 2026,
			incomeMode: profile.incomeMode,
			triggeredBy,
		});
		return { period: response, taxStatus };
	}

	private async calculatePeriod(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		period: string,
		data?: MonthlyPeriodData,
	): Promise<MonthlyFourthPeriod> {
		return (await this.calculate(executor, taxProfileId, period, data)).response;
	}

	private async calculate(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		period: string,
		preloaded?: MonthlyPeriodData,
	): Promise<{
		data: MonthlyPeriodData;
		input: MonthlyFourthInput;
		result: MonthlyFourthResult;
		response: MonthlyFourthPeriod;
	}> {
		const data =
			preloaded ?? (await this.repository.loadPeriodData(executor, taxProfileId, period));
		const input: MonthlyFourthInput = {
			period,
			activityClassification: data.review?.activityClassification ?? "unknown",
			fourthIncomes: data.fourthIncomes,
			fifthGrossAmountPen: data.fifthGrossAmountPen,
			coverage: data.review?.coverage ?? "unknown",
			pendingDocumentCount: data.pendingDocumentCount,
			suspension: this.toRulesSuspension(data.suspension),
			filing: this.toRulesFact(data.filing),
			payment: this.toRulesFact(data.payment),
		};
		const result = this.rules.calculate(input);
		return { data, input, result, response: this.toResponse(data, result) };
	}

	private toRulesSuspension(suspension: StoredTaxSuspension | null): MonthlyFourthSuspension {
		if (!suspension || suspension.answer === "unknown") return { status: "unknown" };
		if (suspension.answer === "no") {
			return { status: "none", verificationScope: suspension.verificationScope };
		}
		if (!suspension.authorizationDate) throw new Error("Suspension authorization date is missing");
		let restart: SuspensionRestart;
		if (suspension.restartState === "required") {
			if (!suspension.restartDate) throw new Error("Suspension restart date is missing");
			restart = { status: "required", restartDate: suspension.restartDate };
		} else {
			restart = { status: suspension.restartState };
		}
		return {
			status: "authorized",
			authorizationDate: suspension.authorizationDate,
			restart,
			verificationScope: suspension.verificationScope,
		};
	}

	private toRulesFact(
		fact: StoredTaxFiling | StoredTaxPayment | null,
	): RecordedMonthlyFact | undefined {
		if (!fact) return undefined;
		if (fact.answer === "unknown") return { state: "unknown" };
		return { state: fact.answer, verificationScope: fact.verificationScope };
	}

	private toResponse(data: MonthlyPeriodData, result: MonthlyFourthResult): MonthlyFourthPeriod {
		return {
			...result,
			activityClassification: result.activityClassification,
			coverage: data.review?.coverage ?? "unknown",
			suspensionValidThrough: data.suspension?.validThrough ?? null,
			filing: data.filing
				? {
						state: data.filing.answer,
						verificationScope:
							data.filing.answer === "unknown" ? null : data.filing.verificationScope,
						recordedAt: data.filing.answer === "yes" ? data.filing.filedAt : null,
						amountPen: null,
						confirmationCode: data.filing.answer === "yes" ? data.filing.confirmationNumber : null,
					}
				: null,
			payment: data.payment
				? {
						state: data.payment.answer,
						verificationScope:
							data.payment.answer === "unknown" ? null : data.payment.verificationScope,
						recordedAt: data.payment.answer === "yes" ? data.payment.paidAt : null,
						amountPen: data.payment.answer === "yes" ? data.payment.amountPen : null,
						confirmationCode: data.payment.answer === "yes" ? data.payment.confirmationCode : null,
					}
				: null,
			suspension: data.suspension
				? {
						state: data.suspension.answer,
						verificationScope:
							data.suspension.answer === "unknown" ? null : data.suspension.verificationScope,
						authorizationDate: data.suspension.authorizationDate,
						effectiveFrom: data.suspension.effectiveFrom,
						validThrough: data.suspension.validThrough,
						restartState: data.suspension.restartState,
						restartDate: data.suspension.restartDate,
					}
				: null,
		};
	}

	private async assertEvidenceOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string | null,
	): Promise<void> {
		if (documentId === null) return;
		const document = await this.repository.getOwnedDocumentForUpdate(
			executor,
			taxProfileId,
			documentId,
		);
		if (!document) {
			throw new NotFoundException({
				code: "EVIDENCE_DOCUMENT_NOT_FOUND",
				message: "No se encontró la evidencia indicada.",
			});
		}
	}

	private async assertReviewEvidenceOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		input: ReviewTaxPeriodCommandInput,
	): Promise<void> {
		const documentIds = new Set<string>();
		if (input.suspension?.sourceDocumentId) documentIds.add(input.suspension.sourceDocumentId);
		if (input.filing.sourceDocumentId) documentIds.add(input.filing.sourceDocumentId);
		if (input.payment.sourceDocumentId) documentIds.add(input.payment.sourceDocumentId);
		for (const documentId of documentIds) {
			await this.assertEvidenceOwned(executor, taxProfileId, documentId);
		}
	}

	private atomicSuspensionInput(
		period: string,
		input: ReviewTaxPeriodCommandInput,
	): CreateTaxSuspensionInput {
		if (!input.suspension) throw new Error("Atomic suspension is missing");
		return { ...input.suspension, period, idempotencyKey: input.idempotencyKey };
	}

	private atomicFilingInput(
		period: string,
		input: ReviewTaxPeriodCommandInput,
	): CreateTaxFilingInput {
		return { ...input.filing, period, idempotencyKey: input.idempotencyKey };
	}

	private atomicPaymentInput(
		period: string,
		input: ReviewTaxPeriodCommandInput,
	): CreateTaxPaymentInput {
		return { ...input.payment, period, idempotencyKey: input.idempotencyKey };
	}

	private assertAtomicReviewReplay(
		data: MonthlyPeriodData,
		period: string,
		input: ReviewTaxPeriodCommandInput,
	): void {
		if (
			!data.review ||
			data.review.idempotencyKey !== input.idempotencyKey ||
			!data.filing ||
			data.filing.idempotencyKey !== input.idempotencyKey ||
			!data.payment ||
			data.payment.idempotencyKey !== input.idempotencyKey
		) {
			this.assertReplay(false);
		}
		this.assertReviewReplay(data.review as StoredTaxPeriodReview, period, {
			coverage: input.coverage,
			activityClassification: input.activityClassification,
			idempotencyKey: input.idempotencyKey,
		});
		if (input.suspension) {
			if (!data.suspension || data.suspension.idempotencyKey !== input.idempotencyKey) {
				this.assertReplay(false);
			}
			this.assertSuspensionReplay(
				data.suspension as StoredTaxSuspension,
				this.atomicSuspensionInput(period, input),
			);
		}
		this.assertFilingReplay(data.filing as StoredTaxFiling, this.atomicFilingInput(period, input));
		this.assertPaymentReplay(
			data.payment as StoredTaxPayment,
			this.atomicPaymentInput(period, input),
		);
	}

	private assertReviewReplay(
		stored: StoredTaxPeriodReview,
		period: string,
		input: UpdateTaxPeriodInput,
	): void {
		this.assertReplay(
			stored.period === period &&
				(input.coverage === undefined || stored.coverage === input.coverage) &&
				(input.activityClassification === undefined ||
					stored.activityClassification === input.activityClassification),
		);
	}

	private assertSuspensionReplay(
		stored: StoredTaxSuspension,
		input: CreateTaxSuspensionInput,
	): void {
		this.assertReplay(
			stored.period === input.period &&
				stored.answer === input.answer &&
				stored.authorizationDate === input.authorizationDate &&
				stored.restartState === input.restartState &&
				stored.restartDate === input.restartDate &&
				stored.verificationScope === input.verificationScope &&
				stored.sourceDocumentId === input.sourceDocumentId,
		);
	}

	private assertFilingReplay(stored: StoredTaxFiling, input: CreateTaxFilingInput): void {
		this.assertReplay(
			stored.period === input.period &&
				stored.answer === input.answer &&
				stored.filedAt === input.filedAt &&
				stored.confirmationNumber === input.confirmationNumber &&
				stored.verificationScope === input.verificationScope &&
				stored.sourceDocumentId === input.sourceDocumentId,
		);
	}

	private assertPaymentReplay(stored: StoredTaxPayment, input: CreateTaxPaymentInput): void {
		this.assertReplay(
			stored.period === input.period &&
				stored.answer === input.answer &&
				stored.amountPen === input.amountPen &&
				stored.paidAt === input.paidAt &&
				stored.confirmationCode === input.confirmationCode &&
				stored.verificationScope === input.verificationScope &&
				stored.sourceDocumentId === input.sourceDocumentId,
		);
	}

	private assertReplay(matches: boolean): void {
		if (!matches) {
			throw new ConflictException({
				code: "TAX_PERIOD_IDEMPOTENCY_CONFLICT",
				message: "La clave de idempotencia ya fue usada con otros datos.",
			});
		}
	}

	private assertPeriod(period: string): void {
		if (!taxPeriodParamSchema.safeParse(period).success) {
			throw new BadRequestException({
				code: "PERIOD_OUTSIDE_TAX_YEAR",
				message: "El periodo debe pertenecer al ejercicio 2026.",
			});
		}
	}

	private async getProfile(userId: string) {
		const current = await this.taxProfile.getCurrentUser(userId);
		if (current.requiresOnboarding || !current.profile) {
			throw new ConflictException({
				code: "TAX_PROFILE_REQUIRED",
				message: "Completa tu perfil tributario para continuar.",
			});
		}
		if (current.taxYear !== 2026 || current.profile.taxYear !== 2026) {
			throw new ConflictException({
				code: "TAX_YEAR_NOT_SUPPORTED",
				message: "Este flujo está disponible para el ejercicio 2026.",
			});
		}
		return current.profile;
	}
}
