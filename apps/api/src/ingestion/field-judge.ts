import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as v from "valibot";
import type { Env } from "../config/env.js";
import { type ChoiceQuestion, type FieldAnswers, scanMarkdown } from "./field-pick.js";
import { type ExtractedDocument, emptyExtraction } from "./ingestion.types.js";
import { postJson } from "./post-json.js";

const AnswerSchema = v.object({
	choice: v.optional(v.string()),
	confidence: v.optional(v.number()),
});

const SystemOneSchema = v.object({
	answers: v.optional(v.record(v.string(), AnswerSchema)),
});

@Injectable()
export class FieldJudge {
	private readonly logger = new Logger(FieldJudge.name);
	private readonly apiKey: string;
	private readonly timeoutMs: number;

	constructor(config: ConfigService<Env, true>) {
		this.apiKey = config.getOrThrow("TYPESAFE_API_KEY");
		this.timeoutMs = config.get("OCR_TIMEOUT_MS");
	}

	async pick(markdown: string): Promise<{ extracted: ExtractedDocument; confident: boolean }> {
		const scanned = scanMarkdown(markdown);
		if (!scanned.questions) return { extracted: emptyExtraction(), confident: false };

		const answers = await this.ask(markdown, scanned.questions);
		return scanned.pick(answers);
	}

	private async ask(
		markdown: string,
		questions: Record<string, ChoiceQuestion>,
	): Promise<FieldAnswers> {
		const data = await postJson(
			this.logger,
			"TypeSafe",
			"https://api.typesafe.ai/v1/systemone",
			this.apiKey,
			{ state: { markdown }, model: "jev-1.13.0", questions },
			this.timeoutMs,
		);
		const parsed = v.safeParse(SystemOneSchema, data);
		if (!parsed.success) throw new Error("TypeSafe response invalid");

		const answers: FieldAnswers = {};
		for (const id of Object.keys(questions) as (keyof FieldAnswers)[]) {
			const answer = parsed.output.answers?.[id];
			if (!answer?.choice || typeof answer.confidence !== "number") continue;
			answers[id] = { choice: answer.choice, confidence: answer.confidence };
		}
		return answers;
	}
}
