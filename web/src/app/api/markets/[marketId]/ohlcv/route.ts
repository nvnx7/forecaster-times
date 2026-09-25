import axios from "axios";
import { NextResponse } from "next/server";

import { nansenApiBaseUrl, nansenApiKey } from "@/config/env";

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
    const { data } = await axios.post(
      `${nansenApiBaseUrl}/api/v1/prediction-market/ohlcv`,
      {
        market_id: marketId,
        date: { from: from.toISOString(), to: to.toISOString() },
        order_by: [{ field: "period_start", direction: "ASC" }],
        pagination: { page: 1, per_page: 100 },
      },
      { headers: { apikey: nansenApiKey, "content-type": "application/json" } },
    );
    return NextResponse.json(data, {
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
