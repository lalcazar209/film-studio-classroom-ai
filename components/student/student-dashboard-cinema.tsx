"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clapperboard, Award, Users, MessageCircle, Film, Wand2 } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants/project-categories";
import type { ProjectCategory } from "@prisma/client";

export interface StudentDashboardStats {
  completedProjects: number;
  totalAssignedProjects: number;
  portfolioItemCount: number;
  enrolledClassCount: number;
}

export interface StudentDashboardClassPeriod {
  id: string;
  name: string;
  projects: { id: string; title: string; category: ProjectCategory }[];
}

const QUICK_ACTIONS = [
  { icon: MessageCircle, label: "Ask AI Tutor", href: "/student/dashboard/tutor" },
  { icon: Wand2, label: "View Portfolio", href: "/student/dashboard/portfolio" },
  { icon: Film, label: "Video Academy", href: "/student/dashboard/video-academy" },
];

export function StudentDashboardCinema({
  studentName,
  stats,
  classPeriods,
}: {
  studentName: string;
  stats: StudentDashboardStats;
  classPeriods: StudentDashboardClassPeriod[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-cinema-charcoal p-4 text-cinema-white shadow-cinema-panel sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" aria-hidden />

      <div className="relative space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-cinema-border bg-cinema-panel/70 p-6 shadow-cinema-panel backdrop-blur"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cinema-muted">Welcome back</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{studentName}</h1>
        </motion.section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Projects completed",
              value: stats.completedProjects,
              max: stats.totalAssignedProjects,
              icon: Clapperboard,
              color: "#E1272E",
            },
            {
              label: "Portfolio items",
              value: stats.portfolioItemCount,
              max: Math.max(stats.portfolioItemCount, 1),
              icon: Award,
              color: "#3B82F6",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="flex items-center gap-3 rounded-2xl border border-cinema-border bg-cinema-panel/70 p-4 shadow-cinema-panel backdrop-blur"
            >
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <ProgressRing value={stat.value} max={stat.max} color={stat.color} />
                <stat.icon className="absolute h-5 w-5" style={{ color: stat.color }} aria-hidden />
              </div>
              <div>
                <p className="font-display text-xl font-extrabold">{stat.value}</p>
                <p className="text-xs leading-tight text-cinema-muted">{stat.label}</p>
              </div>
            </motion.div>
          ))}
          {[
            { label: "Classes enrolled", value: stats.enrolledClassCount, icon: Users, color: "#FF8A3D" },
            { label: "Assigned projects", value: stats.totalAssignedProjects, icon: Film, color: "#E1272E" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (i + 2) * 0.06 }}
              whileHover={{ y: -3 }}
              className="flex flex-col justify-center rounded-2xl border border-cinema-border bg-cinema-panel/70 p-4 shadow-cinema-panel backdrop-blur"
            >
              <stat.icon className="h-5 w-5" style={{ color: stat.color }} aria-hidden />
              <p className="mt-2 font-display text-xl font-extrabold">{stat.value}</p>
              <p className="text-xs leading-tight text-cinema-muted">{stat.label}</p>
            </motion.div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-cinema-muted">My projects</h2>
          {classPeriods.length === 0 ? (
            <div className="rounded-2xl border border-cinema-border bg-cinema-panel/70 p-8 text-center text-sm text-cinema-muted backdrop-blur">
              You&apos;re not enrolled in a class period yet. Ask your teacher to add you.
            </div>
          ) : (
            classPeriods.map((classPeriod, i) => (
              <motion.div
                key={classPeriod.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-cinema-border bg-cinema-panel/70 p-5 shadow-cinema-panel backdrop-blur"
              >
                <h3 className="font-display text-base font-bold">{classPeriod.name}</h3>
                {classPeriod.projects.length === 0 ? (
                  <p className="mt-2 text-sm text-cinema-muted">No projects assigned yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {classPeriod.projects.map((project) => (
                      <li key={project.id} className="flex items-center justify-between gap-3 text-sm">
                        <Link
                          href={`/student/projects/${project.id}`}
                          className="text-cinema-white/90 transition-colors hover:text-cinema-red"
                        >
                          {project.title}
                        </Link>
                        <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs font-semibold text-cinema-muted">
                          {PROJECT_CATEGORY_LABELS[project.category]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))
          )}
        </section>

        <section className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.label} href={action.href}>
              <motion.span
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-full border border-cinema-border bg-cinema-panel/80 px-4 py-2.5 text-sm font-semibold text-cinema-white shadow-cinema-panel backdrop-blur transition-colors hover:border-cinema-red/50"
              >
                <action.icon className="h-4 w-4 text-cinema-red" aria-hidden />
                {action.label}
              </motion.span>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
