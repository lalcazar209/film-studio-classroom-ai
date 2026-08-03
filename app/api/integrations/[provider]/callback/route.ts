import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OAUTH_PROVIDERS, isOAuthProvider } from "@/lib/integrations/oauth-config";
import { exchangeAuthCodeForProvider } from "@/lib/integrations/exchange";
import { logger } from "@/lib/logger";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const integrationsUrl = new URL("/admin/dashboard/integrations", request.url);

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN" || !session.user.organizationId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!isOAuthProvider(provider)) {
    integrationsUrl.searchParams.set("error", "unknown_provider");
    return NextResponse.redirect(integrationsUrl);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`oauth_state_${provider}=`))
    ?.split("=")[1];

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    integrationsUrl.searchParams.set("error", `${provider}_state_mismatch`);
    return NextResponse.redirect(integrationsUrl);
  }

  const redirectUri = new URL(`/api/integrations/${provider}/callback`, request.url).toString();

  try {
    const credentials = await exchangeAuthCodeForProvider(provider, code, redirectUri);

    await db.integrationConnection.upsert({
      where: { organizationId_provider: { organizationId: session.user.organizationId, provider } },
      update: {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt,
        scopes: OAUTH_PROVIDERS[provider]?.scopes ?? [],
      },
      create: {
        organizationId: session.user.organizationId,
        provider,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt,
        scopes: OAUTH_PROVIDERS[provider]?.scopes ?? [],
      },
    });

    integrationsUrl.searchParams.set("connected", provider);
  } catch (error) {
    logger.error(`OAuth callback failed for ${provider}`, error);
    integrationsUrl.searchParams.set("error", `${provider}_exchange_failed`);
  }

  const response = NextResponse.redirect(integrationsUrl);
  response.cookies.delete(`oauth_state_${provider}`);
  return response;
}
