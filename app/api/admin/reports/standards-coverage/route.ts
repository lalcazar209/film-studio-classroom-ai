import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateStandardsCoverageCsv } from "@/lib/reports";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can export reports" }, { status: 403 });
  }
  if (!session.user.organizationId) {
    return NextResponse.json({ error: "You must belong to an organization" }, { status: 400 });
  }

  const csv = await generateStandardsCoverageCsv(session.user.organizationId);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="standards-coverage.csv"',
    },
  });
}
