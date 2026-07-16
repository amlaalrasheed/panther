import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, canSeeFinance } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MessageCircle } from "lucide-react";
import { StatusControl } from "@/components/campaigns/status-control";
import { AssignControl } from "@/components/campaigns/assign-control";
import { FinanceForm } from "@/components/campaigns/finance-form";
import { FeedbackForm } from "@/components/campaigns/feedback-form";
import { FeedbackDisplay } from "@/components/campaigns/feedback-display";
import { CaptureDialog } from "@/components/campaigns/capture-dialog";
import { CommentsSection } from "@/components/campaigns/comments-section";
import { Timeline } from "@/components/campaigns/timeline";
import { DeleteCampaignButton } from "@/components/campaigns/delete-campaign-button";
import { CUSTOMER_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const showFinance = canSeeFinance(user.role);

  const campaign = await prisma.campaign.findFirst({
    where: { id, deletedAt: null },
    include: {
      company: true,
      contact: true,
      assignedTo: true,
      createdBy: true,
      finance: true,
      feedback: { include: { recordedBy: true } },
      captures: { include: { createdBy: true }, orderBy: { createdAt: "desc" } },
      events: { include: { user: true }, orderBy: { createdAt: "asc" } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!campaign) notFound();

  const marketingUsers = await prisma.user.findMany({
    where: { role: "MARKETING", deletedAt: null, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const isAssignedToMe = campaign.assignedUserId === user.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{campaign.campaignCode}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.campaignTitle}</h1>
          {campaign.campaignTitleAr && (
            <p dir="rtl" className="text-muted-foreground">
              {campaign.campaignTitleAr}
            </p>
          )}
          <Link href={`/companies/${campaign.companyId}`} className="text-sm text-primary hover:underline">
            {campaign.company.name}
          </Link>
        </div>
        <div className="flex gap-2">
          {user.role === "MARKETING" && isAssignedToMe && <CaptureDialog campaignId={campaign.id} />}
          {(user.role === "ADMIN" || user.role === "FINANCE") && (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link href={`/campaigns/${campaign.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              }
            />
          )}
          {user.role === "ADMIN" && <DeleteCampaignButton campaignId={campaign.id} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Product" value={campaign.productName} />
              <Field label="Snaps" value={String(campaign.numberOfSnaps)} />
              <Field label="Ad Date" value={formatDate(campaign.adDate)} />
              <Field label="Posting Time" value={campaign.postingTime ?? "—"} />
              <Field label="Customer Type" value={CUSTOMER_TYPE_LABELS[campaign.company.type]} />
              <Field label="Contact" value={campaign.contact?.name ?? "—"} />
              <Field label="Trusted Customer" value={campaign.company.trustedCustomer ? "Yes" : "No"} />
              {campaign.description && (
                <div className="col-span-full">
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p>{campaign.description}</p>
                </div>
              )}
              {campaign.brief && (
                <div className="col-span-full">
                  <p className="text-xs font-medium text-muted-foreground">Campaign Brief</p>
                  <p className="whitespace-pre-wrap">{campaign.brief}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {showFinance && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FinanceForm
                  campaignId={campaign.id}
                  defaultValues={{
                    price: Number(campaign.finance?.price ?? 0),
                    discount: Number(campaign.finance?.discount ?? 0),
                    vat: Number(campaign.finance?.vat ?? 0),
                    invoiceNumber: campaign.finance?.invoiceNumber ?? "",
                    paymentMethod: campaign.finance?.paymentMethod ?? "",
                    paymentStatus: campaign.finance?.paymentStatus ?? "PENDING",
                    depositDate: campaign.finance?.depositDate
                      ? campaign.finance.depositDate.toISOString().slice(0, 10)
                      : "",
                    expectedDepositDate: campaign.finance?.expectedDepositDate
                      ? campaign.finance.expectedDepositDate.toISOString().slice(0, 10)
                      : "",
                    amountPaid: Number(campaign.finance?.amountPaid ?? 0),
                    transactionRef: campaign.finance?.transactionRef ?? "",
                    invoiceAttachmentUrl: campaign.finance?.invoiceAttachmentUrl ?? "",
                    receiptAttachmentUrl: campaign.finance?.receiptAttachmentUrl ?? "",
                    financialNotes: campaign.finance?.financialNotes ?? "",
                  }}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>24-Hour Results</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {campaign.captures.length === 0 && (
                <p className="text-sm text-muted-foreground">No 24-hour results submitted yet.</p>
              )}
              {campaign.captures.map((cap) => (
                <div key={cap.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">{cap.numberOfCaptures ?? 0} captures</span>
                    {cap.engagement && <span className="text-muted-foreground">{cap.engagement}</span>}
                  </div>
                  {cap.comments && <p className="mt-1 text-muted-foreground">{cap.comments}</p>}
                  {cap.screenshotUrl && (
                    <a
                      href={cap.screenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-primary hover:underline"
                    >
                      View screenshot
                    </a>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cap.createdBy.name} · {formatDateTime(cap.createdAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {user.role === "FINANCE" ? (
                <FeedbackForm
                  campaignId={campaign.id}
                  defaultValues={
                    campaign.feedback
                      ? {
                          satisfaction: campaign.feedback.satisfaction,
                          rating: campaign.feedback.rating,
                          notes: campaign.feedback.notes ?? "",
                          futureCooperation: campaign.feedback.futureCooperation,
                        }
                      : undefined
                  }
                />
              ) : (
                <FeedbackDisplay feedback={campaign.feedback} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <MessageCircle className="size-4" />
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentsSection campaignId={campaign.id} comments={campaign.comments} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusControl
                campaignId={campaign.id}
                currentStatus={campaign.status}
                role={user.role}
                isAssignedToMe={isAssignedToMe}
              />
            </CardContent>
          </Card>

          {showFinance && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Amount</span>
                  <span className="font-medium">{formatCurrency(Number(campaign.finance?.finalAmount ?? 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium">{formatCurrency(Number(campaign.finance?.amountPaid ?? 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium">
                    {formatCurrency(Number(campaign.finance?.remainingBalance ?? 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary">
                    {PAYMENT_STATUS_LABELS[campaign.finance?.paymentStatus ?? "PENDING"]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {(user.role === "ADMIN" || user.role === "FINANCE") && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <AssignControl
                  campaignId={campaign.id}
                  assignedUserId={campaign.assignedUserId}
                  marketingUsers={marketingUsers}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={campaign.events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}
