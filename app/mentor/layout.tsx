import { PortalShell } from "@/components/portal-shell";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="MENTOR">{children}</PortalShell>;
}
