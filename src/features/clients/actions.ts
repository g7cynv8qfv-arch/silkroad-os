'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createClientSchema, updateClientSchema } from './schemas';
import type { ActionResult } from './types';
import type { Client } from '@prisma/client';

export async function createClient(input: unknown): Promise<ActionResult<Client>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const parsed = createClientSchema.parse(input);
    const client = await db.client.create({
      data: {
        organizationId: orgId,
        name: parsed.name,
        email: parsed.email ?? null,
        taxId: parsed.taxId ?? null,
        addressLine1: parsed.addressLine1 ?? null,
        addressLine2: parsed.addressLine2 ?? null,
        city: parsed.city ?? null,
        postalCode: parsed.postalCode ?? null,
        country: parsed.country,
        notes: parsed.notes ?? null,
      },
    });
    revalidatePath('/clients');
    logger.info({ clientId: client.id, orgId }, 'client.created');
    return { success: true, data: client };
  } catch (err) {
    logger.error({ err }, 'createClient failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function updateClient(
  clientId: string,
  input: unknown,
): Promise<ActionResult<Client>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const parsed = updateClientSchema.parse(input);

    const existing = await db.client.findFirst({ where: { id: clientId, organizationId: orgId } });
    if (!existing) return { success: false, error: 'Client not found.' };

    const updated = await db.client.update({
      where: { id: clientId },
      data: {
        name: parsed.name ?? undefined,
        email: parsed.email === null ? null : (parsed.email ?? undefined),
        taxId: parsed.taxId === null ? null : (parsed.taxId ?? undefined),
        addressLine1: parsed.addressLine1 === null ? null : (parsed.addressLine1 ?? undefined),
        addressLine2: parsed.addressLine2 === null ? null : (parsed.addressLine2 ?? undefined),
        city: parsed.city === null ? null : (parsed.city ?? undefined),
        postalCode: parsed.postalCode === null ? null : (parsed.postalCode ?? undefined),
        country: parsed.country ?? undefined,
        notes: parsed.notes === null ? null : (parsed.notes ?? undefined),
      },
    });

    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);
    return { success: true, data: updated };
  } catch (err) {
    logger.error({ err }, 'updateClient failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteClient(clientId: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireRole('ADMIN');
    const existing = await db.client.findFirst({ where: { id: clientId, organizationId: orgId } });
    if (!existing) return { success: false, error: 'Client not found.' };

    const hasInvoices = await db.invoice.count({ where: { clientId, organizationId: orgId } });
    if (hasInvoices > 0) {
      return { success: false, error: 'Cannot delete a client with invoices.' };
    }

    await db.client.delete({ where: { id: clientId } });
    revalidatePath('/clients');
    return { success: true };
  } catch (err) {
    logger.error({ err }, 'deleteClient failed');
    return { success: false, error: (err as Error).message };
  }
}
