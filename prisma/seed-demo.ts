// Optional sample data for local development / demoing the UI.
// Not run automatically — invoke manually with `npm run db:seed-demo`.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN ?? "saudipanther.sa";
  const admin = await prisma.user.findFirstOrThrow({ where: { email: `admin@${domain}` } });
  const marketing = await prisma.user.findFirstOrThrow({ where: { email: `marketing@${domain}` } });

  const company =
    (await prisma.company.findFirst({ where: { name: "Al Faisaliah Retail Group" } })) ??
    (await prisma.company.create({
      data: { name: "Al Faisaliah Retail Group", nameAr: "مجموعة الفيصلية للتجزئة", type: "DIRECT_COMPANY", city: "Riyadh", industry: "Retail", trustedCustomer: true },
    }));

  const agency = await prisma.company.create({
    data: { name: "Nova Media Agency", nameAr: "وكالة نوفا الإعلامية", type: "AGENCY", city: "Jeddah", industry: "Marketing", trustedCustomer: false },
  });

  const contact = await prisma.contact.create({
    data: { companyId: company.id, name: "Fahad Al-Otaibi", nameAr: "فهد العتيبي", phone: "0501234567", email: "fahad@example.com", isPrimary: true },
  });

  const now = new Date();
  const statuses = ["PAYMENT_RECEIVED", "ASSIGNED", "POSTED", "COMPLETED", "FEEDBACK_RECEIVED"] as const;

  for (let i = 0; i < 8; i++) {
    const status = statuses[i % statuses.length];
    const price = 3000 + i * 750;
    const adDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 3 + 2);

    const campaign = await prisma.campaign.create({
      data: {
        campaignCode: `CMP-${now.getFullYear()}-DEMO${i}`,
        companyId: i % 2 === 0 ? company.id : agency.id,
        contactId: i % 2 === 0 ? contact.id : null,
        productName: `Product Launch ${i + 1}`,
        campaignTitle: `Ramadan Promo Snap #${i + 1}`,
        numberOfSnaps: (i % 7) + 1,
        packageName: "Gold Package",
        adDate,
        postingTime: "20:00",
        priority: i % 3 === 0 ? "URGENT" : "NORMAL",
        assignedUserId: marketing.id,
        status,
        createdById: admin.id,
        finance: {
          create: {
            price,
            discount: 0,
            vat: price * 0.15,
            finalAmount: price * 1.15,
            paymentStatus: i % 3 === 0 ? "PENDING" : "PAID",
            amountPaid: i % 3 === 0 ? 0 : price * 1.15,
            remainingBalance: i % 3 === 0 ? price * 1.15 : 0,
            depositDate: i % 3 === 0 ? null : adDate,
          },
        },
        events: { create: { toStatus: "INQUIRY_RECEIVED", userId: admin.id, note: "Booking created" } },
      },
    });

    if (status === "COMPLETED" || status === "FEEDBACK_RECEIVED") {
      await prisma.capture.create({
        data: {
          campaignId: campaign.id,
          numberOfCaptures: 1200 + i * 50,
          engagement: `${(2 + i * 0.3).toFixed(1)}k views`,
          createdById: marketing.id,
          completionTime: new Date(),
        },
      });
    }
    if (status === "FEEDBACK_RECEIVED") {
      await prisma.feedback.create({
        data: {
          campaignId: campaign.id,
          satisfaction: "SATISFIED",
          rating: 5,
          futureCooperation: true,
          recordedById: admin.id,
        },
      });
    }
  }

  console.log("Demo data seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
