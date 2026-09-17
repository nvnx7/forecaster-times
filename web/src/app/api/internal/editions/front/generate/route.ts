import { NextResponse } from "next/server";

import { internalEditionApiKey } from "@/config/env";
import {
  generateFrontPageEdition,
  StoryGenerationNotConfiguredError,
} from "@/server/generate-front-page-edition";
import { s3FrontPageObjectKey } from "@/server/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !internalEditionApiKey ||
    request.headers.get("authorization") !== `Bearer ${internalEditionApiKey}`
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const frontPage = await generateFrontPageEdition();

    return NextResponse.json(
      {
        editionId: frontPage.edition.id,
        objectKey: s3FrontPageObjectKey,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof StoryGenerationNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Unable to generate the front-page edition", error);

    return NextResponse.json(
      { error: "Unable to generate the front-page edition." },
      { status: 502 },
    );
  }
}
