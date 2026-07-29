import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-studio-gold/10 text-2xl">
        🔒
      </span>
      <h1 className="font-display text-2xl font-extrabold">Not authorized</h1>
      <p className="text-studio-ink/60 dark:text-white/60">
        Your account role doesn&apos;t have access to this page.
      </p>
      <Link href="/" className="font-semibold text-studio-accent hover:underline">
        Return home
      </Link>
    </main>
  );
}
