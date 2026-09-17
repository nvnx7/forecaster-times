import log from "loglevel";

export const logger = log.getLogger("probability-press");

logger.setLevel(
  process.env.NODE_ENV === "development" ? log.levels.DEBUG : log.levels.INFO,
);
