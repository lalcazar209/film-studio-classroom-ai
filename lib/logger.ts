import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

function errorMeta(error: unknown): LogMeta {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message, stack: error.stack };
  }
  if (error === undefined) return {};
  return { error };
}

function emit(level: LogLevel, message: string, meta?: LogMeta) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...meta };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    emit("debug", message, meta);
  },
  info(message: string, meta?: LogMeta) {
    emit("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    emit("warn", message, meta);
  },
  /** Logs a structured error entry and reports it to Sentry (a no-op without SENTRY_DSN configured). */
  error(message: string, error?: unknown, meta?: LogMeta) {
    emit("error", message, { ...errorMeta(error), ...meta });
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { message, ...meta } });
    } else {
      Sentry.captureMessage(message, { level: "error", extra: { error, ...meta } });
    }
  },
};
