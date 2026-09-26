# Editorial Engine

The editorial engine turns active Polymarket markets into complete Forecaster
Times editions. It selects markets through Nansen, researches related reporting
with TinyFish, generates stories and illustrations with OpenRouter, and saves
resumable drafts and immutable published editions to S3-compatible storage.

## Architecture

```text
Nansen → market candidates → TinyFish → story generator → image generator
                                                     ↓
                                              S3 draft/work
                                                     ↓
                                          S3 draft/publishable
                                                     ↓
                                   edition-<id>/ + manifest.json + latest.json
```

`EditorialEngine` is intentionally stateful through object storage, not process
memory. A later run resumes an unexpired draft. Published editions are immutable;
`latest.json` points readers to the most recently published edition.

The configured category IDs are `world-politics`, `money-markets`,
`technology-culture`, `sports`, and `crypto`. See `src/config.ts` for the market
tags, layouts, generator fallback order, and image presets.

## Usage

Create the engine with provider clients and invoke a publishing method:

```ts
import { createEditorialEngine } from "@repo/engine";

const engine = createEditorialEngine({
  nansen: { apiKey, baseUrl },
  s3: { endpoint, accessKeyId, secretAccessKey, region, bucketName },
  tinyFish: { apiKey: tinyFishApiKey },
  storyGenerator,
  storyImageGenerator,
});

await engine.publishEdition(["world-politics", "crypto"]);
```

The main methods are:

- `publishEdition(categoryIds?)` generates the front page and selected category
  pages, then publishes the complete edition.
- `publishDraftEdition(categoryIds?)` promotes the available publishable draft
  pages without generating new content.
- `draftFrontPage()`, `draftCategoryPage(id)`, and `draftCategoryPages(ids?)`
  generate resumable drafts without publishing.
- `getFrontPage()`, `getCategoryPage(id)`, and `getLatestEditionManifest()` read
  published assets.

Illustration failures are recorded on the draft story but do not prevent a page
with successful story copy from publishing.

## Development

From this directory:

```sh
bun run lint
bun run check-types
```

The root `scripts/` and `cron/` workspaces provide fully configured engine
instances for local generation and scheduled production generation respectively.
