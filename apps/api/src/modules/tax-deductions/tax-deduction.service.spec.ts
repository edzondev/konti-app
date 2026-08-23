import type { ConfigService } from "@nestjs/config";
import type { DatabaseService } from "../../database/database.service";
import type { DatabaseExecutor } from "../../database/database.types";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { TaxStatusService } from "../tax-status/tax-status.service";
import collectionFixture from "./fixtures/tax-deduction-collection.contract.json";
import type {
	CanonicalTaxDeductionInput,
	StoredTaxDeductionRecord,
	TaxDeductionRepositoryPort,
} from "./tax-deduction.persistence.types";
import { TaxDeductionService } from "./tax-deduction.service";
import type { CreateTaxDeductionInput } from "./tax-deduction.validation";

const tx = {} as DatabaseExecutor;
const profileId = "11111111-1111-4111-8111-111111111111";
const input: CreateTaxDeductionInput = {
	category: "restaurants_hotels",
	paidAt: "2026-08-20",
	grossAmountPen: "100.00",
	verificationBasis: "user_confirmation",
	requestedCalculationStatus: "included",
	requirements: [
		{ code: "accepted_document", status: "met" },
		{ code: "consumer_identity_correct", status: "met" },
		{ code: "payment_recorded", status: "met" },
		{ code: "compatible_economic_activity", status: "met" },
		{ code: "issuer_active_and_habido", status: "met" },
		{ code: "issued_in_tax_year", status: "met" },
		{ code: "banking_evidence_when_required", status: "not_applicable" },
	],
	medical: null,
	fourthActivityType: null,
	rentAttribution: null,
	sourceDocumentId: null,
	idempotencyKey: "22222222-2222-4222-8222-222222222222",
};

function stored(
	override: Partial<Extract<StoredTaxDeductionRecord, { category: "restaurants_hotels" }>> = {},
): Extract<StoredTaxDeductionRecord, { category: "restaurants_hotels" }> {
	return {
		id: "deduction-1",
		taxProfileId: profileId,
		sourceDocumentId: null,
		source: "manual",
		idempotencyKey: input.idempotencyKey,
		category: "restaurants_hotels",
		paidAt: input.paidAt,
		grossAmountPen: input.grossAmountPen,
		eligibleBasePen: input.grossAmountPen,
		verificationStatus: "user_confirmed",
		calculationStatus: "included",
		requirements: input.requirements,
		notes: null,
		deletedAt: null,
		createdAt: new Date("2026-08-23T12:00:00.000Z"),
		updatedAt: new Date("2026-08-23T12:00:00.000Z"),
		...override,
	};
}

function storedFromCanonical(values: CanonicalTaxDeductionInput) {
	return stored({
		paidAt: values.expenseDate,
		grossAmountPen: values.grossAmount,
		eligibleBasePen: values.grossAmount,
		verificationStatus: values.verificationStatus,
		calculationStatus: values.calculationStatus,
		requirements: values.requirements,
	});
}

function createHarness() {
	const visible: StoredTaxDeductionRecord[] = [];
	const repository = {
		lockTaxProfile: jest.fn(async () => undefined),
		findByIdempotencyKey: jest.fn(async () => undefined),
		findActiveBySourceDocument: jest.fn(async () => undefined),
		getDocumentForUpdate: jest.fn(async () => undefined),
		insert: jest.fn(async (_executor, values) => {
			const record = storedFromCanonical(values.input);
			visible.splice(0, visible.length, record);
			return record;
		}),
		getOwned: jest.fn(async () => stored()),
		listVisible: jest.fn(async () => (visible.length > 0 ? visible : [stored()])),
		updateOwned: jest.fn(async () => stored()),
		softDeleteOwned: jest.fn(async () => stored()),
		syncAttention: jest.fn(async () => undefined),
		storeDniIdentity: jest.fn(async () => undefined),
		getDniIdentityLast4: jest.fn(async () => null),
		getDocumentCandidateSource: jest.fn(async () => undefined),
	} as unknown as jest.Mocked<TaxDeductionRepositoryPort>;
	const database = {
		db: {
			transaction: jest.fn(async (callback: (executor: DatabaseExecutor) => unknown) =>
				callback(tx),
			),
		},
	} as unknown as DatabaseService;
	const taxStatus = {
		evaluateAndPersist: jest.fn(async () => ({ status: "calculated" })),
		getCurrent: jest.fn(async () => ({ status: "calculated" })),
	} as unknown as jest.Mocked<TaxStatusService>;
	const profile = {
		getCurrentUser: jest.fn(async () => ({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: {
				id: profileId,
				taxYear: 2026,
				incomeMode: "mixed" as const,
				trackDeductibles: true,
			},
		})),
	} as unknown as TaxProfileService;
	const config = {
		getOrThrow: jest.fn(() => "a-secret-key-for-tests-with-32-bytes"),
	} as unknown as ConfigService;
	return {
		service: new TaxDeductionService(repository, database, taxStatus, profile, config),
		repository,
		taxStatus,
		config: config as unknown as { getOrThrow: jest.Mock },
	};
}

