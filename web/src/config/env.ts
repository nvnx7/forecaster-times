export const nansenApiKey = process.env.NANSEN_API_KEY as string;
export const nansenApiBaseUrl =
  process.env.NANSEN_API_BASE_URL ?? "https://api.nansen.ai";

export const s3Endpoint = process.env.S3_ENDPOINT_URL as string;
export const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID as string;
export const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY as string;
export const s3Region = (process.env.S3_REGION ?? "us-east-1") as string;

export const s3Bucket = process.env.S3_BUCKET as string;
