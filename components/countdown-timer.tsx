"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function CountdownTimer({ minutes }: { minutes: number }) {
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
    <div className="flex items-center gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <span
        className={`font-display text-4xl tabular-nums ${isTimeUp ? "text-red-600 dark:text-red-400" : ""}`}
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      {isTimeUp ? (
        <span className="text-sm font-medium text-red-600 dark:text-red-400">Time&apos;s up</span>
      ) : (
        <div className="flex gap-2">
          {isRunning ? (
            <Button variant="secondary" onClick={pause}>
              Pause
            </Button>
          ) : (
            <Button onClick={start}>Start</Button>
          )}
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
