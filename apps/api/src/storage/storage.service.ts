import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.js";

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private readonly client: S3Client;
	private readonly bucket: string;

	constructor(config: ConfigService<Env, true>) {
		const accountId = config.getOrThrow("R2_ACCOUNT_ID");
		const accessKeyId = config.getOrThrow("R2_ACCESS_KEY_ID");
		const secretAccessKey = config.getOrThrow("R2_SECRET_ACCESS_KEY");

		this.bucket = config.getOrThrow("R2_BUCKET_NAME");

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

	async getObject(objectKey: string): Promise<{ body: Buffer; contentType: string | undefined }> {
		const response = await this.client.send(
			new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
		);
		if (!response.Body) {
			throw new Error(`Object not found: ${objectKey}`);
		}
		const bytes = await response.Body.transformToByteArray();
		return {
			body: Buffer.from(bytes),
			contentType: response.ContentType,
		};
	}
}
