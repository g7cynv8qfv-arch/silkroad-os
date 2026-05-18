'use server';

import { revalidatePath } from 'next/cache';
import { db, orgDb } from '@/lib/db';
import { getCurrentOrg, requireRole } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  createSupplierSchema,
  updateSupplierSchema,
  createContactSchema,
  updateContactSchema,
  createProductSchema,
  updateProductSchema,
  createInteractionSchema,
  importRowSchema,
} from './schemas';
import type {
  ActionResult,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateContactInput,
  UpdateContactInput,
  CreateProductInput,
  UpdateProductInput,
  CreateInteractionInput,
  ImportRow,
  ImportRowResult,
} from './types';
import type {
  Supplier,
  SupplierContact,
  SupplierProduct,
  SupplierInteraction,
} from '@prisma/client';

// ─── Supplier CRUD ────────────────────────────────────────────────────────────

export async function createSupplier(input: CreateSupplierInput): Promise<ActionResult<Supplier>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const parsed = createSupplierSchema.parse(input);
    const { contacts, products, ...supplierData } = parsed;

    const supplier = await db.$transaction(async (tx) => {
      const created = await tx.supplier.create({
        data: {
          ...supplierData,
          organizationId: orgId,
          websiteUrl: supplierData.websiteUrl || null,
          alibabaUrl: supplierData.alibabaUrl || null,
          the1688Url: supplierData.the1688Url || null,
        },
      });

      if (contacts.length > 0) {
        await tx.supplierContact.createMany({
          data: contacts.map((c) => ({
            ...c,
            email: c.email || null,
            supplierId: created.id,
            organizationId: orgId,
          })),
        });
      }

      if (products.length > 0) {
        await tx.supplierProduct.createMany({
          data: products.map((p) => ({
            ...p,
            supplierId: created.id,
            organizationId: orgId,
          })),
        });
      }

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'supplier.created',
          entityType: 'Supplier',
          entityId: created.id,
          metadata: { name: created.name },
        },
      });

      return created;
    });

    revalidatePath('/suppliers');
    logger.info({ supplierId: supplier.id, orgId }, 'supplier.created');
    return { success: true, data: supplier };
  } catch (err) {
    logger.error({ err }, 'createSupplier failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierInput,
): Promise<ActionResult<Supplier>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const parsed = updateSupplierSchema.parse(input);

    const existing = await orgDb(orgId).supplier.findFirst({ where: { id } });
    if (!existing) return { success: false, error: 'Supplier not found.' };

    const updated = await db.supplier.update({
      where: { id },
      data: {
        ...parsed,
        websiteUrl: parsed.websiteUrl === '' ? null : (parsed.websiteUrl ?? undefined),
        alibabaUrl: parsed.alibabaUrl === '' ? null : (parsed.alibabaUrl ?? undefined),
        the1688Url: parsed.the1688Url === '' ? null : (parsed.the1688Url ?? undefined),
      },
    });

    revalidatePath('/suppliers');
    revalidatePath(`/suppliers/${id}`);
    return { success: true, data: updated };
  } catch (err) {
    logger.error({ err }, 'updateSupplier failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function archiveSuppliers(ids: string[]): Promise<ActionResult> {
  try {
    const { orgId } = await requireRole('MEMBER');
    await db.supplier.updateMany({
      where: { id: { in: ids }, organizationId: orgId },
      data: { status: 'ARCHIVED' },
    });
    revalidatePath('/suppliers');
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, 'archiveSuppliers failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireRole('ADMIN');
    const existing = await orgDb(orgId).supplier.findFirst({ where: { id } });
    if (!existing) return { success: false, error: 'Supplier not found.' };
    await db.supplier.delete({ where: { id } });
    revalidatePath('/suppliers');
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, 'deleteSupplier failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function createContact(
  supplierId: string,
  input: CreateContactInput,
): Promise<ActionResult<SupplierContact>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const supplier = await orgDb(orgId).supplier.findFirst({ where: { id: supplierId } });
    if (!supplier) return { success: false, error: 'Supplier not found.' };

    const parsed = createContactSchema.parse(input);
    const contact = await db.supplierContact.create({
      data: {
        ...parsed,
        email: parsed.email || null,
        supplierId,
        organizationId: orgId,
      },
    });

    revalidatePath(`/suppliers/${supplierId}`);
    return { success: true, data: contact };
  } catch (err) {
    logger.error({ err }, 'createContact failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function updateContact(
  id: string,
  supplierId: string,
  input: UpdateContactInput,
): Promise<ActionResult<SupplierContact>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const parsed = updateContactSchema.parse(input);
    const contact = await db.supplierContact.update({
      where: { id, organizationId: orgId },
      data: {
        ...parsed,
        email: parsed.email === '' ? null : (parsed.email ?? undefined),
      },
    });
    revalidatePath(`/suppliers/${supplierId}`);
    return { success: true, data: contact };
  } catch (err) {
    logger.error({ err }, 'updateContact failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteContact(id: string, supplierId: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireRole('MEMBER');
    await db.supplierContact.delete({ where: { id, organizationId: orgId } });
    revalidatePath(`/suppliers/${supplierId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, 'deleteContact failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function createProduct(
  supplierId: string,
  input: CreateProductInput,
): Promise<ActionResult<SupplierProduct>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const supplier = await orgDb(orgId).supplier.findFirst({ where: { id: supplierId } });
    if (!supplier) return { success: false, error: 'Supplier not found.' };

    const parsed = createProductSchema.parse(input);
    const product = await db.supplierProduct.create({
      data: { ...parsed, supplierId, organizationId: orgId },
    });
    revalidatePath(`/suppliers/${supplierId}`);
    return { success: true, data: product };
  } catch (err) {
    logger.error({ err }, 'createProduct failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function updateProduct(
  id: string,
  supplierId: string,
  input: UpdateProductInput,
): Promise<ActionResult<SupplierProduct>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const parsed = updateProductSchema.parse(input);
    const product = await db.supplierProduct.update({
      where: { id, organizationId: orgId },
      data: parsed,
    });
    revalidatePath(`/suppliers/${supplierId}`);
    return { success: true, data: product };
  } catch (err) {
    logger.error({ err }, 'updateProduct failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteProduct(id: string, supplierId: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireRole('MEMBER');
    await db.supplierProduct.delete({ where: { id, organizationId: orgId } });
    revalidatePath(`/suppliers/${supplierId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, 'deleteProduct failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Interactions / Notes ─────────────────────────────────────────────────────

export async function addInteraction(
  supplierId: string,
  input: CreateInteractionInput,
): Promise<ActionResult<SupplierInteraction>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const supplier = await orgDb(orgId).supplier.findFirst({ where: { id: supplierId } });
    if (!supplier) return { success: false, error: 'Supplier not found.' };

    const parsed = createInteractionSchema.parse(input);
    const interaction = await db.supplierInteraction.create({
      data: {
        ...parsed,
        occurredAt:
          parsed.occurredAt instanceof Date ? parsed.occurredAt : new Date(parsed.occurredAt),
        supplierId,
        organizationId: orgId,
        createdById: userId,
      },
    });
    revalidatePath(`/suppliers/${supplierId}`);
    return { success: true, data: interaction };
  } catch (err) {
    logger.error({ err }, 'addInteraction failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Bulk import ──────────────────────────────────────────────────────────────

export async function importSuppliers(
  rows: ImportRow[],
): Promise<ActionResult<{ imported: number; results: ImportRowResult[] }>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const results: ImportRowResult[] = [];
    let imported = 0;

    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const parsed = importRowSchema.safeParse(row);
        if (!parsed.success) {
          results.push({
            row: i + 1,
            name: row.name ?? '',
            success: false,
            error: parsed.error.errors[0]?.message,
          });
          continue;
        }
        await tx.supplier.create({
          data: {
            name: parsed.data.name,
            country: parsed.data.country,
            city: parsed.data.city ?? null,
            websiteUrl: parsed.data.websiteUrl || null,
            mainCategory: parsed.data.mainCategory ?? null,
            rating: parsed.data.rating ?? null,
            notes: parsed.data.notes ?? null,
            organizationId: orgId,
          },
        });
        results.push({ row: i + 1, name: parsed.data.name, success: true });
        imported++;
      }
    });

    revalidatePath('/suppliers');
    return { success: true, data: { imported, results } };
  } catch (err) {
    logger.error({ err }, 'importSuppliers failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export async function exportSuppliersCSV(): Promise<ActionResult<string>> {
  try {
    const { orgId } = await getCurrentOrg();
    const suppliers = await orgDb(orgId).supplier.findMany({
      orderBy: { name: 'asc' },
    });

    const header = [
      'Name',
      'Country',
      'City',
      'Category',
      'Website',
      'Rating',
      'Risk Score',
      'Status',
      'Year Est.',
      'Employees',
      'Notes',
      'Created At',
    ].join(',');

    const rows = suppliers.map((s) =>
      [
        `"${s.name.replace(/"/g, '""')}"`,
        s.country,
        s.city ?? '',
        s.mainCategory ?? '',
        s.websiteUrl ?? '',
        s.rating ?? '',
        s.riskScore ?? '',
        s.status,
        s.yearEstablished ?? '',
        s.employeeCount ?? '',
        `"${(s.notes ?? '').replace(/"/g, '""')}"`,
        s.createdAt.toISOString().slice(0, 10),
      ].join(','),
    );

    return { success: true, data: [header, ...rows].join('\n') };
  } catch (err) {
    logger.error({ err }, 'exportSuppliersCSV failed');
    return { success: false, error: (err as Error).message };
  }
}
