export const env = process.env.NODE_ENV as string;

export const nansenApiKey = process.env.API_KEY_NANSEN as string;
export const nansenApiBaseUrl =
  process.env.NANSEN_API_BASE_URL ?? "https://api.nansen.ai";

export const internalEditionApiKey = process.env
  .INTERNAL_EDITION_API_KEY as string;

export const geminiApiKey = process.env.API_KEY_GEMINI as string;
export const nodeEnv = process.env.NODE_ENV as string;

export const s3Endpoint = process.env.S3_ENDPOINT_URL as string;
export const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID as string;
export const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY as string;
export const s3Region = process.env.S3_REGION as string;
export const s3BucketName = process.env.S3_BUCKET_NAME as string;
