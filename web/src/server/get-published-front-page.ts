import { s3FrontPageObjectKey } from "@/config/env";
import { frontPageSchema } from "@/server/front-page-schema";
import { s3 } from "@/server/s3";
import type { FrontPage } from "@/types";

/**
 * Returns the fully assembled editorial edition exactly as published.
 * Dynamic market overlays will be merged in a later service; this function
 * deliberately performs no caching or mutations.
 */
export async function getPublishedFrontPage(): Promise<FrontPage> {
  const document = await s3.getJson<unknown>(s3FrontPageObjectKey);

  return frontPageSchema.parse(document);
}
