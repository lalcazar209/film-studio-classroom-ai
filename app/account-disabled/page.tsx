export default function AccountDisabledPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-studio-coral/10 text-2xl">
        ⏸️
      </span>
      <h1 className="font-display text-2xl font-bold">Account disabled</h1>
      <p className="text-studio-ink/60 dark:text-white/60">
        Your account has been deactivated. Contact your school administrator if you believe this
        is a mistake.
      </p>
    </main>
  );
}
