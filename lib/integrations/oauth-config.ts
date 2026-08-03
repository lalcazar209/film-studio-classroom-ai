import type { IntegrationProviderType } from "@prisma/client";

/**
 * Per-provider OAuth authorize-URL construction for the "Connect" buttons
 * on /admin/dashboard/integrations. Token exchange itself is handled by
 * each provider's own adapter (exchangeAuthCode) — this module only knows
 * how to build the redirect to the provider's consent screen, since that
 * step isn't part of the IntegrationAdapter/VideoHostAdapter contracts
 * (those start from an already-issued auth code).
 */

export interface OAuthProviderConfig {
  /** Human label shown in the admin UI. */
  label: string;
  /** Scopes requested — stored on IntegrationConnection.scopes for display/audit. */
  scopes: string[];
  /** Builds the full authorize URL the browser should be redirected to. */
  buildAuthorizeUrl(params: { redirectUri: string; state: string }): string | null;
  /** True if this provider is missing required env/config and can't be connected yet. */
  isConfigured(): boolean;
}

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

function googleAuthorizeUrl(scopes: string[]) {
  return ({ redirectUri, state }: { redirectUri: string; state: string }) => {
    if (!process.env.GOOGLE_CLIENT_ID) return null;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
  };
}

const GOOGLE_CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  // Roster reads only return each student's userId/name without this —
  // needed since roster reconciliation (lib/roster-sync.ts) matches
  // students to User rows by email.
  "https://www.googleapis.com/auth/classroom.profile.emails",
  "https://www.googleapis.com/auth/classroom.coursework.students",
];
const GOOGLE_WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
];
const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const BLACKBOARD_SCOPES = ["read", "write"];
const VIMEO_SCOPES = ["public", "private", "upload", "edit"];

export const OAUTH_PROVIDERS: Partial<Record<IntegrationProviderType, OAuthProviderConfig>> = {
  GOOGLE_CLASSROOM: {
    label: "Google Classroom",
    scopes: GOOGLE_CLASSROOM_SCOPES,
    buildAuthorizeUrl: googleAuthorizeUrl(GOOGLE_CLASSROOM_SCOPES),
    isConfigured: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  GOOGLE_WORKSPACE: {
    label: "Google Docs & Drive",
    scopes: GOOGLE_WORKSPACE_SCOPES,
    buildAuthorizeUrl: googleAuthorizeUrl(GOOGLE_WORKSPACE_SCOPES),
    isConfigured: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  YOUTUBE: {
    label: "YouTube",
    scopes: YOUTUBE_SCOPES,
    buildAuthorizeUrl: googleAuthorizeUrl(YOUTUBE_SCOPES),
    isConfigured: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  CANVAS: {
    label: "Canvas",
    scopes: [],
    buildAuthorizeUrl: ({ redirectUri, state }) => {
      const base = process.env.CANVAS_BASE_URL;
      if (!base || !process.env.CANVAS_CLIENT_ID) return null;
      const params = new URLSearchParams({
        client_id: process.env.CANVAS_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        state,
      });
      return `${base}/login/oauth2/auth?${params.toString()}`;
    },
    isConfigured: () => Boolean(process.env.CANVAS_BASE_URL && process.env.CANVAS_CLIENT_ID),
  },
  SCHOOLOGY: {
    label: "Schoology",
    scopes: [],
    buildAuthorizeUrl: ({ redirectUri, state }) => {
      if (!process.env.SCHOOLOGY_CLIENT_ID) return null;
      const params = new URLSearchParams({
        client_id: process.env.SCHOOLOGY_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        state,
      });
      return `https://app.schoology.com/oauth2/auth?${params.toString()}`;
    },
    isConfigured: () => Boolean(process.env.SCHOOLOGY_CLIENT_ID),
  },
  BLACKBOARD: {
    label: "Blackboard",
    scopes: BLACKBOARD_SCOPES,
    buildAuthorizeUrl: ({ redirectUri, state }) => {
      const base = process.env.BLACKBOARD_BASE_URL;
      if (!base || !process.env.BLACKBOARD_APP_KEY) return null;
      const params = new URLSearchParams({
        client_id: process.env.BLACKBOARD_APP_KEY,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: BLACKBOARD_SCOPES.join(" "),
        state,
      });
      return `${base}/learn/api/public/v1/oauth2/authorizationcode?${params.toString()}`;
    },
    isConfigured: () => Boolean(process.env.BLACKBOARD_BASE_URL && process.env.BLACKBOARD_APP_KEY),
  },
  VIMEO: {
    label: "Vimeo",
    scopes: VIMEO_SCOPES,
    buildAuthorizeUrl: ({ redirectUri, state }) => {
      if (!process.env.VIMEO_CLIENT_ID) return null;
      const params = new URLSearchParams({
        client_id: process.env.VIMEO_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: VIMEO_SCOPES.join(" "),
        state,
      });
      return `https://api.vimeo.com/oauth/authorize?${params.toString()}`;
    },
    isConfigured: () => Boolean(process.env.VIMEO_CLIENT_ID),
  },
};

export function isOAuthProvider(provider: string): provider is keyof typeof OAUTH_PROVIDERS {
  return provider in OAUTH_PROVIDERS;
}
