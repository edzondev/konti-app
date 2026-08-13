import { Test, type TestingModule } from "@nestjs/testing";
import { AUTH } from "./auth.constants";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
	let controller: AuthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AUTH,
					useValue: {
						api: {
							getSession: jest.fn(),
						},
					},
				},
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
