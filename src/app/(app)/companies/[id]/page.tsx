import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Phone, MessageCircle, Mail, Star } from "lucide-react";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";
import { ContactFormDialog } from "@/components/companies/contact-form-dialog";
import { DeleteCompanyButton } from "@/components/companies/delete-company-button";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const { id } = await params;

  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: {
      contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      campaigns: {
        where: { deletedAt: null },
        include: { finance: true, assignedTo: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) notFound();

  const lifetimeRevenue = company.campaigns.reduce(
    (sum, c) => sum + Number(c.finance?.finalAmount ?? 0),
    0
  );
  const outstanding = company.campaigns.reduce(
    (sum, c) => sum + Number(c.finance?.remainingBalance ?? 0),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            <Badge variant="secondary">{CUSTOMER_TYPE_LABELS[company.type]}</Badge>
          </div>
          {company.nameAr && (
            <p dir="rtl" className="text-muted-foreground">
              {company.nameAr}
            </p>
          )}
          {company.industry && <p className="text-sm text-muted-foreground">{company.industry}</p>}
        </div>
        <div className="flex gap-2">
          <CompanyFormDialog
            mode="edit"
            company={{
              id: company.id,
              name: company.name,
              nameAr: company.nameAr ?? "",
              type: company.type,
              city: company.city ?? "",
              industry: company.industry ?? "",
              notes: company.notes ?? "",
              trustedCustomer: company.trustedCustomer,
            }}
            trigger={
              <Button variant="outline">
                <Pencil className="size-4" />
                Edit
              </Button>
            }
          />
          {user.role === "ADMIN" && <DeleteCompanyButton companyId={company.id} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Campaigns" value={String(company.campaigns.length)} />
        <StatCard label="Lifetime Revenue" value={formatCurrency(lifetimeRevenue)} />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(outstanding)}
          highlight={outstanding > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contacts</CardTitle>
            <ContactFormDialog companyId={company.id} mode="create" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {company.contacts.length === 0 && (
              <p className="text-sm text-muted-foreground">No contacts yet.</p>
            )}
            {company.contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-medium">
                      {contact.name}
                      {contact.isPrimary && (
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    {contact.nameAr && (
                      <div dir="rtl" className="text-xs text-muted-foreground">
                        {contact.nameAr}
                      </div>
                    )}
                    {contact.title && (
                      <div className="text-xs text-muted-foreground">{contact.title}</div>
                    )}
                  </div>
                  <ContactFormDialog
                    companyId={company.id}
                    mode="edit"
                    contact={{
                      id: contact.id,
                      companyId: company.id,
                      name: contact.name,
                      nameAr: contact.nameAr ?? "",
                      title: contact.title ?? "",
                      phone: contact.phone ?? "",
                      whatsapp: contact.whatsapp ?? "",
                      email: contact.email ?? "",
                      isPrimary: contact.isPrimary,
                    }}
                    trigger={
                      <Button variant="ghost" size="icon" className="size-7">
                        <Pencil className="size-3.5" />
                      </Button>
                    }
                  />
                </div>
                <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                  {contact.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3" /> {contact.phone}
                    </span>
                  )}
                  {contact.whatsapp && (
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="size-3" /> {contact.whatsapp}
                    </span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3" /> {contact.email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Campaign History</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {company.campaigns.length === 0 && (
              <p className="text-sm text-muted-foreground">No campaigns yet.</p>
            )}
            {company.campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent"
              >
                <div>
                  <div className="font-medium">{c.campaignTitle}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.campaignCode} · {formatDate(c.adDate)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.finance && (
                    <span className="text-sm font-medium">
                      {formatCurrency(Number(c.finance.finalAmount))}
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      c.posted
                        ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    )}
                  >
                    {c.posted ? "Posted" : "Not Posted"}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {company.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{company.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-xl font-semibold",
            highlight && "text-red-700 dark:text-red-400"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
