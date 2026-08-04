import type { NextApiRequest } from "next";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

/**
 * Session lookup for Pages Router API routes, deliberately independent of
 * next-auth's `auth()` helper (see pages/api/projects/[id]/export/pdf.ts
 * for why that route can't be an App Router route handler). next-auth's
 * package unconditionally imports `next/server` at module load time
 * (lib/env.js), which isn't resolvable from a Pages Router file in dev —
 * so this reads the same database session next-auth's "database" strategy
 * uses (see lib/auth.ts's `session: { strategy: "database" }`) directly,
 * mirroring exactly what Auth.js does internally: look up the cookie name
 * it sets (secure-prefixed only over HTTPS) against the Session table.
 */

const SESSION_COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"];

export interface PagesSessionUser {
  id: string;
  role: Role;
  organizationId: string | null;
  isActive: boolean;
}

export async function getPagesSession(req: NextApiRequest): Promise<{ user: PagesSessionUser } | null> {
  const sessionToken = SESSION_COOKIE_NAMES.map((name) => req.cookies[name]).find((value) => value);
  if (!sessionToken) return null;

  const session = await db.session.findUnique({
    where: { sessionToken },
    include: { user: { select: { id: true, role: true, organizationId: true, isActive: true } } },
  });
  if (!session || session.expires < new Date()) return null;

  return { user: session.user };
}
