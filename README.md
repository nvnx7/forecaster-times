<h1 align="center">Forecaster Times</h1>

<p align="center">
  <img src="./web/public/logo.png" alt="Forecaster Times" width="720" />
</p>

Forecaster Times is an AI-produced prediction-market newspaper. It researches
active Polymarket markets, writes and illustrates newspaper pages, publishes
immutable editions to S3-compatible storage, and presents them in a vintage
Next.js reader with live market data and trading controls.

## Contents

- [Engine](./engine/README.md)
- [Cron](./cron/README.md)
- [Web](./web/README.md)
- [Development](#development)

## Packages

### [`engine/`](./engine/README.md)

The editorial domain package. It selects markets through Nansen, researches
news with TinyFish, generates stories and illustrations through OpenRouter, and
persists drafts and published editions to S3-compatible storage. Read the
[engine architecture and API guide](./engine/README.md).

### [`cron/`](./cron/README.md)

The long-running Bun and Hono scheduler. It owns generation credentials and
publishes a complete edition daily through the engine, while exposing only a
small health endpoint. Read the [cron setup and deployment guide](./cron/README.md).

### [`web/`](./web/README.md)

The Next.js reader experience. It reads published editions from storage,
refreshes live market data, and supports Polymarket trading with a connected
wallet. Read the [web data-flow and development guide](./web/README.md).

### [`configs/`](./configs)

Shared TypeScript and Biome configuration for all workspaces.

## Development

Requires Bun `1.4.2` or later.

```sh
bun install
```

Create local environment files from the package templates:

```sh
cp .env.example .env
cp web/.env.example web/.env
cp cron/.env.example cron/.env
```

Start the reader:

```sh
bun dev
```

Start the scheduled editorial process:

```sh
bun --env-file=cron/.env cron/src/index.ts
```

Run all workspace checks:

```sh
bun run lint
bun run check-types
bun run check-scripts
```

## Local Editorial Scripts

With root `.env` configured, use the scripts directly or their matching `just`
recipes:

```sh
# Generate and publish the front page plus every configured category.
bun --env-file=.env scripts/generate-edition.ts

# Generate or resume only the front-page draft.
bun --env-file=.env scripts/generate-front-page.ts

# Generate or resume selected category-page drafts.
bun --env-file=.env scripts/generate-category-page.ts world-politics crypto

# Publish the currently available draft pages as an edition.
bun --env-file=.env scripts/publish-draft-edition.ts
```

Equivalent shortcuts include `just generate-edition`, `just
generate-front-page`, `just generate-category-page world-politics`, and `just
publish-draft-edition`.
