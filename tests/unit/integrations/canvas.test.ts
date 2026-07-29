import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CanvasAdapter } from "@/lib/integrations/canvas";

const BASE_URL = "https://test-school.instructure.com";

describe("CanvasAdapter", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exchanges an auth code against the correct token endpoint with the right grant type", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "at", refresh_token: "rt", expires_in: 3600 }), { status: 200 }),
    );

    const adapter = new CanvasAdapter(BASE_URL);
    const credentials = await adapter.exchangeAuthCode("auth-code-123", "https://app.example.com/callback");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE_URL}/login/oauth2/token`);
    const body = new URLSearchParams(init.body as string);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code-123");
    expect(body.get("redirect_uri")).toBe("https://app.example.com/callback");

    expect(credentials.accessToken).toBe("at");
    expect(credentials.refreshToken).toBe("rt");
  });

  it("creates an assignment with a Bearer token and maps the response to a CreatedAssignmentRef", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 42, html_url: "https://test-school.instructure.com/courses/1/assignments/42" }), {
        status: 200,
      }),
    );

    const adapter = new CanvasAdapter(BASE_URL);
    const ref = await adapter.createAssignment(
      { accessToken: "at" },
      "1",
      { title: "PSA Draft", description: "Submit your draft", maxPoints: 100 },
    );

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE_URL}/api/v1/courses/1/assignments`);
    expect(init.headers.Authorization).toBe("Bearer at");
    const parsedBody = JSON.parse(init.body as string);
    expect(parsedBody.assignment.name).toBe("PSA Draft");
    expect(parsedBody.assignment.points_possible).toBe(100);

    expect(ref).toEqual({ externalId: "42", url: "https://test-school.instructure.com/courses/1/assignments/42" });
  });

  it("throws a clear error when the token endpoint responds with a non-2xx status", async () => {
    fetchMock.mockResolvedValueOnce(new Response("unauthorized", { status: 401 }));

    const adapter = new CanvasAdapter(BASE_URL);
    await expect(adapter.exchangeAuthCode("bad-code", "https://app.example.com/callback")).rejects.toThrow(/401/);
  });

  it("requires a base URL — throws immediately if none is configured", () => {
    const previous = process.env.CANVAS_BASE_URL;
    delete process.env.CANVAS_BASE_URL;
    expect(() => new CanvasAdapter("")).toThrow(/CANVAS_BASE_URL/);
    if (previous) process.env.CANVAS_BASE_URL = previous;
  });
});
