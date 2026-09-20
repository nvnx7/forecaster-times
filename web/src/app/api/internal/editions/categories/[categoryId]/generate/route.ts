import { type CategoryPageId, categoryPageConfigs } from "@repo/engine";
import { NextResponse } from "next/server";

import { editorialEngine, logger } from "@/server/editorial-engine";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await params;
  if (!Object.hasOwn(categoryPageConfigs, categoryId)) {
    return NextResponse.json({ error: "Unknown category." }, { status: 404 });
  }
  logger.info("Category-page generation request accepted", { categoryId });

  try {
    const page = await editorialEngine.publishCategoryPage(
      categoryId as CategoryPageId,
    );
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    logger.error("Category-page generation request failed", {
      categoryId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Unable to generate category edition." },
      { status: 502 },
    );
  }
}
