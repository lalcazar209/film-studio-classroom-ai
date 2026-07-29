"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="font-display text-2xl font-extrabold">Something went wrong</h1>
          <p className="text-studio-ink/60">
            The error has been reported. Try again, or come back in a moment.
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-studio-accent px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-studio-accent/90"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
