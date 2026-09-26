<h1 align="center">Forecaster Times</h1>

![Forecaster Times](./web/public/logo.png)

Forecaster Times is an AI-produced prediction-market newspaper. It researches
Polymarket markets through Nansen, writes an illustrated front page and category
pages, publishes complete editions to S3-compatible storage, and renders them in
a Next.js newspaper experience with live market odds and probability charts.

## Contents

```
engine/   Editorial domain: research, story and image generation, validation, and storage.
web/      Next.js reader experience and its edition, illustration, and market-data APIs.
scripts/  Local commands for drafting pages and publishing a completed edition.
cron/     Hono scheduler that generates and publishes a daily edition.
configs/  Shared TypeScript and Biome configuration.
```

Generated editorial assets are organized in object storage as follows:

```
draft/work/          In-progress editorial state and pages.
draft/publishable/   Pages and illustrations ready to publish.
edition-<id>/        A published edition: pages, illustrations, and manifest.json.
latest.json          Pointer to the latest published edition.
```

## Packages

| Package | Purpose |
| --- | --- |
| `@repo/engine` | Editorial engine, provider clients, generation fallbacks, schemas, and S3 persistence. |
| `web` | Next.js 16 application for reading published editions and refreshing live market data. |
| `@repo/cron` | Hono process that schedules daily complete-edition generation with Bun cron. |
| `@repo/configs` | Shared TypeScript and Biome configuration. |

The engine uses Nansen for market research and OHLCV history, OpenRouter for
story and image generation, TinyFish for web research, and S3-compatible
storage for edition assets.

## Development

Prerequisites: Bun `1.4.2` or later and the credentials required by the services above.

Create local environment configuration from the provided template:

```sh
cp web/.env.example web/.env
bun install
```

Start the web application at [http://localhost:3000](http://localhost:3000):

```sh
bun dev
```

Run the workspace checks:

```sh
bun run lint
bun run check-types
bun run check-scripts
```

Draft and publish editorial pages with the local environment file:

```sh
# Create or update the front-page draft.
bun --env-file=web/.env scripts/generate-front-page.ts

# Draft selected category pages, or omit IDs to draft all category pages.
bun --env-file=web/.env scripts/generate-category-page.ts world-politics sports

# Publish the currently available draft pages as the next edition.
bun --env-file=web/.env scripts/publish-draft-edition.ts
```

Use `bun run build` for a production build and `bun run start` to serve it.

Start the editorial scheduler with the same environment variables. It listens on
port `3001` by default, exposes `GET /health`, and generates a full edition at
00:15 UTC daily:

```sh
cp cron/.env.example cron/.env
bun --env-file=cron/.env cron/src/index.ts
```
