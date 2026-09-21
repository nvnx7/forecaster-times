import {
  S3Client as AwsS3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";

import { logger } from "../logger";
import { delay } from "../utils/delay";

const defaultRetryCount = 2;
const defaultRetryBaseDelayMs = 500;

export class ObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`Object not found: ${key}`);
    this.name = "ObjectNotFoundError";
  }
}

export type S3JsonStoreOptions = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  forcePathStyle: boolean;
  retryCount?: number;
  retryBaseDelayMs?: number;
};

export type StoredObject = {
  bytes: Uint8Array;
  contentType: string;
};

function getS3ErrorDetails(error: unknown) {
  if (error instanceof S3ServiceException) {
    return {
      name: error.name,
      message: error.message,
      statusCode: error.$metadata.httpStatusCode,
      requestId: error.$metadata.requestId,
      attempts: error.$metadata.attempts,
    };
  }

  return {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown error",
  };
}

function isRetryableS3Error(error: unknown): boolean {
  if (error instanceof S3ServiceException) {
    const statusCode = error.$metadata.httpStatusCode;
    return (
      statusCode === 408 ||
      statusCode === 429 ||
      (statusCode !== undefined && statusCode >= 500)
    );
  }

  if (!(error instanceof Error)) return false;
  return (
    ["TimeoutError", "NetworkingError", "AbortError"].includes(error.name) ||
    /socket connection was closed|ECONNRESET|ETIMEDOUT/i.test(error.message)
  );
}

/** S3-compatible storage for immutable editorial documents. */
export class S3JsonStore {
  private readonly client: AwsS3Client;

  constructor(private readonly options: S3JsonStoreOptions) {
    this.client = new AwsS3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
            }
          : undefined,
    });
  }

  private async send<T>(
    operation: string,
    key: string,
    request: () => Promise<T>,
  ): Promise<T> {
    const retryCount = this.options.retryCount ?? defaultRetryCount;
    const maximumAttempts = retryCount + 1;
    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        return await request();
      } catch (error) {
        if (!isRetryableS3Error(error) || attempt === maximumAttempts) {
          throw error;
        }
        logger.warn("S3 request retry scheduled", {
          operation,
          key,
          attempt,
          maximumAttempts,
          ...getS3ErrorDetails(error),
        });
        await delay(
          (this.options.retryBaseDelayMs ?? defaultRetryBaseDelayMs) * attempt,
        );
      }
    }
    throw new Error(`S3 request retry unexpectedly exhausted: ${operation}`);
  }

  async getJson<T>(key: string): Promise<T> {
    logger.debug("S3 JSON read started", {
      bucket: this.options.bucketName,
      endpoint: this.options.endpoint,
      forcePathStyle: this.options.forcePathStyle,
      key,
      region: this.options.region,
    });

    try {
      const response = await this.send("JSON read", key, () =>
        this.client.send(
          new GetObjectCommand({ Bucket: this.options.bucketName, Key: key }),
        ),
      );

      if (!response.Body) {
        throw new Error(`Object has no body: ${key}`);
      }

      const document = JSON.parse(
        await response.Body.transformToString("utf-8"),
      ) as T;
      logger.debug("S3 JSON read completed", { key });
      return document;
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        ["NoSuchKey", "NotFound", "NoSuchBucket"].includes(error.name)
      ) {
        logger.debug("S3 JSON object not found", { key });
        throw new ObjectNotFoundError(key);
      }

      logger.error("S3 JSON read failed", {
        key,
        ...getS3ErrorDetails(error),
      });
      throw error;
    }
  }

  async putJson(key: string, value: unknown): Promise<void> {
    logger.debug("S3 JSON write started", {
      bucket: this.options.bucketName,
      endpoint: this.options.endpoint,
      forcePathStyle: this.options.forcePathStyle,
      key,
      region: this.options.region,
    });

    try {
      await this.send("JSON write", key, () =>
        this.client.send(
          new PutObjectCommand({
            Bucket: this.options.bucketName,
            Key: key,
            Body: JSON.stringify(value),
            ContentType: "application/json; charset=utf-8",
          }),
        ),
      );
      logger.debug("S3 JSON write completed", { key });
    } catch (error) {
      logger.error("S3 JSON write failed", {
        key,
        ...getS3ErrorDetails(error),
      });
      throw error;
    }
  }

  async getObject(key: string): Promise<StoredObject> {
    logger.debug("S3 object read started", { key });

    try {
      const response = await this.send("object read", key, () =>
        this.client.send(
          new GetObjectCommand({ Bucket: this.options.bucketName, Key: key }),
        ),
      );
      if (!response.Body) {
        throw new Error(`Object has no body: ${key}`);
      }

      const bytes = await response.Body.transformToByteArray();
      const contentType = response.ContentType ?? "application/octet-stream";
      logger.debug("S3 object read completed", {
        key,
        contentType,
        byteLength: bytes.byteLength,
      });
      return { bytes, contentType };
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        ["NoSuchKey", "NotFound", "NoSuchBucket"].includes(error.name)
      ) {
        logger.debug("S3 object not found", { key });
        throw new ObjectNotFoundError(key);
      }

      logger.error("S3 object read failed", {
        key,
        ...getS3ErrorDetails(error),
      });
      throw error;
    }
  }

  async putObject(
    key: string,
    body: Uint8Array,
    contentType: string,
  ): Promise<void> {
    logger.debug("S3 object write started", {
      key,
      contentType,
      byteLength: body.byteLength,
    });

    try {
      await this.send("object write", key, () =>
        this.client.send(
          new PutObjectCommand({
            Bucket: this.options.bucketName,
            Key: key,
            Body: body,
            ContentType: contentType,
          }),
        ),
      );
      logger.debug("S3 object write completed", { key });
    } catch (error) {
      logger.error("S3 object write failed", {
        key,
        ...getS3ErrorDetails(error),
      });
      throw error;
    }
  }

  async deleteJson(key: string): Promise<void> {
    await this.deleteObject(key);
  }

  /** S3 promotion primitive: copies a completed draft before its source is removed. */
  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    logger.debug("S3 object copy started", { sourceKey, destinationKey });

    try {
      await this.send("object copy", sourceKey, () =>
        this.client.send(
          new CopyObjectCommand({
            Bucket: this.options.bucketName,
            CopySource: `${this.options.bucketName}/${encodeURIComponent(sourceKey).replaceAll("%2F", "/")}`,
            Key: destinationKey,
          }),
        ),
      );
      logger.debug("S3 object copy completed", { sourceKey, destinationKey });
    } catch (error) {
      logger.error("S3 object copy failed", {
        sourceKey,
        destinationKey,
        ...getS3ErrorDetails(error),
      });
      throw error;
    }
  }

  /** S3 has no rename primitive, so a move is implemented as copy then delete. */
  async moveObject(sourceKey: string, destinationKey: string): Promise<void> {
    await this.copyObject(sourceKey, destinationKey);
    await this.deleteObject(sourceKey);
  }

  async deleteObject(key: string): Promise<void> {
    logger.debug("S3 object delete started", { key });

    try {
      await this.send("object delete", key, () =>
        this.client.send(
          new DeleteObjectCommand({
            Bucket: this.options.bucketName,
            Key: key,
          }),
        ),
      );
      logger.debug("S3 object delete completed", { key });
    } catch (error) {
      logger.error("S3 object delete failed", {
        key,
        ...getS3ErrorDetails(error),
      });
      throw error;
    }
  }
}
