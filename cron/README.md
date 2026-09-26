# Forecaster Times Cron

This is the long-running Hono process that schedules and publishes complete
Forecaster Times editions. It owns generation credentials and depends on
`@repo/engine`.

## How It Works

`src/index.ts` starts a Hono server and registers Bun's in-process cron using
the UTC `EDITION_CRON` expression. It defaults to `15 0 * * *` (daily at
00:15 UTC). The callback runs `generateEdition`, which publishes the front page
and every configured category through `EditorialEngine`.

Set `EDITION_CRON` in `cron/.env` to change the cadence. For example:

```dotenv
# Every six hours, at minute 15 (UTC)
EDITION_CRON="15 */6 * * *"
```

The server exposes only:

```text
GET /health
```

It deliberately has no public generation endpoint. The job is triggered by the
cron callback, which avoids unauthenticated requests incurring generation costs.
Bun waits for a cron callback promise to settle before scheduling its next run,
so a second in-process run does not overlap a previous one.

## Usage

Requires Bun `1.4.2` or later.

```sh
cp .env.example .env
# Fill in the provider and S3 credentials.
bun src/index.ts
```

Or from the repository root:

```sh
bun --env-file=cron/.env cron/src/index.ts
```

The server listens on `PORT`, defaulting to `3001`:

```sh
curl http://localhost:3001/health
```

## Development

```sh
bun run lint
bun run check-types
```

Deploy this as an always-running Bun process. The cron is in-process, so the
process must remain alive; drafts and published state safely persist in S3
between restarts.
