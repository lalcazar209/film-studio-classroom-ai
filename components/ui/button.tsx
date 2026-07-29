import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

const VARIANTS = {
  primary:
    "bg-studio-accent text-white shadow-soft hover:bg-studio-accent/90 hover:-translate-y-0.5 hover:shadow-glow focus-visible:ring-studio-accent",
  secondary:
    "bg-studio-accent/10 text-studio-accent hover:bg-studio-accent/15 hover:-translate-y-0.5 focus-visible:ring-studio-accent dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
  ghost:
    "bg-transparent text-current hover:bg-studio-ink/5 dark:hover:bg-white/10",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
        "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {isLoading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
