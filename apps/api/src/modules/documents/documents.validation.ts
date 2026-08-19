import { z } from "zod";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export const createUploadSchema = z.object({
	source: z.enum(["camera", "gallery"]),
	originalFileName: z.string().min(1).max(255),
	mimeType: z.enum(["image/jpeg", "image/png"]),
	sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
	sha256: z.string().regex(/^[a-f0-9]{64}$/),
	pageCount: z.literal(1),
	idempotencyKey: z.string().uuid(),
});

export type CreateUploadInput = z.infer<typeof createUploadSchema>;
