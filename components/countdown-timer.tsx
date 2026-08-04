"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/** Shared across Teacher and Student portals — see AssistantsDirectory for
 * why `theme` is opt-in per caller. */
export function CountdownTimer({ minutes, theme = "default" }: { minutes: number; theme?: "default" | "cinema" }) {
  const isCinema = theme === "cinema";
  const totalSeconds = minutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    if (isRunning || remaining === 0) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  }

  function reset() {
    pause();
    setRemaining(totalSeconds);
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isTimeUp = remaining === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4",
        isCinema
          ? "border-cinema-border bg-cinema-panel/70 shadow-cinema-panel backdrop-blur"
          : "border-studio-ink/10 bg-white shadow-soft dark:border-white/10 dark:bg-studio-900",
      )}
    >
      <span
        className={cn(
          "font-display text-4xl tabular-nums",
          isTimeUp ? "text-red-600 dark:text-red-400" : isCinema && "text-cinema-white",
        )}
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      {isTimeUp ? (
        <span className="text-sm font-medium text-red-600 dark:text-red-400">Time&apos;s up</span>
      ) : (
        <div className="flex gap-2">
          {isRunning ? (
            <Button variant={isCinema ? "cinema-secondary" : "secondary"} onClick={pause}>
              Pause
            </Button>
          ) : (
            <Button variant={isCinema ? "cinema" : "primary"} onClick={start}>
              Start
            </Button>
          )}
          <Button variant="ghost" onClick={reset} className={isCinema ? "text-cinema-muted hover:bg-white/5 hover:text-cinema-white" : undefined}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
