import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { PAYMENT_STATUS_LABELS, CUSTOMER_TYPE_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

// Saudi Panther brand green (matches the app's --primary color)
const BRAND_GREEN = "2B4730";
const BRAND_GREEN_RGB: [number, number, number] = [0x2b, 0x47, 0x30];

const COLUMNS = [
  "Campaign ID",
  "Company",
  "Customer Type",
  "Contact",
  "Campaign",
  "Product",
  "Platform",
  "Snaps",
  "Marketing Member",
  "Price",
  "Paid",
  "Remaining Balance",
  "Payment Date",
  "Campaign Date",
  "Status",
  "24h Captures",
  "Feedback",
];

export async function GET(request: NextRequest) {
  await requireRole(["ADMIN", "FINANCE"]);

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "xlsx";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const paid = searchParams.get("paid");

  const where: Prisma.CampaignWhereInput = {
    deletedAt: null,
    ...(paid === "paid" ? { finance: { paymentStatus: "PAID" } } : {}),
    ...(paid === "unpaid" ? { finance: { paymentStatus: { in: ["PENDING", "PARTIALLY_PAID"] } } } : {}),
    ...(from || to
      ? {
          adDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      company: true,
      contact: true,
      assignedTo: true,
      finance: true,
      captures: true,
      feedback: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = campaigns.map((c) => [
    c.campaignCode,
    c.company.name,
    CUSTOMER_TYPE_LABELS[c.company.type],
    c.contact?.name ?? "",
    c.campaignTitle,
    c.productName,
    PLATFORM_LABELS[c.platform],
    c.platform === "SNAPCHAT" ? c.numberOfSnaps : "—",
    c.assignedTo?.name ?? "",
    Number(c.finance?.finalAmount ?? 0),
    c.finance ? PAYMENT_STATUS_LABELS[c.finance.paymentStatus] : "",
    Number(c.finance?.remainingBalance ?? 0),
    formatDate(c.finance?.depositDate),
    formatDate(c.adDate),
    c.posted ? "Posted" : "Not Posted",
    c.captures.reduce((s, cap) => s + (cap.numberOfCaptures ?? 0), 0),
    c.feedback ? `${c.feedback.rating}/5` : "",
  ]);

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Campaigns");
    const headerRow = sheet.addRow(COLUMNS);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND_GREEN}` } };
    rows.forEach((r) => sheet.addRow(r));
    sheet.columns.forEach((col) => (col.width = 18));
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="campaign-report.xlsx"',
      },
    });
  }

  // PDF (also the fallback for any unrecognized format value)
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Campaign Report", 14, 14);
  autoTable(doc, {
    head: [COLUMNS],
    body: rows.map((r) => r.map(String)),
    startY: 20,
    styles: { fontSize: 7 },
    headStyles: { fillColor: BRAND_GREEN_RGB },
  });
  const buffer = doc.output("arraybuffer");
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="campaign-report.pdf"',
    },
  });
}
