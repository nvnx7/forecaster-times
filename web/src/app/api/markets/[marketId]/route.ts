import { ObjectNotFoundError, toMarketPanel } from "@repo/engine";
import { NextResponse } from "next/server";

import { editorialEngine } from "@/server/editorial-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await params;

  try {
    const market = await editorialEngine.getPolymarketMarket(marketId);
    return NextResponse.json(toMarketPanel(market), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json({ error: "Market not found." }, { status: 404 });
    }

    console.error("Unable to load live market detail", error);
    return NextResponse.json(
      { error: "Unable to load live market detail." },
      { status: 502 },
    );
  }
}
