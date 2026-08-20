import { Logger } from "@nestjs/common";

export function createDevLogger(scope: string) {
	const enabled = process.env.NODE_ENV !== "production";
	const nest = new Logger(`konti:${scope}`);
	return {
		info: (message: string, meta?: Record<string, unknown>) => {
			if (!enabled) return;
			nest.log(meta ? `${message} ${JSON.stringify(meta)}` : message);
		},
		warn: (message: string, meta?: Record<string, unknown>) => {
			if (!enabled) return;
			nest.warn(meta ? `${message} ${JSON.stringify(meta)}` : message);
		},
		error: (message: string, meta?: Record<string, unknown>) => {
			if (!enabled) return;
			nest.error(meta ? `${message} ${JSON.stringify(meta)}` : message);
		},
	};
}
