import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-2xl font-bold">Not authorized</h1>
      <p className="text-black/60 dark:text-white/60">
        Your account role doesn&apos;t have access to this page.
      </p>
      <Link href="/" className="text-studio-accent underline">
        Return home
      </Link>
    </main>
  );
}
