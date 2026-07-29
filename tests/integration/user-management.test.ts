import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { changeUserRole, setUserActive, UserManagementError } from "@/lib/user-management";

const db = new PrismaClient();
let orgId: string;
let adminId: string;
let testUserId: string;

beforeAll(async () => {
  const org = await db.organization.findUniqueOrThrow({ where: { id: "demo-org" } });
  const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@demo.filmstudioclassroom.ai" } });
  orgId = org.id;
  adminId = admin.id;
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  const user = await db.user.create({
    data: { email: `vitest-user-${Date.now()}-${Math.random()}@example.com`, role: "TEACHER", organizationId: orgId },
  });
  testUserId = user.id;
});

afterEach(async () => {
  await db.user.deleteMany({ where: { id: testUserId } });
});

describe("changeUserRole", () => {
  it("changes another user's role", async () => {
    const updated = await changeUserRole(orgId, testUserId, "ADMIN", adminId);
    expect(updated.role).toBe("ADMIN");
  });

  it("blocks the sole admin from demoting themselves", async () => {
    // testUserId is a TEACHER here, so adminId really is the only ADMIN.
    await expect(changeUserRole(orgId, adminId, "TEACHER", adminId)).rejects.toBeInstanceOf(UserManagementError);
  });

  it("allows self-demotion once there's another admin to take over", async () => {
    await changeUserRole(orgId, testUserId, "ADMIN", adminId);
    const result = await changeUserRole(orgId, adminId, "TEACHER", adminId);
    expect(result.role).toBe("TEACHER");
    // Restore the seeded admin's role so other tests/scripts relying on it keep working.
    await changeUserRole(orgId, adminId, "ADMIN", testUserId);
  });

  it("rejects a user id outside the organization", async () => {
    const otherOrg = await db.organization.create({ data: { name: "Vitest Other Org" } });
    const outsider = await db.user.create({ data: { email: `vitest-outsider-${Date.now()}@example.com`, organizationId: otherOrg.id } });
    await expect(changeUserRole(orgId, outsider.id, "ADMIN", adminId)).rejects.toBeInstanceOf(UserManagementError);
    await db.user.delete({ where: { id: outsider.id } });
    await db.organization.delete({ where: { id: otherOrg.id } });
  });
});

describe("setUserActive", () => {
  it("deactivates another user", async () => {
    const updated = await setUserActive(orgId, testUserId, false, adminId);
    expect(updated.isActive).toBe(false);
  });

  it("blocks a user from deactivating themselves", async () => {
    await expect(setUserActive(orgId, adminId, false, adminId)).rejects.toBeInstanceOf(UserManagementError);
  });

  it("reactivates a deactivated user", async () => {
    await setUserActive(orgId, testUserId, false, adminId);
    const reactivated = await setUserActive(orgId, testUserId, true, adminId);
    expect(reactivated.isActive).toBe(true);
  });
});
