import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { ClientFilters } from './schemas';

export const PAGE_SIZE = 50;

export async function listClients(orgId: string, filters: ClientFilters) {
  const skip = (filters.page - 1) * PAGE_SIZE;
  const where: Prisma.ClientWhereInput = { organizationId: orgId };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { email: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.country) where.country = filters.country;

  const [clients, total] = await Promise.all([
    db.client.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { invoices: true } },
        invoices: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalCents: true },
        },
      },
    }),
    db.client.count({ where }),
  ]);

  const items = clients.map((c) => ({
    ...c,
    totalRevenueCents: c.invoices.reduce((s, i) => s + i.totalCents, 0),
    invoices: undefined,
  }));

  return { items, total, pageCount: Math.ceil(total / PAGE_SIZE), page: filters.page };
}

export async function getClient(orgId: string, id: string) {
  return db.client.findFirst({
    where: { id, organizationId: orgId },
    include: {
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          issueDate: true,
          dueDate: true,
          totalCents: true,
          paidCents: true,
          currency: true,
        },
      },
      _count: { select: { invoices: true } },
    },
  });
}
