import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Serverless (Vercel) runs many separate function instances concurrently,
// each with its own connection pool — a large per-instance pool multiplies
// out and exhausts the database's total connection limit fast (this is
// what's happening if you see "max clients reached" errors). Keeping this
// small per instance and relying on Supabase's own pooler (set via
// DATABASE_URL — use the Transaction pooler, not Session, in production)
// to multiplex across instances is the standard fix.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
