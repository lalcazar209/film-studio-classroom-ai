import Link from "next/link";
import type { Role } from "@prisma/client";
import { auth, signOut, ROLE_HOME } from "@/lib/auth";
import { cn } from "@/lib/utils/cn";

interface RoleMeta {
  label: string;
  dot: string;
  badge: string;
  avatar: string;
  navItems: { href: string; label: string }[];
}

const ROLE_META: Record<Role, RoleMeta> = {
  TEACHER: {
    label: "Teacher Portal",
    dot: "bg-studio-accent",
    badge: "bg-studio-accent/10 text-studio-accent",
    avatar: "bg-studio-accent",
    navItems: [
      { href: "/teacher/dashboard/project-generator", label: "Generate Project" },
      { href: "/teacher/dashboard/equipment", label: "Equipment" },
      { href: "/teacher/dashboard/video-academy", label: "Video Academy" },
      { href: "/teacher/dashboard/film-studio", label: "AI Film Studio" },
      { href: "/teacher/dashboard/assistants", label: "AI Assistants" },
      { href: "/teacher/dashboard/skillsusa", label: "SkillsUSA" },
      { href: "/teacher/dashboard/analytics", label: "Analytics" },
    ],
  },
  STUDENT: {
    label: "Student Portal",
    dot: "bg-studio-coral",
    badge: "bg-studio-coral/10 text-studio-coral",
    avatar: "bg-studio-coral",
    navItems: [
      { href: "/student/dashboard/tutor", label: "AI Tutor" },
      { href: "/student/dashboard/portfolio", label: "Portfolio" },
      { href: "/student/dashboard/resume", label: "Resume" },
      { href: "/student/dashboard/demo-reel", label: "Demo Reel" },
      { href: "/student/dashboard/video-academy", label: "Video Academy" },
      { href: "/student/dashboard/assistants", label: "AI Assistants" },
      { href: "/student/dashboard/skillsusa", label: "SkillsUSA" },
    ],
  },
  ADMIN: {
    label: "Admin Portal",
    dot: "bg-studio-gold",
    badge: "bg-studio-gold/10 text-studio-gold",
    avatar: "bg-studio-gold",
    navItems: [
      { href: "/admin/dashboard/class-periods", label: "Class Periods" },
      { href: "/admin/dashboard/users", label: "Users" },
      { href: "/admin/dashboard/invites", label: "Invites" },
      { href: "/admin/dashboard/integrations", label: "Integrations" },
      { href: "/admin/dashboard/reports", label: "Reports" },
      { href: "/admin/dashboard/settings", label: "Settings" },
    ],
  },
  PARENT: {
    label: "Family Portal",
    dot: "bg-studio-mint",
    badge: "bg-studio-mint/10 text-studio-mint",
    avatar: "bg-studio-mint",
    navItems: [],
  },
  MENTOR: {
    label: "Mentor Portal",
    dot: "bg-studio-sky",
    badge: "bg-studio-sky/10 text-studio-sky",
    avatar: "bg-studio-sky",
    navItems: [
      { href: "/mentor/dashboard/film-studio", label: "AI Film Studio" },
      { href: "/mentor/dashboard/assistants", label: "AI Assistants" },
    ],
  },
};

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export async function PortalShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const session = await auth();
  const meta = ROLE_META[role];
  const name = session?.user?.name ?? session?.user?.email ?? "Account";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-studio-ink/[0.06] bg-white/80 backdrop-blur dark:border-white/10 dark:bg-studio-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <Link
            href={ROLE_HOME[role]}
            className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight"
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} aria-hidden />
            Film Studio Classroom
          </Link>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", meta.badge)}>{meta.label}</span>

          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {meta.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-studio-ink/70 transition-colors hover:bg-studio-ink/5 hover:text-studio-ink dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 text-sm font-medium text-studio-ink/70 dark:text-white/70 sm:flex">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white",
                  meta.avatar,
                )}
              >
                {initial}
              </span>
              {name}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-studio-ink/60 transition-colors hover:bg-studio-ink/5 hover:text-studio-ink dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
