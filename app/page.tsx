import Link from "next/link";
import { auth, ROLE_HOME } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const PORTALS = [
  { label: "Teachers", className: "bg-studio-accent/10 text-studio-accent" },
  { label: "Students", className: "bg-studio-coral/10 text-studio-coral" },
  { label: "Admins", className: "bg-studio-gold/10 text-studio-gold" },
  { label: "Parents", className: "bg-studio-mint/10 text-studio-mint" },
  { label: "Mentors", className: "bg-studio-sky/10 text-studio-sky" },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.organizationId ? ROLE_HOME[session.user.role] : "/onboarding");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-studio-accent text-3xl shadow-glow">
        🎬
      </span>
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-studio-accent">
        Film Studio Classroom AI
      </p>
      <h1 className="font-display text-4xl font-extrabold sm:text-6xl">
        The Complete Educational Operating System
        <br /> for Film &amp; Television Production
      </h1>
      <p className="max-w-xl text-studio-ink/60 dark:text-white/60">
        Generate a project once — get standards-aligned lessons, rubrics, quizzes,
        storyboards, and production plans for the whole week, automatically.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {PORTALS.map((portal) => (
          <span
            key={portal.label}
            className={`rounded-full px-3 py-1 text-xs font-bold ${portal.className}`}
          >
            {portal.label}
          </span>
        ))}
      </div>

      <Link href="/login">
        <Button className="px-8 py-3 text-base">Sign in to get started</Button>
      </Link>
    </main>
  );
}
