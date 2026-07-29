import QRCode from "qrcode";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentRow } from "@/components/equipment-row";

export default async function EquipmentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/teacher/dashboard/equipment");
  if (!session.user.role || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    redirect("/unauthorized");
  }
  if (!session.user.organizationId) redirect("/onboarding");

  const organizationId = session.user.organizationId;

  const [items, users] = await Promise.all([
    db.equipmentItem.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: {
        checkouts: {
          where: { returnedAt: null },
          include: { user: { select: { id: true, name: true, email: true } } },
          take: 1,
        },
      },
    }),
    db.user.findMany({
      where: { organizationId, role: { in: ["STUDENT", "TEACHER"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows = await Promise.all(
    items.map(async (item) => {
      const qrDataUrl = await QRCode.toDataURL(item.assetTag, { width: 144, margin: 1 });
      const activeCheckout = item.checkouts[0];
      return {
        id: item.id,
        name: item.name,
        assetTag: item.assetTag,
        status: item.status,
        qrDataUrl,
        activeCheckout: activeCheckout
          ? {
              id: activeCheckout.id,
              borrowerName: activeCheckout.user.name ?? activeCheckout.user.email,
              dueAt: activeCheckout.dueAt ? activeCheckout.dueAt.toISOString().slice(0, 10) : null,
            }
          : null,
      };
    }),
  );

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Equipment Manager</h1>
      <p className="text-black/60 dark:text-white/60">
        Each item&apos;s QR code encodes its asset tag — scan with a USB/handheld scanner (it types
        the tag like a keyboard) or print the code for a physical checkout log.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">No equipment registered yet.</p>
          ) : (
            rows.map((item) => <EquipmentRow key={item.id} item={item} users={users} />)
          )}
        </CardContent>
      </Card>
    </main>
  );
}
