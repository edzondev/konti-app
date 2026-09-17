const path = require("node:path");

module.exports = {
	resolve: {
		alias: {
			"@": path.resolve("."),
		},
	},
	test: {
		environment: "node",
		include: ["__tests__/**/*.test.ts"],
		setupFiles: ["./vitest.setup.ts"],
	},
};
