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
  { params }: { params: Promise<{ categoryId: string; storyId: string }> },
) {
  const { categoryId, storyId } = await params;
  if (!Object.hasOwn(categoryPageConfigs, categoryId)) {
    return NextResponse.json({ error: "Unknown category." }, { status: 404 });
  }

  try {
    const image = await editorialEngine.getDraftCategoryPageIllustration(
      categoryId as CategoryPageId,
      storyId,
    );
    const body = new ArrayBuffer(image.bytes.byteLength);
    new Uint8Array(body).set(image.bytes);
    return new NextResponse(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": image.contentType,
      },
    });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json(
        { error: "Illustration not found." },
        { status: 404 },
      );
    }
    console.error("Unable to read category-page draft illustration", error);
    return NextResponse.json(
      { error: "Unable to load illustration." },
      { status: 500 },
    );
  }
}
