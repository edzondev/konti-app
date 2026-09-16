import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.js";

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private readonly client: S3Client;
	private readonly bucket: string;
	private readonly downloadTtlSeconds: number;

	constructor(config: ConfigService<Env, true>) {
		const accountId = config.getOrThrow("R2_ACCOUNT_ID");
		const accessKeyId = config.getOrThrow("R2_ACCESS_KEY_ID");
		const secretAccessKey = config.getOrThrow("R2_SECRET_ACCESS_KEY");

		this.bucket = config.getOrThrow("R2_BUCKET_NAME");
		const ttl = Number(config.get("R2_DOWNLOAD_TTL_SECONDS", { infer: true }) ?? 300);
		if (!Number.isFinite(ttl) || ttl < 1) {
			throw new Error(`R2_DOWNLOAD_TTL_SECONDS inválido: ${String(ttl)}`);
		}
		this.downloadTtlSeconds = ttl;

		this.client = new S3Client({
			region: "auto",
			endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
			credentials: { accessKeyId, secretAccessKey },
			requestChecksumCalculation: "WHEN_REQUIRED",
			responseChecksumValidation: "WHEN_REQUIRED",
		});
	}

	async upload(objectKey: string, body: Buffer, mimeType: string): Promise<void> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: objectKey,
				Body: body,
				ContentType: mimeType,
			}),
		);
		this.logger.log(`uploaded ${objectKey}`);
	}

	async delete(objectKey: string): Promise<void> {
		await this.client.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: objectKey,
			}),
		);
		this.logger.log(`deleted ${objectKey}`);
	}

	async downloadUrl(objectKey: string): Promise<string> {
		return getSignedUrl(
			this.client,
			new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
			{ expiresIn: this.downloadTtlSeconds },
		);
	}

	async downloadUrlWithExpiry(objectKey: string): Promise<{ url: string; expiresAt: string }> {
		const url = await this.downloadUrl(objectKey);
		return {
			url,
			expiresAt: new Date(Date.now() + this.downloadTtlSeconds * 1000).toISOString(),
		};
	}

	/** TTL usado por las URLs firmadas de descarga (segundos). */
	get signedUrlTtlSeconds(): number {
		return this.downloadTtlSeconds;
	}
}
