import { db } from '@/lib/db';
import { type SupplierStatus, type OrderStatus, type InvoiceStatus } from '@prisma/client';

export async function querySuppliers(orgId: string, filters?: { status?: string; limit?: number }) {
  return db.supplier.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.status ? { status: filters.status as SupplierStatus } : {}),
    },
    orderBy: { riskScore: 'desc' },
    take: filters?.limit ?? 10,
    select: {
      id: true,
      name: true,
      country: true,
      riskScore: true,
      rating: true,
      status: true,
      mainCategory: true,
    },
  });
}

export async function queryOrders(orgId: string, filters?: { status?: string; late?: boolean }) {
  const now = new Date();
  return db.order.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.status ? { status: filters.status as OrderStatus } : {}),
      ...(filters?.late
        ? {
            expectedDeliveryAt: { lt: now },
            status: { notIn: ['DELIVERED', 'CANCELLED'] },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      currency: true,
      expectedDeliveryAt: true,
      createdAt: true,
      supplier: { select: { name: true } },
    },
  });
}

export async function queryInvoices(
  orgId: string,
  filters?: { status?: string; period?: 'this_month' | 'last_month' },
) {
  let dateFilter: Record<string, unknown> = {};
  if (filters?.period === 'this_month') {
    const now = new Date();
    dateFilter = { issueDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
  } else if (filters?.period === 'last_month') {
    const now = new Date();
    dateFilter = {
      issueDate: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    };
  }

  return db.invoice.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.status ? { status: filters.status as InvoiceStatus } : {}),
      ...dateFilter,
    },
    orderBy: { issueDate: 'desc' },
    take: 20,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      totalCents: true,
      currency: true,
      issueDate: true,
      dueDate: true,
      client: { select: { name: true } },
    },
  });
}

export async function getSupplierIntelligence(orgId: string, supplierId: string) {
  return db.intelligenceReport.findFirst({
    where: { organizationId: orgId, supplierId },
    orderBy: { createdAt: 'desc' },
    select: {
      riskScore: true,
      credibilityScore: true,
      qualitySignal: true,
      summary: true,
      redFlags: true,
      opportunities: true,
      createdAt: true,
      model: true,
    },
  });
}

export async function computeKpi(
  orgId: string,
  kpi: string,
  period?: 'this_month' | 'last_month',
): Promise<{ kpi: string; period: string; valueCents: number; valueFormatted: string }> {
  let dateFilter: Record<string, unknown> = {};
  if (period === 'this_month') {
    const now = new Date();
    dateFilter = { issueDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
  } else if (period === 'last_month') {
    const now = new Date();
    dateFilter = {
      issueDate: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    };
  }

  if (kpi === 'revenue' || kpi === 'total_revenue') {
    const result = await db.invoice.aggregate({
      where: {
        organizationId: orgId,
        status: { in: ['SENT', 'PAID'] },
        ...dateFilter,
      },
      _sum: { totalCents: true },
    });
    const valueCents = result._sum.totalCents ?? 0;
    return {
      kpi: 'revenue',
      period: period ?? 'all_time',
      valueCents,
      valueFormatted: `$${(valueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    };
  }

  if (kpi === 'margin') {
    const result = await db.order.aggregate({
      where: {
        organizationId: orgId,
        status: 'DELIVERED',
        marginCents: { not: null },
        ...dateFilter,
      },
      _sum: { marginCents: true, totalCents: true },
    });
    const margin = result._sum.marginCents ?? 0;
    const total = result._sum.totalCents ?? 0;
    const pct = total > 0 ? ((margin / total) * 100).toFixed(1) : '0';
    return {
      kpi: 'margin',
      period: period ?? 'all_time',
      valueCents: margin,
      valueFormatted: `${pct}%`,
    };
  }

  return { kpi, period: period ?? 'all_time', valueCents: 0, valueFormatted: 'N/A' };
}

export async function compareSuppliers(orgId: string, supplierIds: string[]) {
  return db.supplier.findMany({
    where: { id: { in: supplierIds }, organizationId: orgId },
    include: {
      intelligenceReports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { riskScore: true, credibilityScore: true, qualitySignal: true },
      },
      _count: { select: { orders: true } },
    },
  });
}
