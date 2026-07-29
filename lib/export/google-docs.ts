import { google } from "googleapis";

export interface GoogleDocsCredentials {
  accessToken: string;
}

export interface CreateGoogleDocInput {
  title: string;
  /** Plain text content — inserted as a single text run. Headings are
   * written as their own lines and left for the user to format, since
   * building a fully-styled Docs request is significant extra complexity
   * for a first pass at this export target. */
  content: string;
}

/**
 * Creates a real Google Doc via Drive (file creation) + Docs
 * (batchUpdate to insert text) APIs. Requires a Google access token with
 * the drive.file and documents scopes — obtained through a
 * GOOGLE_WORKSPACE IntegrationConnection, not the base sign-in scopes
 * (which only cover identity + Classroom). Wiring up that connection's
 * OAuth flow is a follow-up (see ROADMAP.md Phase 11); this function is
 * ready to be called once it exists.
 */
export async function createGoogleDoc(
  credentials: GoogleDocsCredentials,
  input: CreateGoogleDocInput,
): Promise<{ documentId: string; url: string }> {
  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: credentials.accessToken });

  const docs = google.docs({ version: "v1", auth: authClient });

  const created = await docs.documents.create({ requestBody: { title: input.title } });
  const documentId = created.data.documentId;
  if (!documentId) {
    throw new Error("Google Docs did not return a document id");
  }

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: { location: { index: 1 }, text: input.content },
        },
      ],
    },
  });

  return { documentId, url: `https://docs.google.com/document/d/${documentId}/edit` };
}

export function buildProjectDocContent(input: {
  title: string;
  classPeriodName: string;
  brief: string;
  lessons: Array<{ dayLabel: string; title: string; objective: string; iCanStatement: string }>;
}): string {
  const lines = [input.title, `${input.classPeriodName} — Teacher Guide`, "", input.brief, ""];
  for (const lesson of input.lessons) {
    lines.push(`${lesson.dayLabel}: ${lesson.title}`, `Objective: ${lesson.objective}`, `I can: ${lesson.iCanStatement}`, "");
  }
  return lines.join("\n");
}
