import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string | null;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Google Workspace for Education accounts only, when configured.
      authorization: { params: { hd: process.env.GOOGLE_WORKSPACE_DOMAIN, prompt: "select_account" } },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true, organizationId: true },
      });
      session.user.role = dbUser?.role ?? "STUDENT";
      session.user.organizationId = dbUser?.organizationId ?? null;
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
