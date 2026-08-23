import type { Database } from "../../database/database.types";
import { AttentionRepository } from "./attention.repository";

describe("AttentionRepository", () => {
	it("reads rows and summary in one repeatable read-only transaction", async () => {
		const limit = jest.fn(async () => []);
		const orderBy = jest.fn(() => ({ limit }));
		const where = jest.fn(() => ({ orderBy }));
		const innerJoin = jest.fn(() => ({ where }));
		const from = jest.fn(() => ({ innerJoin }));
		const summaryWhere = jest.fn(async () => [{ totalCount: 0 }]);
		const summaryInnerJoin = jest.fn(() => ({ where: summaryWhere }));
		const summaryFrom = jest.fn(() => ({ innerJoin: summaryInnerJoin }));
		const executor = {
			select: jest.fn().mockReturnValueOnce({ from }).mockReturnValueOnce({ from: summaryFrom }),
		};
		const transaction = jest.fn(async (callback: (tx: unknown) => unknown) => callback(executor));
		const db = { transaction } as unknown as Database;
		const repository = new AttentionRepository(db);

		await expect(repository.readOpenOwned("user-1", 2026, 20)).resolves.toEqual({
			rows: [],
			totalCount: 0,
		});

		expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
			accessMode: "read only",
			isolationLevel: "repeatable read",
		});
		expect(innerJoin).toHaveBeenCalledTimes(1);
		expect(where).toHaveBeenCalledTimes(1);
		expect(orderBy).toHaveBeenCalledTimes(1);
		expect(limit).toHaveBeenCalledWith(20);
		expect(summaryWhere).toHaveBeenCalledTimes(1);
	});
});
