import type { Logger } from "@nestjs/common";

export async function postJson(
	logger: Logger,
	label: string,
	url: string,
	apiKey: string,
	body: unknown,
	timeoutMs: number,
): Promise<unknown> {
	let response: Response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(timeoutMs),
		});
	} catch (error) {
		if (error instanceof Error && error.name === "TimeoutError") {
			const message = `${label} timed out after ${timeoutMs}ms`;
			logger.error(message);
			throw new Error(message);
		}
		throw error;
	}

	if (!response.ok) {
		const message = `${label} failed: ${response.status}`;
		logger.error(message);
		throw new Error(message);
	}

	return response.json();
}
