import { signIn, enabledAuthProviders } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.1c.95-2.85 3.6-4.96 6.73-4.96Z"
      />
    </svg>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-studio-accent text-2xl font-extrabold text-white shadow-glow">
          🎬
        </span>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-studio-accent">
          Film Studio Classroom
        </p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Welcome back</h1>
        <p className="max-w-sm text-sm text-studio-ink/60 dark:text-white/60">
          Sign in to generate projects, review student work, and run your classroom&apos;s whole
          production pipeline.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-studio-ink/[0.06] bg-white p-6 shadow-soft dark:border-white/10 dark:bg-studio-900">
        <div className="flex flex-col gap-3">
          {enabledAuthProviders.map((provider) => (
            <form
              key={provider.id}
              action={async () => {
                "use server";
                const { callbackUrl } = await searchParams;
                await signIn(provider.id, { redirectTo: callbackUrl ?? "/" });
              }}
            >
              <Button type="submit" variant="secondary" className="w-full gap-3">
                {provider.id === "google" && <GoogleIcon />}
                Continue with {provider.name}
              </Button>
            </form>
          ))}
        </div>
      </div>

      <p className="text-xs text-studio-ink/40 dark:text-white/40">
        New here? Signing in creates your account automatically — an admin invite links you to
        your school.
      </p>
    </main>
  );
}
