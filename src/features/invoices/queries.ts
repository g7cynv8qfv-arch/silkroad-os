import { db, orgDb } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { InvoiceFilters } from './schemas';
import type { FinanceDashboard } from './types';

export const PAGE_SIZE = 50;

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listInvoices(orgId: string, filters: InvoiceFilters) {
  const client = orgDb(orgId);
  const skip = (filters.page - 1) * PAGE_SIZE;

  const where: Prisma.InvoiceWhereInput = {};

  if (filters.q) {
    where.OR = [
      { invoiceNumber: { contains: filters.q, mode: 'insensitive' } },
      { client: { name: { contains: filters.q, mode: 'insensitive' } } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.type) where.type = filters.type;
  if (filters.dateFrom || filters.dateTo) {
    where.issueDate = {
      ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
      ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
    };
  }

  const orderBy: Prisma.InvoiceOrderByWithRelationInput = {
    [filters.sort]: filters.dir,
  };

  const [items, total] = await Promise.all([
    client.invoice.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        status: true,
        issueDate: true,
        dueDate: true,
        currency: true,
        subtotalCents: true,
        taxCents: true,
        totalCents: true,
        paidCents: true,
        sentAt: true,
        createdAt: true,
        client: { select: { id: true, name: true, email: true } },
      },
    }),
    client.invoice.count({ where }),
  ]);

  return { items, total, pageCount: Math.ceil(total / PAGE_SIZE), page: filters.page };
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getInvoice(orgId: string, id: string) {
  return db.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          postalCode: true,
          country: true,
          taxId: true,
        },
      },
      order: { select: { id: true, orderNumber: true } },
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { paidAt: 'asc' } },
    },
  });
}

// ─── Finance dashboard ─────────────────────────────────────────────────────────

export async function getFinanceDashboard(orgId: string): Promise<FinanceDashboard> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400_000);
  const d60 = new Date(now.getTime() - 60 * 86400_000);
  const d90 = new Date(now.getTime() - 90 * 86400_000);
  const d365 = new Date(now.getTime() - 365 * 86400_000);

  const [outstanding, overdueInvoices, paidInvoices, allClients] = await Promise.all([
    // Outstanding balance (SENT + OVERDUE unpaid amounts)
    db.invoice.aggregate({
      where: { organizationId: orgId, status: { in: ['SENT', 'OVERDUE'] } },
      _sum: { totalCents: true, paidCents: true },
    }),
    // Overdue invoices for aging
    db.invoice.findMany({
      where: { organizationId: orgId, status: { in: ['SENT', 'OVERDUE'] }, dueDate: { lt: now } },
      select: { dueDate: true, totalCents: true, paidCents: true },
    }),
    // Paid invoices for revenue chart (last 12 months)
    db.invoice.findMany({
      where: { organizationId: orgId, status: 'PAID', issueDate: { gte: d365 } },
      select: { issueDate: true, totalCents: true },
      orderBy: { issueDate: 'asc' },
    }),
    // All non-cancelled invoices for top clients
    db.invoice.groupBy({
      by: ['clientId'],
      where: { organizationId: orgId, status: { not: 'CANCELLED' } },
      _sum: { totalCents: true },
      _count: { id: true },
      orderBy: { _sum: { totalCents: 'desc' } },
      take: 5,
    }),
  ]);

  const outstandingCents = (outstanding._sum.totalCents ?? 0) - (outstanding._sum.paidCents ?? 0);

  // Aging buckets
  const aging: FinanceDashboard['aging'] = [
    { bucket: '0-30', count: 0, totalCents: 0 },
    { bucket: '31-60', count: 0, totalCents: 0 },
    { bucket: '61-90', count: 0, totalCents: 0 },
    { bucket: '90+', count: 0, totalCents: 0 },
  ];

  for (const inv of overdueInvoices) {
    if (!inv.dueDate) continue;
    const remaining = (inv.totalCents ?? 0) - (inv.paidCents ?? 0);
    const due = inv.dueDate;
    const bucketIndex = due >= d30 ? 0 : due >= d60 ? 1 : due >= d90 ? 2 : 3;
    const bucket = aging[bucketIndex];
    if (bucket) {
      bucket.count++;
      bucket.totalCents += remaining;
    }
  }

  // Revenue chart — group by YYYY-MM
  const monthMap = new Map<string, number>();
  for (const inv of paidInvoices) {
    const key = inv.issueDate.toISOString().slice(0, 7);
    monthMap.set(key, (monthMap.get(key) ?? 0) + inv.totalCents);
  }
  const revenueChart = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totalCents]) => ({ month, totalCents }));

  // Top clients — enrich with names
  const clientIds = allClients.map((c) => c.clientId);
  const clients = await db.client.findMany({
    where: { id: { in: clientIds }, organizationId: orgId },
    select: { id: true, name: true },
  });
  const clientNameMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const topClients = allClients.map((row) => ({
    clientId: row.clientId,
    clientName: clientNameMap[row.clientId] ?? 'Unknown',
    totalCents: row._sum.totalCents ?? 0,
    invoiceCount: row._count.id,
  }));

  return {
    outstandingCents,
    overdueCount: overdueInvoices.length,
    aging,
    revenueChart,
    topClients,
  };
}

// ─── All clients for select ────────────────────────────────────────────────────

export async function listAllClients(orgId: string) {
  return db.client.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true },
  });
}
