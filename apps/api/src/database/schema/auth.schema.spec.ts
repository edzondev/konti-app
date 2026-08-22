import { getTableConfig } from "drizzle-orm/pg-core";

import { account } from "./auth.schema";

describe("Better Auth account schema", () => {
	it("scopes provider identities by required issuer and account id", () => {
		const config = getTableConfig(account);
		const issuer = config.columns.find((column) => column.name === "issuer");
		const identityIndex = config.indexes.find(
			(index) => index.config.name === "account_issuer_accountId_uidx",
		);

		expect(issuer).toMatchObject({ notNull: true });
		expect(identityIndex?.config.unique).toBe(true);
		expect(
			identityIndex?.config.columns.map((column) => ("name" in column ? column.name : undefined)),
		).toEqual(["issuer", "account_id"]);
	});
});
