import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN ?? "saudipanther.sa";

  const users = [
    {
      name: "System Admin",
      email: `admin@${domain}`,
      password: "Admin@12345",
      role: "ADMIN" as const,
    },
    {
      name: "Finance Manager",
      email: `finance@${domain}`,
      password: "Finance@12345",
      role: "FINANCE" as const,
    },
    {
      name: "Marketing Member",
      email: `marketing@${domain}`,
      password: "Marketing@12345",
      role: "MARKETING" as const,
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
      },
    });
    console.log(`Seeded user: ${user.email} (${user.role}) — initial password: ${u.password}`);
  }

  console.log("\nSeed complete. Change these passwords after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
