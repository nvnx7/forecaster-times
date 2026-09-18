import log, { type LogLevelDesc } from "loglevel";

export type EditorialLogger = Pick<
  log.Logger,
  "debug" | "info" | "warn" | "error"
>;

/** Creates a named logger so engine diagnostics remain consistent across hosts. */
export function createEditorialLogger(
  level: LogLevelDesc = "info",
): EditorialLogger {
  const logger = log.getLogger("probability-press");
  logger.setLevel(level);
  return logger;
}
