import log from "loglevel";

/** Shared logger for all engine infrastructure and editorial workflows. */
export const logger = log.getLogger("probability-press");

const defaultMethodFactory = logger.methodFactory;

logger.methodFactory = (methodName, logLevel, loggerName) => {
  const write = defaultMethodFactory(methodName, logLevel, loggerName);

  return (...messages: unknown[]) => {
    write(
      messages
        .map((message) => {
          if (typeof message === "string") {
            return message;
          }

          try {
            return JSON.stringify(message);
          } catch {
            return String(message);
          }
        })
        .join(" "),
    );
  };
};

logger.setLevel("info");
