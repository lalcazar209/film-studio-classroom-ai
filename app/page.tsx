import { auth, ROLE_HOME } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingHero } from "@/components/marketing/landing-hero";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.organizationId ? ROLE_HOME[session.user.role] : "/onboarding");
  }

  return <LandingHero />;
}
