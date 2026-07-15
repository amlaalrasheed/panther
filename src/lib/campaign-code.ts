import { prisma } from "@/lib/prisma";

// Generates a sequential, human-readable campaign code like CMP-2026-0001,
// scoped per calendar year. Not perfectly race-safe under heavy concurrent
// writes, but collisions are prevented by the unique constraint + retry.
export async function generateCampaignCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;

  // Sorting the code string ("desc") isn't reliable for finding the highest
  // number — non-numeric suffixes (e.g. seeded demo codes like "...-DEMO7")
  // sort ahead of real numeric ones lexicographically, so we instead pull
  // every code for the year and take the max of the numeric suffixes only.
  const candidates = await prisma.campaign.findMany({
    where: { campaignCode: { startsWith: prefix } },
    select: { campaignCode: true },
  });

  const numbers = candidates
    .map((c) => c.campaignCode.slice(prefix.length))
    .filter((suffix) => /^\d+$/.test(suffix))
    .map((suffix) => parseInt(suffix, 10));

  const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
