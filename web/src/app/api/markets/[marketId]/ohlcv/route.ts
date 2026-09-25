import { NextResponse } from "next/server";

import { editorialEngine } from "@/server/editorial-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await params;
  const to = new Date();
  const from = new Date(to.valueOf() - 24 * 60 * 60 * 1_000);

  try {
    const history = await editorialEngine.getPolymarketMarketOhlcv(
      marketId,
      from.toISOString(),
      to.toISOString(),
    );
    return NextResponse.json(history, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to load live market history", error);
    return NextResponse.json(
      { error: "Unable to load live market history." },
      { status: 502 },
    );
  }
}
