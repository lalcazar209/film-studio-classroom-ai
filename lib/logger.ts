import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

const MAX_CAUSE_DEPTH = 5;

/** Diagnostic fields SDK error classes commonly attach beyond the plain
 * Error shape (Anthropic/OpenAI's APIError, node-fetch/undici errors,
 * etc.) — captured when present so a wrapped error's *actual* HTTP status
 * or error code doesn't get lost behind a generic "generation failed". */
function extraFields(error: Record<string, unknown>): LogMeta {
  const extra: LogMeta = {};
  for (const key of ["status", "code", "type", "param"]) {
    if (key in error && error[key] !== undefined) extra[key] = error[key];
  }
  return extra;
}

function describeError(error: unknown): LogMeta {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      ...extraFields(error as unknown as Record<string, unknown>),
    };
  }
  if (error === undefined) return {};
  return { error };
}

/** Unwraps AIProviderError/ImageProviderError-style `.cause` chains (and
 * the standard ES2022 Error `cause` option) so the log shows every level,
 * not just the outermost "[provider] generation failed" wrapper. */
function errorMeta(error: unknown): LogMeta {
  const meta = describeError(error);
  const chain: LogMeta[] = [];

  let current = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth++) {
    const cause = current instanceof Error ? (current as Error & { cause?: unknown }).cause : undefined;
    if (cause === undefined || cause === current) break;
    chain.push(describeError(cause));
    current = cause;
  }

  return chain.length > 0 ? { ...meta, causeChain: chain } : meta;
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
