export function formatProbabilityAsCents(probability: number): string {
  return `${Math.round(probability * 100)}¢`;
}

export function formatChangeInPoints(change: number): string {
  return `${change >= 0 ? "+" : ""}${Math.round(change * 100)} pts`;
}

export function formatUsdCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
