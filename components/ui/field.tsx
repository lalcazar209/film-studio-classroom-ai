import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-xl border border-studio-ink/10 bg-white px-3.5 py-2.5 text-sm text-studio-ink " +
  "placeholder:text-studio-ink/35 transition-shadow focus:border-studio-accent focus:outline-none focus:ring-2 focus:ring-studio-accent/30 " +
  "dark:border-white/15 dark:bg-studio-900 dark:text-white dark:placeholder:text-white/40";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-semibold", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, className)} {...props} />;
}
