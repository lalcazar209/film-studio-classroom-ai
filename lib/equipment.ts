import { db } from "@/lib/db";

export class EquipmentError extends Error {}

export interface CheckoutInput {
  equipmentId: string;
  userId: string;
  organizationId: string;
  dueAt?: Date;
}

/** Looks up equipment by its asset tag — the value encoded in the QR code
 * and what a USB barcode scanner types when it reads the tag. */
export async function findEquipmentByAssetTag(assetTag: string, organizationId: string) {
  return db.equipmentItem.findFirst({ where: { assetTag, organizationId } });
}

export async function checkoutEquipment(input: CheckoutInput) {
  return db.$transaction(async (tx) => {
    const item = await tx.equipmentItem.findFirst({
      where: { id: input.equipmentId, organizationId: input.organizationId },
    });
    if (!item) throw new EquipmentError("Equipment item not found in your organization");
    if (item.status !== "AVAILABLE") {
      throw new EquipmentError(`Item is not available (status: ${item.status})`);
    }

    await tx.equipmentItem.update({ where: { id: item.id }, data: { status: "CHECKED_OUT" } });

    return tx.equipmentCheckout.create({
      data: {
        equipmentId: item.id,
        userId: input.userId,
        dueAt: input.dueAt,
      },
    });
  });
}

export interface ReturnInput {
  checkoutId: string;
  organizationId: string;
  damageNotes?: string;
}

export async function returnEquipment(input: ReturnInput) {
  return db.$transaction(async (tx) => {
    const checkout = await tx.equipmentCheckout.findUnique({
      where: { id: input.checkoutId },
      include: { equipment: true },
    });
    if (!checkout || checkout.equipment.organizationId !== input.organizationId) {
      throw new EquipmentError("Checkout record not found in your organization");
    }
    if (checkout.returnedAt) {
      throw new EquipmentError("This checkout was already returned");
    }

    await tx.equipmentCheckout.update({
      where: { id: checkout.id },
      data: { returnedAt: new Date(), damageNotes: input.damageNotes },
    });

    await tx.equipmentItem.update({
      where: { id: checkout.equipmentId },
      data: { status: input.damageNotes ? "DAMAGED" : "AVAILABLE" },
    });

    return checkout;
  });
}
