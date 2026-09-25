export function createDevLogger(scope: string) {
	const prefix = `[konti:${scope}]`;
	const enabled = typeof __DEV__ !== "undefined" && __DEV__;

	return {
		info: (...args: unknown[]) => {
			if (enabled) console.log(prefix, ...args);
		},
		warn: (...args: unknown[]) => {
			if (enabled) console.warn(prefix, ...args);
		},
		error: (...args: unknown[]) => {
			if (enabled) console.error(prefix, ...args);
		},
	};
}
