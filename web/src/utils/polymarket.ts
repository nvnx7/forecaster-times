export const POLYMARKET_BASE_URL = "https://polymarket.com";

export function getPolymarketUrl(slug?: string) {
  return slug
    ? `${POLYMARKET_BASE_URL}/market/${encodeURIComponent(slug)}`
    : undefined;
}
