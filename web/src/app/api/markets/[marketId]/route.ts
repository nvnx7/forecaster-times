import { ObjectNotFoundError, toMarketPanel } from "@repo/engine";
import { NextResponse } from "next/server";

import { editorialEngine } from "@/server/editorial-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await params;
  const query = new URL(request.url).searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "A market search query is required." },
      { status: 400 },
    );
  }

  try {
    const market = await editorialEngine.getPolymarketMarket(marketId, query);
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
