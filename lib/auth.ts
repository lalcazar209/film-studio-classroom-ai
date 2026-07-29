import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string | null;
      isActive: boolean;
    } & DefaultSession["user"];
  }
}

const providers: NonNullable<NextAuthConfig["providers"]> = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Google Workspace for Education accounts only, when configured.
    authorization: { params: { hd: process.env.GOOGLE_WORKSPACE_DOMAIN, prompt: "select_account" } },
  }),
];
const providerMeta: { id: string; name: string }[] = [{ id: "google", name: "Google" }];

// Microsoft 365 / Entra ID and Apple are optional per deployment — a school
// running purely on Google Workspace for Education shouldn't need to
// configure credentials for providers it will never use.
if (process.env.MICROSOFT_ENTRA_ID_CLIENT_ID && process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET,
      issuer: process.env.MICROSOFT_ENTRA_ID_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`
        : undefined,
    }),
  );
  providerMeta.push({ id: "microsoft-entra-id", name: "Microsoft" });
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
  );
  providerMeta.push({ id: "apple", name: "Apple" });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true, organizationId: true, isActive: true },
      });
      session.user.role = dbUser?.role ?? "STUDENT";
      session.user.organizationId = dbUser?.organizationId ?? null;
      session.user.isActive = dbUser?.isActive ?? true;
      return session;
    },
  },
});

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  ADMIN: "/admin/dashboard",
  PARENT: "/parent/dashboard",
  MENTOR: "/mentor/dashboard",
};

/** Providers actually configured for this deployment, for rendering sign-in buttons. */
export const enabledAuthProviders = providerMeta;
