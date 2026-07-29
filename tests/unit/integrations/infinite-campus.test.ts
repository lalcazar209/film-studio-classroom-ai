import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { InfiniteCampusAdapter } from "@/lib/integrations/infinite-campus";
import type { SisCredentials } from "@/lib/integrations/sis-adapter";

const credentials: SisCredentials = { baseUrl: "https://test-district.infinitecampus.org", apiKey: "key123", apiSecret: "secret456" };

describe("InfiniteCampusAdapter", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("authenticates roster requests with a Basic auth header built from the configured key/secret", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    const adapter = new InfiniteCampusAdapter();
    await adapter.fetchRoster(credentials, "SCHOOL-1");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${credentials.baseUrl}/campus/api/v1/schools/SCHOOL-1/sections`);
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("key123:secret456").toString("base64")}`);
  });

  it("maps Campus's section/student shape onto SisRosterSection", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            sectionId: "SEC-1",
            sectionName: "Intro to Film",
            teacherId: "T-1",
            students: [{ studentId: "S-1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", grade: "10" }],
          },
        ]),
        { status: 200 },
      ),
    );

    const adapter = new InfiniteCampusAdapter();
    const sections = await adapter.fetchRoster(credentials, "SCHOOL-1");

    expect(sections).toEqual([
      {
        sisSectionId: "SEC-1",
        name: "Intro to Film",
        teacherSisId: "T-1",
        students: [{ sisStudentId: "S-1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", gradeLevel: "10" }],
      },
    ]);
  });

  it("pushes a grade with the assignment name and score/max score", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const adapter = new InfiniteCampusAdapter();
    await adapter.pushGrade(credentials, {
      sisStudentId: "S-1",
      sisSectionId: "SEC-1",
      assignmentName: "PSA Final",
      pointsEarned: 92,
      pointsPossible: 100,
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${credentials.baseUrl}/campus/api/v1/sections/SEC-1/students/S-1/grades`);
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ assignmentName: "PSA Final", score: 92, maxScore: 100 });
  });

  it("throws when Campus responds with a non-2xx status, rather than returning a partial/empty roster silently", async () => {
    fetchMock.mockResolvedValueOnce(new Response("forbidden", { status: 403 }));

    const adapter = new InfiniteCampusAdapter();
    await expect(adapter.fetchRoster(credentials, "SCHOOL-1")).rejects.toThrow(/403/);
  });
});
