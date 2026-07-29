import { db } from "@/lib/db";

export class OrganizationError extends Error {}

export interface CreateOrganizationInput {
  creatorUserId: string;
  name: string;
  district?: string;
  cdsCode?: string;
}

/**
 * Bootstraps a new school/org. Only usable by a user who doesn't already
 * belong to one — this is the one place a user is promoted to ADMIN
 * without an invite, since someone has to be first. Every other role
 * change happens through lib/invites.ts.
 */
export async function createOrganization(input: CreateOrganizationInput) {
  const existing = await db.user.findUnique({
    where: { id: input.creatorUserId },
    select: { organizationId: true },
  });

  if (existing?.organizationId) {
    throw new OrganizationError("You already belong to an organization");
  }

  return db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: input.name, district: input.district, cdsCode: input.cdsCode },
    });

    await tx.user.update({
      where: { id: input.creatorUserId },
      data: { organizationId: organization.id, role: "ADMIN" },
    });

    return organization;
  });
}
