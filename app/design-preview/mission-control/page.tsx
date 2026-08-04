import type { Metadata } from "next";
import { MissionControlPreview } from "@/components/marketing/mission-control-preview";

/**
 * Unauthenticated, mock-data design preview of the "mission control"
 * dashboard direction — not linked from any real nav. Delete this route
 * (and components/marketing/mission-control-preview.tsx) once the
 * direction is approved and rolled into the real, auth-gated dashboards.
 */

export const metadata: Metadata = {
  title: "Design Preview — Mission Control",
  robots: { index: false, follow: false },
};

export default function MissionControlPreviewPage() {
  return <MissionControlPreview />;
}
