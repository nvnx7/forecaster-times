# Forecaster Times Web

The Next.js reader for published Forecaster Times editions. It renders the
newspaper experience, loads published pages and illustrations from
S3-compatible storage, refreshes live market data, and lets connected wallets
submit Polymarket orders.

It is read-only with respect to editorial generation. The separate `cron/`
workspace creates and publishes editions.

## Data Flow

- Server routes read `latest.json`, the active edition manifest, pages, and
  illustrations from S3.
- Client hooks hydrate trade panels from the saved story market data, then fetch
  current market details from Polymarket Gamma.
- The server-side OHLCV route obtains 24-hour market history from Nansen.

## Development

```sh
cp .env.example .env
# Fill in Nansen and S3 credentials.
bun run dev
```

The application runs at [http://localhost:3000](http://localhost:3000).

Required environment variables are documented in `.env.example`. Nansen is used
only for the OHLCV route; S3 credentials are used only to read published edition
assets.

Run checks from this directory:

```sh
bun run lint
bun run check-types
```
