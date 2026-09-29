import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as v from "valibot";
import type { Env } from "../config/env.js";
import { postJson } from "./post-json.js";

const MistralOcrSchema = v.object({
	pages: v.optional(v.array(v.object({ markdown: v.optional(v.string()) }))),
});

@Injectable()
export class OcrClient {
	private readonly logger = new Logger(OcrClient.name);
	private readonly apiKey: string;
	private readonly timeoutMs: number;

	constructor(config: ConfigService<Env, true>) {
		this.apiKey = config.getOrThrow("MISTRAL_API_KEY");
		this.timeoutMs = config.get("OCR_TIMEOUT_MS");
	}

	async extract(buffer: Buffer, mimeType: string): Promise<string> {
		const data = await postJson(
			this.logger,
			"Mistral OCR",
			"https://api.mistral.ai/v1/ocr",
			this.apiKey,
			{
				model: "mistral-ocr-latest",
				document: {
					type: "image_url",
					image_url: `data:${mimeType};base64,${buffer.toString("base64")}`,
				},
			},
			this.timeoutMs,
		);
		const parsed = v.safeParse(MistralOcrSchema, data);
		if (!parsed.success) throw new Error("Mistral OCR response invalid");
		return parsed.output.pages?.map((page) => page.markdown ?? "").join("\n") ?? "";
	}
}
