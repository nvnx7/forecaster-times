import { ObjectNotFoundError } from "@repo/engine";
import { NextResponse } from "next/server";

import { editorialEngine } from "@/server/editorial-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const frontPage = await editorialEngine.getFrontPage();

    return NextResponse.json(frontPage, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json(
        { error: "The current front-page edition has not been published." },
        { status: 404 },
      );
    }

    console.error("Unable to read the published front page", error);

    return NextResponse.json(
      { error: "Unable to load the current front-page edition." },
      { status: 500 },
    );
  }
}
