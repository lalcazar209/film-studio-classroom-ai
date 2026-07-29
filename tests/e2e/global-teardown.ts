import path from "node:path";
import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

export default async function globalTeardown() {
  const tokenPath = path.join(__dirname, ".auth/session-token.json");
  const raw = await fs.readFile(tokenPath, "utf-8").catch(() => null);
  if (!raw) return;

  const { sessionToken } = JSON.parse(raw) as { sessionToken: string };
  const db = new PrismaClient();
  await db.session.deleteMany({ where: { sessionToken } });
  await db.$disconnect();
  await fs.rm(tokenPath, { force: true });
}
