import { signIn, enabledAuthProviders } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-display text-2xl font-bold">Sign in</h1>
      {enabledAuthProviders.map((provider) => (
        <form
          key={provider.id}
          action={async () => {
            "use server";
            const { callbackUrl } = await searchParams;
            await signIn(provider.id, { redirectTo: callbackUrl ?? "/" });
          }}
        >
          <Button type="submit" variant="secondary">
            Continue with {provider.name}
          </Button>
        </form>
      ))}
    </main>
  );
}
