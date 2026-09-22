function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = process.env.NODE_ENV ?? "development";

export const nansenApiKey = requiredEnv("API_KEY_NANSEN");
export const nansenApiBaseUrl =
  process.env.NANSEN_API_BASE_URL ?? "https://api.nansen.ai";

export const openRouterApiKey = requiredEnv("API_KEY_OPENROUTER");
export const tinyFishApiKey = requiredEnv("API_KEY_TINY_FISH");
export const cloudflareApiKey = requiredEnv("API_KEY_CLOUDFLARE");
export const cloudflareAccountId = requiredEnv("ACCOUNT_ID_CLOUDFLARE");

export const s3Endpoint = requiredEnv("S3_ENDPOINT_URL");
export const s3AccessKeyId = requiredEnv("S3_ACCESS_KEY_ID");
export const s3SecretAccessKey = requiredEnv("S3_SECRET_ACCESS_KEY");
export const s3Region = requiredEnv("S3_REGION");
export const s3BucketName = requiredEnv("S3_BUCKET_NAME");
