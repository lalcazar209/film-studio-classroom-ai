import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createSignedUploadParams, CloudinaryError } from "@/lib/integrations/cloudinary";
import { logger } from "@/lib/logger";

const requestSchema = z.object({ submissionId: z.string().cuid() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const params = createSignedUploadParams({
      folder: `submissions/${session.user.id}`,
      publicId: `${parsed.data.submissionId}-${Date.now()}`,
    });
    return NextResponse.json(params);
  } catch (error) {
    if (error instanceof CloudinaryError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    logger.error("Upload signing failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
