import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export class UserManagementError extends Error {}

export async function changeUserRole(
  organizationId: string,
  targetUserId: string,
  newRole: Role,
  actingUserId: string,
) {
  const target = await db.user.findFirst({ where: { id: targetUserId, organizationId } });
  if (!target) {
    throw new UserManagementError("User not found in this organization");
  }

  if (target.id === actingUserId && newRole !== "ADMIN") {
    const otherAdmins = await db.user.count({
      where: { organizationId, role: "ADMIN", id: { not: actingUserId } },
    });
    if (otherAdmins === 0) {
      throw new UserManagementError("You can't demote yourself — you're the only admin in this organization");
    }
  }

  return db.user.update({ where: { id: targetUserId }, data: { role: newRole } });
}

export async function setUserActive(organizationId: string, targetUserId: string, isActive: boolean, actingUserId: string) {
  const target = await db.user.findFirst({ where: { id: targetUserId, organizationId } });
  if (!target) {
    throw new UserManagementError("User not found in this organization");
  }
  if (target.id === actingUserId && !isActive) {
    throw new UserManagementError("You can't deactivate your own account");
  }

  return db.user.update({ where: { id: targetUserId }, data: { isActive } });
}
