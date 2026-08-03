import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OAUTH_PROVIDERS, isOAuthProvider } from "@/lib/integrations/oauth-config";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  if (!session.user.organizationId) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ error: `"${provider}" does not support OAuth connect` }, { status: 400 });
  }

  const config = OAUTH_PROVIDERS[provider]!;
  if (!config.isConfigured()) {
    const url = new URL("/admin/dashboard/integrations", request.url);
    url.searchParams.set("error", `${provider}_not_configured`);
    return NextResponse.redirect(url);
  }

  const redirectUri = new URL(`/api/integrations/${provider}/callback`, request.url).toString();
  const state = randomBytes(16).toString("hex");
  const authorizeUrl = config.buildAuthorizeUrl({ redirectUri, state });
  if (!authorizeUrl) {
    const url = new URL("/admin/dashboard/integrations", request.url);
    url.searchParams.set("error", `${provider}_not_configured`);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
