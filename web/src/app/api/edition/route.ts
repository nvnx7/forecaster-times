import { ObjectNotFoundError } from "@repo/engine";
import { NextResponse } from "next/server";

import { editionStore } from "@/server/edition-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await editionStore.getLatestEditionManifest(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json(
        { error: "The latest edition has not been published." },
        { status: 404 },
      );
    }

    console.error("Unable to read latest edition manifest", error);
    return NextResponse.json(
      { error: "Unable to load the latest edition." },
      { status: 500 },
    );
  }
}
