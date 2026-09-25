"use client";

import { Line, LineChart, XAxis, YAxis } from "recharts";

import { useGetMarketHistory } from "@/api/getMarketHistory";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const chartConfig = {
  probability: {
    label: "Yes probability",
    color: "var(--foreground)",
  },
} satisfies ChartConfig;

export function MarketProbabilityChart({ marketId }: { marketId: string }) {
  const { data: history } = useGetMarketHistory(marketId);
  const yesCandles = history?.data.filter((candle) => candle.side === "Yes");
  const candles = (
    yesCandles?.length
      ? yesCandles
      : history?.data.filter((candle) => candle.outcome_index === 1)
  )?.sort(
    (left, right) =>
      new Date(left.period_start).valueOf() -
      new Date(right.period_start).valueOf(),
  );

  if (!candles || candles.length < 2) return null;

  const chartData = candles.map((candle) => ({
    periodStart: candle.period_start,
    probability: candle.close,
  }));
  return (
    <section
      aria-label="24-hour Yes probability history"
      className="col-span-full mt-2"
    >
      <p className="mb-1 font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
        Odds 24h
      </p>
      <ChartContainer config={chartConfig} className="h-16 w-full">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 2, left: 4 }}
        >
          <XAxis
            dataKey="periodStart"
            tick={false}
            tickLine={false}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.7 }}
            height={4}
          />
          <YAxis
            domain={[0, 1]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.7 }}
            width={4}
          />
          <Line
            type="linear"
            dataKey="probability"
            stroke="var(--color-probability)"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </section>
  );
}
