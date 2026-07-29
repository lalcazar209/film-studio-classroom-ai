import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="font-display text-2xl font-bold">Sign in</h1>
      <form
        action={async () => {
          "use server";
          const { callbackUrl } = await searchParams;
          await signIn("google", { redirectTo: callbackUrl ?? "/" });
        }}
      >
        <Button type="submit">Continue with Google</Button>
      </form>
    </main>
  );
}
