"use client";

import { motion } from "framer-motion";
import {
  Clapperboard,
  Sparkles,
  Camera,
  Film,
  Award,
  Flame,
  Bell,
  Clock,
  Wand2,
  MessageCircle,
  Scissors,
  Mic,
} from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";

/**
 * Standalone design preview — NOT wired to real auth or data. Demonstrates
 * the "mission control" dashboard direction from the cinematic redesign
 * brief for review before any real page (or the shared PortalShell nav
 * every portal uses) is touched. All numbers/names below are mock content.
 */

const STATS = [
  { label: "Projects completed", value: 12, max: 20, icon: Clapperboard, color: "#E1272E" },
  { label: "Portfolio items", value: 8, max: 12, icon: Award, color: "#3B82F6" },
  { label: "Skill badges earned", value: 6, max: 10, icon: Sparkles, color: "#FF8A3D" },
  { label: "Day streak", value: 14, max: 30, icon: Flame, color: "#E1272E" },
];

const WEEK = [
  { day: "MON", label: "Launch", done: true },
  { day: "TUE", label: "Pre-Production", done: true },
  { day: "WED", label: "Production", done: true },
  { day: "THU", label: "Editing", done: false, current: true },
  { day: "FRI", label: "Showcase", done: false },
];

const BADGES = [
  { icon: Camera, label: "Camera Operator" },
  { icon: Film, label: "Storyteller" },
  { icon: Scissors, label: "Editor" },
  { icon: Mic, label: "Sound Designer" },
];

const ACTIVITY = [
  { text: "Ms. Rivera left feedback on your Demo Reel", time: "2h ago" },
  { text: "New assignment: \"30-Second PSA\" was posted", time: "5h ago" },
  { text: "You earned the Editor badge", time: "1d ago" },
];

const DEADLINES = [
  { text: "Showcase presentation", time: "Fri, 2:00 PM" },
  { text: "Peer review — Camera Angles project", time: "Tomorrow" },
];

const QUICK_ACTIONS = [
  { icon: MessageCircle, label: "Ask AI Tutor" },
  { icon: Wand2, label: "Generate Storyboard" },
  { icon: Film, label: "Review My Demo Reel" },
];

export function MissionControlPreview() {
  return (
    <div className="min-h-screen bg-cinema-charcoal text-cinema-white">
      <div className="pointer-events-none fixed inset-0 bg-cinema-radial" aria-hidden />

      {/* Preview-only header — not the shared PortalShell */}
      <header className="relative border-b border-cinema-border bg-cinema-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cinema-panel">
            <Clapperboard className="h-4 w-4 text-cinema-red" aria-hidden />
          </span>
          <span className="font-display text-sm font-bold">Film Studio Classroom</span>
          <span className="rounded-full bg-cinema-red/15 px-2.5 py-1 text-xs font-bold text-cinema-red">
            Student Portal
          </span>
          <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
            Level 7 · 2,140 XP
          </span>
          <Bell className="h-4 w-4 text-cinema-muted" aria-hidden />
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cinema-red text-xs font-bold">
            J
          </span>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Greeting + XP */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-cinema-border bg-cinema-panel/70 p-6 shadow-cinema-panel backdrop-blur"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cinema-muted">Welcome back</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Jordan Reyes</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-cinema-border">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cinema-red to-cinema-orange"
                initial={{ width: 0 }}
                animate={{ width: "68%" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="whitespace-nowrap text-xs font-semibold text-cinema-muted">860 XP to Level 8</span>
          </div>
        </motion.section>

        {/* Stat tiles */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((stat, i) => (
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
        </section>

        {/* Weekly production timeline */}
        <section className="rounded-2xl border border-cinema-border bg-cinema-panel/70 p-5 shadow-cinema-panel backdrop-blur">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-cinema-muted">
            This week&apos;s production cycle
          </h2>
          <div className="mt-4 flex items-center gap-2">
            {WEEK.map((day, i) => (
              <div key={day.day} className="flex flex-1 items-center gap-2">
                <div className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold ${
                      day.done
                        ? "border-cinema-red bg-cinema-red text-white"
                        : day.current
                          ? "border-cinema-red bg-cinema-panel text-cinema-red shadow-cinema-glow"
                          : "border-cinema-border bg-cinema-panel text-cinema-muted"
                    }`}
                  >
                    {day.day}
                  </motion.div>
                  <span className="text-center text-[11px] text-cinema-muted">{day.label}</span>
                </div>
                {i < WEEK.length - 1 && <div className="h-px flex-1 bg-cinema-border" />}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Achievements */}
          <section className="rounded-2xl border border-cinema-border bg-cinema-panel/70 p-5 shadow-cinema-panel backdrop-blur">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-cinema-muted">Achievements</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-black/40 px-3 py-2.5"
                >
                  <badge.icon className="h-4 w-4 text-cinema-orange" aria-hidden />
                  <span className="text-xs font-semibold">{badge.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Activity + deadlines */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-cinema-border bg-cinema-panel/70 p-5 shadow-cinema-panel backdrop-blur">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-cinema-muted">Recent activity</h2>
              <ul className="mt-3 space-y-3">
                {ACTIVITY.map((item) => (
                  <li key={item.text} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-cinema-white/90">{item.text}</span>
                    <span className="shrink-0 text-xs text-cinema-muted">{item.time}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-cinema-border bg-cinema-panel/70 p-5 shadow-cinema-panel backdrop-blur">
              <h2 className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-cinema-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden /> Upcoming deadlines
              </h2>
              <ul className="mt-3 space-y-3">
                {DEADLINES.map((item) => (
                  <li key={item.text} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-cinema-white/90">{item.text}</span>
                    <span className="shrink-0 rounded-full bg-cinema-red/15 px-2 py-0.5 text-xs font-bold text-cinema-red">
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Quick AI actions */}
        <section className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full border border-cinema-border bg-cinema-panel/80 px-4 py-2.5 text-sm font-semibold text-cinema-white shadow-cinema-panel backdrop-blur transition-colors hover:border-cinema-red/50"
            >
              <action.icon className="h-4 w-4 text-cinema-red" aria-hidden />
              {action.label}
            </motion.button>
          ))}
        </section>
      </main>
    </div>
  );
}
