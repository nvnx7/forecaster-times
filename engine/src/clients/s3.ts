import {
  S3Client as AwsS3Client,
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";

import { logger } from "../logger";

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

  async getJson<T>(key: string): Promise<T> {
    logger.debug("S3 JSON read started", {
      bucket: this.options.bucketName,
      endpoint: this.options.endpoint,
      forcePathStyle: this.options.forcePathStyle,
      key,
      region: this.options.region,
    });

    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.options.bucketName, Key: key }),
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
      logger.error("S3 JSON read failed", {
        key,
        ...getS3ErrorDetails(error),
      });

      if (
        error instanceof S3ServiceException &&
        ["NoSuchKey", "NotFound", "NoSuchBucket"].includes(error.name)
      ) {
        throw new ObjectNotFoundError(key);
      }

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
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.options.bucketName,
          Key: key,
          Body: JSON.stringify(value),
          ContentType: "application/json; charset=utf-8",
        }),
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
}
