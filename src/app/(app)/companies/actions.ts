"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { companySchema, contactSchema, type CompanyInput, type ContactInput } from "@/lib/validation";

export async function createCompany(input: CompanyInput) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const data = companySchema.parse(input);

  const company = await prisma.company.create({
    data: {
      name: data.name,
      nameAr: data.nameAr || null,
      type: data.type,
      city: data.city || null,
      industry: data.industry || null,
      notes: data.notes || null,
      trustedCustomer: data.trustedCustomer ?? false,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "Company",
    entityId: company.id,
    newValue: company,
  });

  revalidatePath("/companies");
  return company;
}

export async function updateCompany(id: string, input: CompanyInput) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const data = companySchema.parse(input);

  const before = await prisma.company.findUniqueOrThrow({ where: { id } });
  const company = await prisma.company.update({
    where: { id },
    data: {
      name: data.name,
      nameAr: data.nameAr || null,
      type: data.type,
      city: data.city || null,
      industry: data.industry || null,
      notes: data.notes || null,
      trustedCustomer: data.trustedCustomer ?? false,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "Company",
    entityId: company.id,
    oldValue: before,
    newValue: company,
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  return company;
}

export async function softDeleteCompany(id: string) {
  const user = await requireRole(["ADMIN"]);
  const before = await prisma.company.findUniqueOrThrow({ where: { id } });
  const company = await prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });

  await writeAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "Company",
    entityId: company.id,
    oldValue: before,
    newValue: company,
  });

  revalidatePath("/companies");
}

export async function createContact(input: ContactInput) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const data = contactSchema.parse(input);

  if (data.isPrimary) {
    await prisma.contact.updateMany({
      where: { companyId: data.companyId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.contact.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      nameAr: data.nameAr || null,
      title: data.title || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      isPrimary: data.isPrimary ?? false,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "Contact",
    entityId: contact.id,
    newValue: contact,
  });

  revalidatePath(`/companies/${data.companyId}`);
  return contact;
}

export async function updateContact(id: string, input: ContactInput) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const data = contactSchema.parse(input);

  if (data.isPrimary) {
    await prisma.contact.updateMany({
      where: { companyId: data.companyId, isPrimary: true, NOT: { id } },
      data: { isPrimary: false },
    });
  }

  const before = await prisma.contact.findUniqueOrThrow({ where: { id } });
  const contact = await prisma.contact.update({
    where: { id },
    data: {
      name: data.name,
      nameAr: data.nameAr || null,
      title: data.title || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      isPrimary: data.isPrimary ?? false,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "Contact",
    entityId: contact.id,
    oldValue: before,
    newValue: contact,
  });

  revalidatePath(`/companies/${data.companyId}`);
  return contact;
}

export async function softDeleteContact(id: string, companyId: string) {
  const user = await requireRole(["ADMIN", "FINANCE"]);
  const before = await prisma.contact.findUniqueOrThrow({ where: { id } });
  const contact = await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });

  await writeAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "Contact",
    entityId: contact.id,
    oldValue: before,
    newValue: contact,
  });

  revalidatePath(`/companies/${companyId}`);
}
