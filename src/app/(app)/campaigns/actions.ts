"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { generateCampaignCode } from "@/lib/campaign-code";
import {
  campaignSchema,
  financeUpdateSchema,
  feedbackSchema,
  captureSchema,
  type CampaignInput,
  type FinanceUpdateInput,
  type FeedbackInput,
  type CaptureInput,
} from "@/lib/validation";
import { STATUS_ORDER, type CampaignStatus } from "@/lib/constants";

export async function createCampaign(input: CampaignInput) {
  const user = await requireRole(["FINANCE"]);
  const data = campaignSchema.parse(input);
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
      brief: data.brief || null,
      numberOfSnaps: data.numberOfSnaps,
      packageName: data.packageName || null,
      adDate: data.adDate ? new Date(data.adDate) : null,
      postingTime: data.postingTime || null,
      priority: data.priority,
      assignedUserId: data.assignedUserId || null,
      createdById: user.id,
      status: "INQUIRY_RECEIVED",
      finance: {
        create: {
          price: data.price ?? 0,
          discount: data.discount ?? 0,
          vat: data.vat ?? 0,
          finalAmount: (data.price ?? 0) - (data.discount ?? 0) + (data.vat ?? 0),
          invoiceNumber: data.invoiceNumber || null,
          paymentMethod: data.paymentMethod || null,
          paymentStatus: data.paymentStatus ?? "PENDING",
          expectedDepositDate: data.expectedDepositDate ? new Date(data.expectedDepositDate) : null,
          amountPaid: data.amountPaid ?? 0,
          remainingBalance:
            (data.price ?? 0) - (data.discount ?? 0) + (data.vat ?? 0) - (data.amountPaid ?? 0),
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
      brief: data.brief || null,
      numberOfSnaps: data.numberOfSnaps,
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

const MARKETING_ALLOWED_TRANSITIONS: Record<string, CampaignStatus[]> = {
  ASSIGNED: ["POSTED"],
  POSTED: ["WAITING_FOR_RESULTS"],
  WAITING_FOR_RESULTS: ["COMPLETED"],
};

export async function changeCampaignStatus(id: string, toStatus: CampaignStatus, note?: string) {
  const user = await requireUser();
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id },
    include: { finance: true, company: { select: { trustedCustomer: true } } },
  });

  if (user.role === "MARKETING") {
    if (campaign.assignedUserId !== user.id) {
      throw new Error("You can only update campaigns assigned to you.");
    }
    const allowed = MARKETING_ALLOWED_TRANSITIONS[campaign.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new Error("That status change isn't allowed for your role.");
    }
  }

  // Trust-based payment gate: untrusted customers can't move past the
  // payment step until the campaign is marked paid.
  const targetIndex = STATUS_ORDER.indexOf(toStatus);
  const paymentGateIndex = STATUS_ORDER.indexOf("PAYMENT_RECEIVED");
  if (
    targetIndex >= paymentGateIndex &&
    !campaign.company.trustedCustomer &&
    campaign.finance?.paymentStatus !== "PAID"
  ) {
    throw new Error(
      "This customer is not trusted and payment has not been confirmed. Confirm payment before proceeding."
    );
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: toStatus,
      events: {
        create: {
          fromStatus: campaign.status,
          toStatus,
          userId: user.id,
          note: note || null,
        },
      },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "Campaign",
    entityId: id,
    oldValue: { status: campaign.status },
    newValue: { status: toStatus },
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

  // Auto-advance out of the payment-waiting status once fully paid.
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id } });
  if (data.paymentStatus === "PAID" && campaign.status === "WAITING_FOR_PAYMENT") {
    await prisma.campaign.update({
      where: { id },
      data: {
        status: "PAYMENT_RECEIVED",
        events: {
          create: {
            fromStatus: "WAITING_FOR_PAYMENT",
            toStatus: "PAYMENT_RECEIVED",
            userId: user.id,
            note: "Payment confirmed",
          },
        },
      },
    });
  }

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

  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (campaign.status === "COMPLETED") {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "FEEDBACK_RECEIVED",
        events: {
          create: {
            fromStatus: "COMPLETED",
            toStatus: "FEEDBACK_RECEIVED",
            userId: user.id,
            note: "Customer feedback recorded",
          },
        },
      },
    });
  }

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "Feedback",
    entityId: feedback.id,
    newValue: feedback,
  });

  revalidatePath(`/campaigns/${campaignId}`);
}
