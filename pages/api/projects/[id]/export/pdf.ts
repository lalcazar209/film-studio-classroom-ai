import type { NextApiRequest, NextApiResponse } from "next";
import { getPagesSession } from "@/lib/pages-session";
import { db } from "@/lib/db";
import { renderProjectPdf } from "@/lib/export/project-pdf";
import { slugify } from "@/lib/utils/slugify";
import { logger } from "@/lib/logger";

/**
 * Deliberately a Pages Router API route, not an App Router route handler.
 * Next 15's App Router compiles everything under app/ (including route
 * handlers) through its own internally-vendored React build
 * (next/dist/compiled/react), which tags elements with the newer
 * "react.transitional.element" marker regardless of the react version
 * declared in package.json. @react-pdf/renderer's bundled reconciler
 * expects the classic "react.element" marker that plain node_modules/react
 * actually produces, so rendering a PDF from an App Router route handler
 * throws "Minified React error #31" deep inside the reconciler — verified
 * by the fact that the exact same renderProjectPdf() call succeeds under
 * plain Node and fails identically regardless of react-pdf version or
 * webpack bundling config. Pages Router API routes aren't part of that
 * React Server Components compilation graph, so they use the plain,
 * declared React version and this mismatch doesn't happen.
 *
 * Auth uses getPagesSession() instead of next-auth's auth() helper — see
 * lib/pages-session.ts for why (next-auth unconditionally imports
 * next/server, which breaks when loaded from a Pages Router file).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const id = req.query.id;
  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const session = await getPagesSession(req);
  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const project = await db.project.findUnique({
    where: { id },
    include: {
      classPeriod: true,
      lessons: { include: { standards: { include: { standard: true } } } },
      rubric: true,
      quiz: true,
      vocabulary: true,
      storyboard: true,
    },
  });
  if (!project) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (project.classPeriod.teacherId !== session.user.id && session.user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const pdfBuffer = await renderProjectPdf(project);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${slugify(project.title)}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    logger.error("Project PDF export failed", error);
    res.status(500).json({ error: "PDF export failed." });
  }
}
