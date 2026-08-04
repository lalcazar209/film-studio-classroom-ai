"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Clapperboard, Sparkles, GraduationCap, Award, Users, Film, Radio } from "lucide-react";

const PORTALS = [
  { label: "Teachers", icon: Clapperboard },
  { label: "Students", icon: GraduationCap },
  { label: "Admins", icon: Users },
  { label: "Parents", icon: Award },
  { label: "Mentors", icon: Radio },
];

const PILLARS = [
  {
    icon: Sparkles,
    title: "AI Curriculum",
    description: "One brief becomes a full Monday–Friday production week — lessons, rubrics, quizzes, standards-aligned automatically.",
    accent: "text-cinema-red",
    glow: "hover:shadow-cinema-glow",
  },
  {
    icon: Camera,
    title: "Storyboards & Production",
    description: "Shot lists, call sheets, budgets, and AI-generated storyboard reference frames for every production.",
    accent: "text-cinema-blue",
    glow: "hover:shadow-cinema-blue-glow",
  },
  {
    icon: Film,
    title: "Video Academy",
    description: "Narrated, AI-voiced tutorials that walk students through every technique, segment by segment.",
    accent: "text-cinema-orange",
    glow: "hover:shadow-cinema-glow",
  },
  {
    icon: Award,
    title: "Portfolio & Career",
    description: "Every finished project builds a real portfolio and an industry-credible resume, automatically.",
    accent: "text-cinema-blue",
    glow: "hover:shadow-cinema-blue-glow",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function LandingHero() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-cinema-charcoal text-cinema-white">
      {/* Ambient glow field */}
      <div className="pointer-events-none absolute inset-0 bg-cinema-radial" aria-hidden />
      <motion.div
        className="pointer-events-none absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-cinema-red/10 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -bottom-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-cinema-blue/10 blur-3xl"
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-4 py-20 text-center">
        <motion.span
          initial="hidden"
          animate="show"
          custom={0}
          variants={fadeUp}
          className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cinema-border bg-cinema-panel shadow-cinema-panel"
        >
          <Clapperboard className="h-8 w-8 text-cinema-red" strokeWidth={1.75} aria-hidden />
        </motion.span>

        <motion.p
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="text-xs font-bold uppercase tracking-[0.35em] text-cinema-muted"
        >
          Film Studio Classroom AI
        </motion.p>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl"
        >
          The Educational Operating System
          <br />
          for{" "}
          <span className="bg-gradient-to-r from-cinema-red via-cinema-orange to-cinema-blue bg-clip-text text-transparent">
            Film &amp; Television Production
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="max-w-xl text-balance text-base text-cinema-muted sm:text-lg"
        >
          Generate a project once — get standards-aligned lessons, rubrics, quizzes,
          storyboards, and production plans for the whole week, automatically.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          custom={4}
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {PORTALS.map((portal) => (
            <span
              key={portal.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-panel/80 px-3 py-1.5 text-xs font-semibold text-cinema-muted backdrop-blur"
            >
              <portal.icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {portal.label}
            </span>
          ))}
        </motion.div>

        <motion.div initial="hidden" animate="show" custom={5} variants={fadeUp}>
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-cinema-red px-8 py-3.5 text-base font-bold text-cinema-white shadow-cinema-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-cinema-red/90"
          >
            Sign in to get started
            <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
              →
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          custom={6}
          variants={fadeUp}
          className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {PILLARS.map((pillar) => (
            <motion.div
              key={pillar.title}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`rounded-2xl border border-cinema-border bg-cinema-panel/60 p-5 text-left shadow-cinema-panel backdrop-blur transition-shadow duration-300 ${pillar.glow}`}
            >
              <pillar.icon className={`h-6 w-6 ${pillar.accent}`} strokeWidth={1.75} aria-hidden />
              <h3 className="mt-3 font-display text-base font-bold text-cinema-white">{pillar.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cinema-muted">{pillar.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
