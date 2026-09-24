import {
  type CategoryPageId,
  categoryPageConfigs,
  ObjectNotFoundError,
} from "@repo/engine";
import { NextResponse } from "next/server";

import { editorialEngine } from "@/server/editorial-engine";

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
      await editorialEngine.getDraftCategoryPage(categoryId as CategoryPageId),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json(
        { error: "The current category draft has not been generated." },
        { status: 404 },
      );
    }

    console.error("Unable to read category-page draft", error);
    return NextResponse.json(
      { error: "Unable to load the current category draft." },
      { status: 500 },
    );
  }
}
