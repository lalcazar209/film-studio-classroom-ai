import { randomBytes } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { request } from "@playwright/test";

/**
 * Signs in as the seeded demo teacher without touching the real Google OAuth
 * flow: Auth.js's database session strategy only requires a valid Session
 * row plus a matching `authjs.session-token` cookie, so we create that row
 * directly (same mechanism NextAuth itself uses after a real OAuth
 * callback) and persist it as Playwright storage state for every e2e test.
 */
export default async function globalSetup() {
  const db = new PrismaClient();
  const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

  const teacher = await db.user.findUniqueOrThrow({
    where: { email: "teacher@demo.filmstudioclassroom.ai" },
  });

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await db.session.create({
    data: { sessionToken, userId: teacher.id, expires },
  });
  await db.$disconnect();

  const context = await request.newContext();
  await context.storageState({ path: path.join(__dirname, ".auth/teacher-storage-state.json") });
  await context.dispose();

  const fs = await import("node:fs/promises");
  const storageStatePath = path.join(__dirname, ".auth/teacher-storage-state.json");
  const state = JSON.parse(await fs.readFile(storageStatePath, "utf-8"));
  const url = new URL(baseURL);
  state.cookies.push({
    name: "authjs.session-token",
    value: sessionToken,
    domain: url.hostname,
    path: "/",
    expires: Math.floor(expires.getTime() / 1000),
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });
  await fs.writeFile(storageStatePath, JSON.stringify(state, null, 2));
  await fs.writeFile(path.join(__dirname, ".auth/session-token.json"), JSON.stringify({ sessionToken }));
}
