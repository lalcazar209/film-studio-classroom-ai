import { cn } from "@/lib/utils/cn";

/**
 * Shared page-level shell for the Student Portal's cinematic pages — the
 * large dark panel + ambient glow used first on the dashboard
 * (components/student/student-dashboard-cinema.tsx), extracted here so
 * every subsequent page shares one implementation instead of re-writing
 * the same wrapper classes.
 */
export function CinemaPage({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-cinema-charcoal p-4 text-cinema-white shadow-cinema-panel sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" aria-hidden />
      <div className={cn("relative space-y-6", className)}>
        <header>
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cinema-muted">{eyebrow}</p>
          )}
          <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-cinema-muted">{description}</p>}
        </header>
        {children}
      </div>
    </div>
  );
}
