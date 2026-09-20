import { ObjectNotFoundError } from "@repo/engine";
import { NextResponse } from "next/server";

import { editorialEngine } from "@/server/editorial-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> },
) {
  const { storyId } = await params;

  try {
    const image = await editorialEngine.getFrontPageIllustration(storyId);
    const body = new ArrayBuffer(image.bytes.byteLength);
    new Uint8Array(body).set(image.bytes);

    return new NextResponse(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
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

    console.error("Unable to read front-page illustration", error);
    return NextResponse.json(
      { error: "Unable to load illustration." },
      { status: 500 },
    );
  }
}
