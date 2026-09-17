import { NextResponse } from "next/server";

import { internalEditionApiKey } from "@/config/env";
import { logger } from "@/lib/logger";
import { generateFrontPageEdition } from "@/server/generate-front-page-edition";
import { s3FrontPageObjectKey } from "@/server/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !internalEditionApiKey ||
    request.headers.get("authorization") !== `Bearer ${internalEditionApiKey}`
  ) {
    logger.warn("Front-page generation request rejected");
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    logger.info("Front-page generation request accepted");
    const frontPage = await generateFrontPageEdition();

    return NextResponse.json(
      {
        editionId: frontPage.edition.id,
        objectKey: s3FrontPageObjectKey,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Front-page generation request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Unable to generate the front-page edition." },
      { status: 502 },
    );
  }
}
