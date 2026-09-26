import { ObjectNotFoundError } from "@repo/engine";
import { NextResponse } from "next/server";

import { editionStore } from "@/server/edition-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const frontPage = await editionStore.getFrontPage();

    return NextResponse.json(frontPage, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json(
        { error: "The latest front page has not been published." },
        { status: 404 },
      );
    }

    console.error("Unable to read the latest front page", error);

    return NextResponse.json(
      { error: "Unable to load the latest front page." },
      { status: 500 },
    );
  }
}
