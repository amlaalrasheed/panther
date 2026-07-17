"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { generateCampaignCode } from "@/lib/campaign-code";
import {
  campaignSchema,
  campaignCreateSchema,
  financeUpdateSchema,
  feedbackSchema,
  captureSchema,
  type CampaignInput,
  type FinanceUpdateInput,
  type FeedbackInput,
  type CaptureInput,
} from "@/lib/validation";
import { type CampaignStatus } from "@/lib/constants";

export async function createCampaign(input: CampaignInput) {
  const user = await requireRole(["FINANCE"]);
  const data = campaignCreateSchema.parse(input);
  const campaignCode = await generateCampaignCode();

  const campaign = await prisma.campaign.create({
    data: {
      campaignCode,
      companyId: data.companyId,
      contactId: data.contactId || null,
      productName: data.productName,
      campaignTitle: data.campaignTitle,
      campaignTitleAr: data.campaignTitleAr || null,
      description: data.description || null,
      platform: data.platform,
      numberOfSnaps: data.platform === "SNAPCHAT" ? data.numberOfSnaps : 1,
      packageName: data.packageName || null,
      adDate: data.adDate ? new Date(data.adDate) : null,
      postingTime: data.postingTime || null,
      priority: data.priority,
      assignedUserId: data.assignedUserId || null,
      posted: data.posted,
      createdById: user.id,
      status: "INQUIRY_RECEIVED",
      finance: {
        create: {
          price: data.price,
          discount: data.discount,
          vat: data.vat,
          finalAmount: data.price - data.discount + data.vat,
          paymentStatus: data.paymentStatus,
          depositDate: new Date(data.depositDate),
          amountPaid: data.amountPaid,
          remainingBalance: data.price - data.discount + data.vat - data.amountPaid,
          financialNotes: data.financialNotes || null,
        },
      },
      events: {
        create: {
          toStatus: "INQUIRY_RECEIVED",
          userId: user.id,
          note: "Booking created",
        },
      },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "Campaign",
    entityId: campaign.id,
    newValue: campaign,
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaignDetails(id: string, input: CampaignInput) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const data = campaignSchema.parse(input);

  const before = await prisma.campaign.findUniqueOrThrow({ where: { id } });
  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      companyId: data.companyId,
      contactId: data.contactId || null,
      productName: data.productName,
      campaignTitle: data.campaignTitle,
      campaignTitleAr: data.campaignTitleAr || null,
      description: data.description || null,
      platform: data.platform,
      numberOfSnaps: data.platform === "SNAPCHAT" ? data.numberOfSnaps : 1,
      packageName: data.packageName || null,
      adDate: data.adDate ? new Date(data.adDate) : null,
      postingTime: data.postingTime || null,
      priority: data.priority,
      assignedUserId: data.assignedUserId || null,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "Campaign",
    entityId: campaign.id,
    oldValue: before,
    newValue: campaign,
  });

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
}

export async function softDeleteCampaign(id: string) {
  const user = await requireRole(["ADMIN"]);
  const before = await prisma.campaign.findUniqueOrThrow({ where: { id } });
  const campaign = await prisma.campaign.update({ where: { id }, data: { deletedAt: new Date() } });

  await writeAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "Campaign",
    entityId: campaign.id,
    oldValue: before,
    newValue: campaign,
  });

  revalidatePath("/campaigns");
  redirect("/campaigns");
}

export async function setCampaignPosted(id: string, posted: boolean) {
  const user = await requireUser();
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id },
    include: { finance: true, company: { select: { trustedCustomer: true } } },
  });

  // Marketing can only change campaigns assigned to them.
  if (user.role === "MARKETING" && campaign.assignedUserId !== user.id) {
    throw new Error("You can only update campaigns assigned to you.");
  }

  // Trust-based payment gate: an untrusted customer's campaign can't be
  // marked Posted until its payment is confirmed.
  if (posted && !campaign.company.trustedCustomer && campaign.finance?.paymentStatus !== "PAID") {
    throw new Error(
      "This customer is not trusted and payment has not been confirmed. Confirm payment before marking as Posted."
    );
  }

  const toStatus: CampaignStatus = posted ? "POSTED" : "SCHEDULED";
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      posted,
      status: toStatus,
      events: {
        create: {
          fromStatus: campaign.status,
          toStatus,
          userId: user.id,
          note: posted ? "Marked as Posted" : "Marked as Not Posted",
        },
      },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "Campaign",
    entityId: id,
    oldValue: { posted: campaign.posted },
    newValue: { posted },
  });

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  return updated;
}

