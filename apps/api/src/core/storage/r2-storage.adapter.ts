import {
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDevLogger } from "../dev-logger";
import type { ObjectStorage } from "./storage.types";

const logger = createDevLogger("r2-storage");

@Injectable()
export class R2StorageAdapter implements ObjectStorage {
	private readonly bucketName: string;
	private readonly client: S3Client;

	constructor(configService: ConfigService) {
		const accountId = configService.get<string>("R2_ACCOUNT_ID");
		const accessKeyId = configService.get<string>("R2_ACCESS_KEY_ID");
		const secretAccessKey = configService.get<string>("R2_SECRET_ACCESS_KEY");
		const bucketName = configService.get<string>("R2_BUCKET_NAME");
		const signedUrlTtlSeconds = configService.get<string>("R2_SIGNED_URL_TTL_SECONDS");

		if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !signedUrlTtlSeconds) {
			throw new Error("Missing R2 configuration");
		}

		this.bucketName = bucketName;
		this.client = new S3Client({
			region: "auto",
			endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
			forcePathStyle: true,
			credentials: { accessKeyId, secretAccessKey },
			requestChecksumCalculation: "WHEN_REQUIRED",
			responseChecksumValidation: "WHEN_REQUIRED",
		});
	}

	async createUploadUrl(input: {
		objectKey: string;
		mimeType: string;
		expiresInSeconds: number;
	}): Promise<{ url: string; headers: Record<string, string>; expiresAt: string }> {
		try {
			const url = await getSignedUrl(
				this.client,
				new PutObjectCommand({
					Bucket: this.bucketName,
					Key: input.objectKey,
				}),
				{
					expiresIn: input.expiresInSeconds,
					unsignableHeaders: new Set([
						"content-type",
						"x-amz-checksum-crc32",
						"x-amz-checksum-crc32c",
						"x-amz-sdk-checksum-algorithm",
					]),
				},
			);

			const signed = new URL(url);
			logger.info("createUploadUrl", {
				host: signed.host,
				signedHeaders: signed.searchParams.get("X-Amz-SignedHeaders"),
			});

			const expiresAt = this.getExpiresAt(input.expiresInSeconds);

			return {
				url,
				headers: { "Content-Type": input.mimeType },
				expiresAt,
			};
		} catch (error) {
			logger.error("createUploadUrl:failed", {
				objectKey: input.objectKey,
				message: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async createDownloadUrl(input: {
		objectKey: string;
		expiresInSeconds: number;
	}): Promise<{ url: string; expiresAt: string }> {
		try {
			const url = await getSignedUrl(
				this.client,
				new GetObjectCommand({
					Bucket: this.bucketName,
					Key: input.objectKey,
				}),
				{ expiresIn: input.expiresInSeconds },
			);

			const expiresAt = this.getExpiresAt(input.expiresInSeconds);

			return {
				url,
				expiresAt,
			};
		} catch (error) {
			logger.error("createDownloadUrl:failed", {
				objectKey: input.objectKey,
				message: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async putObject(input: { objectKey: string; body: Buffer; mimeType: string }): Promise<void> {
		try {
			await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucketName,
					Key: input.objectKey,
					Body: input.body,
					ContentType: input.mimeType,
				}),
			);

			logger.info("putObject", { objectKey: input.objectKey });
		} catch (error) {
			logger.error("putObject:failed", {
				objectKey: input.objectKey,
				message: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async headObject(objectKey: string): Promise<{ exists: boolean; sizeBytes: number | null }> {
		try {
			const object = await this.client.send(
				new HeadObjectCommand({
					Bucket: this.bucketName,
					Key: objectKey,
				}),
			);

			return { exists: true, sizeBytes: object.ContentLength ?? null };
		} catch (error) {
			if (error instanceof Error && error.name === "NotFound") {
				return { exists: false, sizeBytes: null };
			}

			logger.error("headObject:failed", {
				objectKey,
				message: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	private getExpiresAt(expiresInSeconds: number): string {
		return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
	}
}
