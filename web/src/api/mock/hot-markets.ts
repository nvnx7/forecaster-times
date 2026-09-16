import type { HotMarket } from "@/types";

export const mockHotMarkets = [
  { headline: "Fed Rate Cut", odds: "80¢" },
  { headline: "Starship Reaches Orbit", odds: "60¢" },
  { headline: "Bitcoin Above $100K", odds: "73¢" },
  { headline: "U.S. Recession This Year", odds: "22¢" },
  { headline: "Ethereum ETF Inflows", odds: "68¢" },
] satisfies readonly HotMarket[];