export async function assignCampaign(id: string, assignedUserId: string) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const before = await prisma.campaign.findUniqueOrThrow({ where: { id } });

  const nextStatus: CampaignStatus =
    before.status === "INQUIRY_RECEIVED" || before.status === "WAITING_FOR_PAYMENT"
      ? before.status
      : "ASSIGNED";

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      assignedUserId,
      status: nextStatus,
      events: {
        create: {
          fromStatus: before.status,
          toStatus: nextStatus,
          userId: user.id,
          note: "Assigned to marketing team member",
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: assignedUserId,
      type: "CAMPAIGN_ASSIGNED",
      title: "New campaign assigned",
      message: `You've been assigned to "${campaign.campaignTitle}" (${campaign.campaignCode}).`,
      link: `/campaigns/${campaign.id}`,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "Campaign",
    entityId: campaign.id,
    oldValue: { assignedUserId: before.assignedUserId },
    newValue: { assignedUserId },
  });

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
}

export async function updateCampaignFinance(id: string, input: FinanceUpdateInput) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const data = financeUpdateSchema.parse(input);
  const finalAmount = data.price - data.discount + data.vat;
  const remainingBalance = finalAmount - data.amountPaid;

  const before = await prisma.campaignFinance.findUnique({ where: { campaignId: id } });

  const finance = await prisma.campaignFinance.upsert({
    where: { campaignId: id },
    create: {
      campaignId: id,
      price: data.price,
      discount: data.discount,
      vat: data.vat,
      finalAmount,
      invoiceNumber: data.invoiceNumber || null,
      paymentMethod: data.paymentMethod || null,
      paymentStatus: data.paymentStatus,
      depositDate: data.depositDate ? new Date(data.depositDate) : null,
      expectedDepositDate: data.expectedDepositDate ? new Date(data.expectedDepositDate) : null,
      amountPaid: data.amountPaid,
      remainingBalance,
      transactionRef: data.transactionRef || null,
      invoiceAttachmentUrl: data.invoiceAttachmentUrl || null,
      receiptAttachmentUrl: data.receiptAttachmentUrl || null,
      financialNotes: data.financialNotes || null,
    },
    update: {
      price: data.price,
      discount: data.discount,
      vat: data.vat,
      finalAmount,
      invoiceNumber: data.invoiceNumber || null,
      paymentMethod: data.paymentMethod || null,
      paymentStatus: data.paymentStatus,
      depositDate: data.depositDate ? new Date(data.depositDate) : null,
      expectedDepositDate: data.expectedDepositDate ? new Date(data.expectedDepositDate) : null,
      amountPaid: data.amountPaid,
      remainingBalance,
      transactionRef: data.transactionRef || null,
      invoiceAttachmentUrl: data.invoiceAttachmentUrl || null,
      receiptAttachmentUrl: data.receiptAttachmentUrl || null,
      financialNotes: data.financialNotes || null,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "CampaignFinance",
    entityId: finance.id,
    oldValue: before,
    newValue: finance,
  });

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
}

export async function addCapture(campaignId: string, input: CaptureInput) {
  const user = await requireUser();
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });

  // 24-hour capture numbers can only be entered by the marketing team
  // member the campaign is assigned to — not Admin, Finance, or any other
  // marketing member.
  if (user.role !== "MARKETING" || campaign.assignedUserId !== user.id) {
    throw new Error("Only the marketing member assigned to this campaign can add capture results.");
  }

  const data = captureSchema.parse(input);
  const capture = await prisma.capture.create({
    data: {
      campaignId,
      numberOfCaptures: data.numberOfCaptures,
      engagement: data.engagement || null,
      comments: data.comments || null,
      screenshotUrl: data.screenshotUrl || null,
      completionTime: new Date(),
      createdById: user.id,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "Capture",
    entityId: capture.id,
    newValue: capture,
  });

  revalidatePath(`/campaigns/${campaignId}`);
}

export async function addComment(campaignId: string, body: string) {
  const user = await requireUser();
  const comment = await prisma.comment.create({
    data: { campaignId, userId: user.id, body },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return comment;
}

export async function submitFeedback(campaignId: string, input: FeedbackInput) {
  const user = await requireRole(["FINANCE"]);
  const data = feedbackSchema.parse(input);

  const feedback = await prisma.feedback.upsert({
    where: { campaignId },
    create: {
      campaignId,
      satisfaction: data.satisfaction,
      rating: data.rating,
      notes: data.notes || null,
      futureCooperation: data.futureCooperation,
      recordedById: user.id,
    },
    update: {
      satisfaction: data.satisfaction,
      rating: data.rating,
      notes: data.notes || null,
      futureCooperation: data.futureCooperation,
      recordedById: user.id,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "Feedback",
    entityId: feedback.id,
    newValue: feedback,
  });

  revalidatePath(`/campaigns/${campaignId}`);
}
