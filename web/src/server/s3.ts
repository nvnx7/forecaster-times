import {
  S3Client as AwsS3Client,
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";

import {
  s3AccessKeyId,
  s3BucketName,
  s3Endpoint,
  s3Region,
  s3SecretAccessKey,
} from "@/config/env";
import { logger } from "@/lib/logger";

const s3ForcePathStyle = true;
export const s3FrontPageObjectKey = "editions/front-page/current.json";

export class ObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`Object not found: ${key}`);
    this.name = "ObjectNotFoundError";
  }
}

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

/** A small S3-compatible object-store client for published editorial assets. */
export class S3Client {
  private readonly client = new AwsS3Client({
    region: s3Region,
    endpoint: s3Endpoint,
    forcePathStyle: s3ForcePathStyle,
    credentials:
      s3AccessKeyId && s3SecretAccessKey
        ? {
            accessKeyId: s3AccessKeyId,
            secretAccessKey: s3SecretAccessKey,
          }
        : undefined,
  });

  async getJson<T>(key: string): Promise<T> {
    logger.debug("S3 JSON read started", {
      bucket: s3BucketName,
      endpoint: s3Endpoint,
      forcePathStyle: s3ForcePathStyle,
      key,
      region: s3Region,
    });

    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: s3BucketName, Key: key }),
      );

      if (!response.Body) {
        throw new Error(`Object has no body: ${key}`);
      }

      const document = JSON.parse(
        await response.Body.transformToString("utf-8"),
      ) as T;

      logger.info("S3 JSON read completed", { key });

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
      bucket: s3BucketName,
      endpoint: s3Endpoint,
      forcePathStyle: s3ForcePathStyle,
      key,
      region: s3Region,
    });

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: key,
          Body: JSON.stringify(value),
          ContentType: "application/json; charset=utf-8",
        }),
      );

      logger.info("S3 JSON write completed", { key });
    } catch (error) {
      logger.error("S3 JSON write failed", {
        key,
        ...getS3ErrorDetails(error),
      });
      throw error;
    }
  }
}

export const s3 = new S3Client();
