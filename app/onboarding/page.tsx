import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizationForm } from "@/components/create-organization-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/onboarding");
  if (session.user.organizationId) redirect("/");

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Welcome to Film Studio Classroom AI</h1>
        <p className="mt-1 text-studio-ink/60 dark:text-white/60">
          You&apos;re not part of a school yet. Set one up, or ask your admin or teacher for an
          invite link if you were expecting one.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set up a new school</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </main>
  );
}
