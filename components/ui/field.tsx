import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-xl border border-studio-ink/10 bg-white px-3.5 py-2.5 text-sm text-studio-ink " +
  "placeholder:text-studio-ink/35 transition-shadow focus:border-studio-accent focus:outline-none focus:ring-2 focus:ring-studio-accent/30 " +
  "dark:border-white/15 dark:bg-studio-900 dark:text-white dark:placeholder:text-white/40";

/**
 * Cinema pages need a fully separate base class string, not fieldBase plus
 * an appended override — lib/utils/cn() is a plain clsx-equivalent with no
 * tailwind-merge, so appending conflicting utilities (e.g. bg-cinema-black
 * after bg-white) doesn't reliably win; precedence depends on unpredictable
 * generated-CSS source order, not className string order (caught this via
 * screenshot during the Student portal migration — the fix there was `!`
 * prefixes; centralizing a full alternate base string here instead so every
 * later caller gets it right by default).
 */
const fieldCinema =
  "w-full rounded-xl border border-cinema-border bg-cinema-black/40 px-3.5 py-2.5 text-sm text-cinema-white " +
  "placeholder:text-cinema-muted transition-shadow focus:border-cinema-red focus:outline-none focus:ring-2 focus:ring-cinema-red/30";

type Theme = "default" | "cinema";

export function Label({
  className,
  theme = "default",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { theme?: Theme }) {
  return (
    <label
      className={cn("mb-1 block text-sm font-semibold", theme === "cinema" && "text-cinema-white", className)}
      {...props}
    />
  );
}

export function Input({
  className,
  theme = "default",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { theme?: Theme }) {
  return <input className={cn(theme === "cinema" ? fieldCinema : fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  theme = "default",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { theme?: Theme }) {
  return (
    <textarea className={cn(theme === "cinema" ? fieldCinema : fieldBase, "min-h-28 resize-y", className)} {...props} />
  );
}

export function Select({
  className,
  theme = "default",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { theme?: Theme }) {
  return <select className={cn(theme === "cinema" ? fieldCinema : fieldBase, className)} {...props} />;
}
