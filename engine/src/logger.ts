import log from "loglevel";

/** Shared logger for all engine infrastructure and editorial workflows. */
export const logger = log.getLogger("probability-press");

logger.setLevel("info");
