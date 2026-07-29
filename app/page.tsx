import Link from "next/link";
import { auth, ROLE_HOME } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.organizationId ? ROLE_HOME[session.user.role] : "/onboarding");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-studio-accent">
        Film Studio Classroom AI
      </p>
      <h1 className="font-display text-4xl font-bold sm:text-6xl">
        The Complete Educational Operating System
        <br /> for Film &amp; Television Production
      </h1>
      <p className="max-w-xl text-black/60 dark:text-white/60">
        Generate a project once — get standards-aligned lessons, rubrics, quizzes,
        storyboards, and production plans for the whole week, automatically.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-studio-accent px-6 py-3 font-medium text-white hover:bg-studio-accent/90"
      >
        Sign in to get started
      </Link>
    </main>
  );
}
