import {
  type CategoryPageId,
  categoryPageConfigs,
  ObjectNotFoundError,
} from "@repo/engine";
import { NextResponse } from "next/server";

import { editionStore } from "@/server/edition-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await params;
  if (!Object.hasOwn(categoryPageConfigs, categoryId)) {
    return NextResponse.json({ error: "Unknown category." }, { status: 404 });
  }

  try {
    return NextResponse.json(
      await editionStore.getCategoryPage(categoryId as CategoryPageId),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json(
        { error: "The latest category page has not been published." },
        { status: 404 },
      );
    }

    console.error("Unable to read latest category page", error);
    return NextResponse.json(
      { error: "Unable to load the latest category page." },
      { status: 500 },
    );
  }
}
