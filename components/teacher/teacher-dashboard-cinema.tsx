"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, FolderKanban, ClipboardCheck, Layers, Wand2, Clapperboard } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants/project-categories";
import type { ProjectCategory } from "@prisma/client";

export interface TeacherDashboardStats {
  classPeriodCount: number;
  totalStudents: number;
  totalProjects: number;
  pendingReviews: number;
}

export interface TeacherDashboardClassPeriod {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
  projects: { id: string; title: string; category: ProjectCategory; status: string }[];
}

const QUICK_ACTIONS = [
  { icon: Wand2, label: "Generate Project", href: "/teacher/dashboard/project-generator" },
  { icon: Clapperboard, label: "AI Film Studio", href: "/teacher/dashboard/film-studio" },
];

export function TeacherDashboardCinema({
  teacherName,
  stats,
  classPeriods,
}: {
  teacherName: string;
  stats: TeacherDashboardStats;
  classPeriods: TeacherDashboardClassPeriod[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-cinema-charcoal p-4 text-cinema-white shadow-cinema-panel sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" aria-hidden />

      <div className="relative space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-cinema-border bg-cinema-panel/70 p-6 shadow-cinema-panel backdrop-blur"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cinema-muted">Welcome back</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{teacherName}</h1>
          </div>
          <Link href="/teacher/dashboard/project-generator">
            <Button variant="cinema">+ Generate New Project</Button>
          </Link>
        </motion.section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Pending reviews",
              value: stats.pendingReviews,
              max: Math.max(stats.pendingReviews, 1),
              icon: ClipboardCheck,
              color: "#E1272E",
            },
            {
              label: "Projects generated",
              value: stats.totalProjects,
              max: Math.max(stats.totalProjects, 1),
              icon: FolderKanban,
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
            { label: "Class periods", value: stats.classPeriodCount, icon: Layers, color: "#FF8A3D" },
            { label: "Students", value: stats.totalStudents, icon: Users, color: "#E1272E" },
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
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-cinema-muted">Your classes</h2>
          {classPeriods.length === 0 ? (
            <div className="rounded-2xl border border-cinema-border bg-cinema-panel/70 p-8 text-center text-sm text-cinema-muted backdrop-blur">
              No class periods yet. Set one up to start generating projects.
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold">
                    {classPeriod.name} · Grade {classPeriod.gradeLevel} · {classPeriod.studentCount} students
                  </h3>
                  <div className="flex gap-3">
                    <Link
                      href={`/teacher/dashboard/attendance/${classPeriod.id}`}
                      className="text-xs text-cinema-red hover:underline"
                    >
                      Attendance
                    </Link>
                    <Link
                      href={`/teacher/dashboard/gradebook/${classPeriod.id}`}
                      className="text-xs text-cinema-red hover:underline"
                    >
                      Gradebook
                    </Link>
                    <Link
                      href={`/teacher/dashboard/messages/${classPeriod.id}`}
                      className="text-xs text-cinema-red hover:underline"
                    >
                      Message Parents
                    </Link>
                  </div>
                </div>
                {classPeriod.projects.length === 0 ? (
                  <p className="mt-2 text-sm text-cinema-muted">No projects generated yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {classPeriod.projects.map((project) => (
                      <li key={project.id} className="flex items-center justify-between gap-3 text-sm">
                        <Link
                          href={`/teacher/projects/${project.id}`}
                          className="text-cinema-white/90 transition-colors hover:text-cinema-red"
                        >
                          {project.title}
                        </Link>
                        <span className="flex shrink-0 items-center gap-2 text-xs text-cinema-muted">
                          <span className="rounded-full bg-white/5 px-2 py-0.5 font-semibold">
                            {PROJECT_CATEGORY_LABELS[project.category]}
                          </span>
                          {project.status}
                          <Link href={`/teacher/projects/${project.id}/edit`} className="text-cinema-red hover:underline">
                            Edit
                          </Link>
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
