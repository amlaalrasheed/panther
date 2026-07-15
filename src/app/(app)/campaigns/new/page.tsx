import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export default async function NewCampaignPage() {
  await requireRole(["FINANCE"]);

  const [companies, contacts, marketingUsers] = await Promise.all([
    prisma.company.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, nameAr: true, type: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { deletedAt: null },
      select: { id: true, companyId: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: "MARKETING", deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Advertisement Booking</h1>
        <p className="text-sm text-muted-foreground">
          Log a new customer inquiry and schedule the campaign
        </p>
      </div>
      <div className="max-w-3xl">
        <CampaignForm mode="create" companies={companies} contacts={contacts} marketingUsers={marketingUsers} />
      </div>
    </div>
  );
}
