import { Hono } from "hono";

import { editionCron } from "./config";
import { createCronEditorialEngine } from "./editorial-engine";
import { generateEdition } from "./generate-edition";

const port = Number(process.env.PORT ?? 3001);
const engine = createCronEditorialEngine();

const app = new Hono();

app.get("/health", (context) =>
  context.json({ status: "ok", editionCron, timeZone: "UTC" }),
);

Bun.cron(
  editionCron,
  async () => {
    try {
      await generateEdition(engine);
    } catch (error) {
      console.error("Scheduled edition generation failed", error);
    }
  },
  { tz: "UTC" },
);

console.info(`Forecaster Times scheduler listening on port ${port}`);

Bun.serve({
  port,
  fetch: app.fetch,
});