describe("TaxDeductionService", () => {
	it("returns the canonical collection contract from list", async () => {
		const { service } = createHarness();

		await expect(service.list("user-1")).resolves.toEqual({
			taxYear: 2026,
			identityMasked: null,
			summary: {
				includedDeductionPen: "15.00",
				potentialDeductionPen: "0.00",
				capPen: "16500.00",
				amountDiscardedByCapPen: "0.00",
				byCategory: {
					restaurants_hotels: "15.00",
					medical_dental_services: "0.00",
					other_fourth_services: "0.00",
					rent: "0.00",
					household_worker_essalud: "0.00",
				},
			},
			records: [
				expect.objectContaining({
					id: "deduction-1",
					paidAt: "2026-08-20",
					grossAmountPen: "100.00",
					medical: null,
					fourthActivityType: null,
					rentAttribution: null,
				}),
			],
		});
	});

	it("matches the API-mobile collection fixture exactly", async () => {
		const { service, repository } = createHarness();
		repository.getDniIdentityLast4.mockResolvedValue("5678");

		await expect(service.list("user-1")).resolves.toEqual(collectionFixture);
	});

	it("persists, synchronizes attention and evaluates in the same transaction", async () => {
		const { service, repository, taxStatus } = createHarness();

		await expect(service.createManual("user-1", input)).resolves.toMatchObject({
			taxYear: 2026,
			records: [expect.objectContaining({ id: "deduction-1" })],
		});
		expect(repository.lockTaxProfile).toHaveBeenCalledWith(tx, profileId);
		expect(repository.insert).toHaveBeenCalledWith(
			tx,
			expect.objectContaining({ eligibleBase: "100.00", attentionReasons: [] }),
		);
		expect(repository.syncAttention).toHaveBeenCalledWith(tx, profileId, "deduction-1", null, []);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledWith(
			tx,
			expect.objectContaining({ triggeredBy: "tax_deduction_created", incomeMode: "mixed" }),
		);
	});

	it("derives potential status instead of trusting an included client intention", async () => {
		const { service, repository } = createHarness();
		const unresolved: CreateTaxDeductionInput = {
			...input,
			requirements: input.requirements.map((requirement) =>
				requirement.code === "issuer_active_and_habido"
					? { ...requirement, status: "unknown" as const }
					: requirement,
			),
		};

		await service.createManual("user-1", unresolved);

		expect(repository.insert).toHaveBeenCalledWith(
			tx,
			expect.objectContaining({
				input: expect.objectContaining({ calculationStatus: "potential" }),
				attentionReasons: ["requirement_unknown:issuer_active_and_habido"],
			}),
		);
	});

	it("rejects evidence_attached when no real source document exists", async () => {
		const { service } = createHarness();

		await expect(
			service.createManual("user-1", { ...input, verificationBasis: "evidence_attached" }),
		).rejects.toMatchObject({ response: { code: "TAX_DEDUCTION_EVIDENCE_REQUIRED" } });
	});

	it("stores only an HMAC blind index and masked DNI suffix", async () => {
		const { service, repository } = createHarness();

		await expect(service.storeIdentity("user-1", "12345678")).resolves.toEqual({
			configured: true,
			identityMasked: "****5678",
		});
		expect(repository.storeDniIdentity).toHaveBeenCalledWith(
			tx,
			profileId,
			expect.stringMatching(/^[a-f0-9]{64}$/),
			"5678",
		);
		expect(JSON.stringify(repository.storeDniIdentity.mock.calls)).not.toContain("12345678");
	});

	it("stores the optional DNI blind index inside the deduction transaction", async () => {
		const { service, repository, taxStatus } = createHarness();
		const command = { ...input, consumerDni: "12345678" };

		await service.createManual("user-1", command);

		expect(repository.storeDniIdentity).toHaveBeenCalledWith(
			tx,
			profileId,
			expect.stringMatching(/^[a-f0-9]{64}$/),
			"5678",
		);
		expect(JSON.stringify(repository.insert.mock.calls)).not.toContain("12345678");
		expect(repository.storeDniIdentity.mock.invocationCallOrder[0]).toBeLessThan(
			taxStatus.evaluateAndPersist.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
		);
	});

	it("returns a stable error when DNI verification is unavailable", async () => {
		const { service, config } = createHarness();
		config.getOrThrow.mockImplementation(() => {
			throw new Error("missing");
		});

		await expect(service.storeIdentity("user-1", "12345678")).rejects.toMatchObject({
			response: { code: "DNI_VERIFICATION_FAILED" },
		});
	});
});
