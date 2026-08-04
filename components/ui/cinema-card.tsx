import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** Cinema-themed counterpart to components/ui/card.tsx, same sub-component
 * API on purpose so converting a page is a near drop-in swap. */
export function CinemaCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-cinema-border bg-cinema-panel/70 shadow-cinema-panel backdrop-blur transition-shadow",
        className,
      )}
      {...props}
    />
  );
}

export function CinemaCardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-cinema-border p-4", className)} {...props} />;
}

export function CinemaCardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-lg font-extrabold text-cinema-white", className)} {...props} />;
}

export function CinemaCardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
