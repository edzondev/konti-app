import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "./database.service";

describe("DatabaseService", () => {
	let service: DatabaseService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DatabaseService,
				{
					provide: ConfigService,
					useValue: {
						getOrThrow: jest.fn(() => "postgresql://konti:test@localhost:5432/konti_test"),
					},
				},
			],
		}).compile();

		service = module.get<DatabaseService>(DatabaseService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
