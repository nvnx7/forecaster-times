import { NextResponse } from "next/server";

import { internalEditionApiKey, nodeEnv } from "@/config/env";
import { editorialEngine, logger } from "@/server/editorial-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    nodeEnv !== "development" &&
    (!internalEditionApiKey ||
      request.headers.get("authorization") !==
        `Bearer ${internalEditionApiKey}`)
  ) {
    logger.warn("Front-page generation request rejected");
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    logger.info("Front-page generation request accepted");
    const frontPage = await editorialEngine.publishFrontPage();

    return NextResponse.json(
      {
        editionId: frontPage.edition.id,
        objectKey: editorialEngine.frontPageKey,
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
