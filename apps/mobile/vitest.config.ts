const path = require("node:path");

module.exports = {
	resolve: {
		alias: {
			"@": path.resolve("."),
		},
	},
	test: {
		environment: "node",
		include: ["core/**/*.test.ts", "features/**/*.test.ts"],
		setupFiles: ["./vitest.setup.ts"],
	},
};
