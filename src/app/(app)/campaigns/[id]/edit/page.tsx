import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN", "FINANCE"]);
  const { id } = await params;

  const [campaign, companies, contacts, marketingUsers] = await Promise.all([
    prisma.campaign.findFirst({ where: { id, deletedAt: null }, include: { finance: true } }),
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

  if (!campaign) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Campaign</h1>
        <p className="text-sm text-muted-foreground">{campaign.campaignCode}</p>
      </div>
      <div className="max-w-3xl">
        <CampaignForm
          mode="edit"
          campaignId={campaign.id}
          companies={companies}
          contacts={contacts}
          marketingUsers={marketingUsers}
          defaultValues={{
            companyId: campaign.companyId,
            contactId: campaign.contactId ?? "",
            productName: campaign.productName,
            campaignTitle: campaign.campaignTitle,
            campaignTitleAr: campaign.campaignTitleAr ?? "",
            description: campaign.description ?? "",
            numberOfSnaps: campaign.numberOfSnaps,
            packageName: campaign.packageName ?? "",
            adDate: campaign.adDate ? campaign.adDate.toISOString().slice(0, 10) : "",
            postingTime: campaign.postingTime ?? "",
            priority: campaign.priority,
            assignedUserId: campaign.assignedUserId ?? "",
            price: Number(campaign.finance?.price ?? 0),
            discount: Number(campaign.finance?.discount ?? 0),
            vat: Number(campaign.finance?.vat ?? 0),
          }}
        />
      </div>
    </div>
  );
}
