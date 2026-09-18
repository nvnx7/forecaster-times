import { NextResponse } from "next/server";
import { z } from "zod";

import { editorialEngine } from "@/server/editorial-engine";

const listPolymarketMarketsParamsSchema = z.object({
  orderBy: z
    .array(
      z.object({
        field: z.enum([
          "volume_24hr",
          "volume",
          "volume_1wk",
          "volume_1mo",
          "liquidity",
          "open_interest",
          "unique_traders_24h",
          "age_hours",
        ]),
        direction: z.enum(["ASC", "DESC"]),
      }),
    )
    .optional(),
  status: z.enum(["active", "closed", ""]).optional(),
  tags: z.array(z.string()).max(50).optional(),
  minLiquidity: z.number().min(-1).optional(),
  minVolume24hr: z.number().min(-1).optional(),
  pagination: z
    .object({
      page: z.number().int().min(1).optional(),
      perPage: z.number().int().min(1).max(1000).optional(),
    })
    .optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const params = listPolymarketMarketsParamsSchema.parse(
      await request.json(),
    );
    const markets = await editorialEngine.listPolymarketMarkets(params);

    return NextResponse.json(markets, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid market filters." },
        { status: 400 },
      );
    }

    console.error("Unable to list Polymarket markets", error);

    return NextResponse.json(
      { error: "Unable to load Polymarket markets." },
      { status: 502 },
    );
  }
}
