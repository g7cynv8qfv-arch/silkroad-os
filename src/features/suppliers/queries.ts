import { db, orgDb } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { SupplierFilters } from './schemas';

export const PAGE_SIZE = 50;

export async function listSuppliers(orgId: string, filters: SupplierFilters) {
  const client = orgDb(orgId);
  const skip = (filters.page - 1) * PAGE_SIZE;

  const where: Prisma.SupplierWhereInput = {};

  if (filters.q) {
    where.name = { contains: filters.q, mode: 'insensitive' };
  }
  if (filters.country) where.country = filters.country;
  if (filters.category) where.mainCategory = filters.category;
  if (filters.status) where.status = filters.status;

  if (filters.ratingMin !== undefined || filters.ratingMax !== undefined) {
    where.rating = {
      ...(filters.ratingMin !== undefined && { gte: filters.ratingMin }),
      ...(filters.ratingMax !== undefined && { lte: filters.ratingMax }),
    };
  }
  if (filters.riskMin !== undefined || filters.riskMax !== undefined) {
    where.riskScore = {
      ...(filters.riskMin !== undefined && { gte: filters.riskMin }),
      ...(filters.riskMax !== undefined && { lte: filters.riskMax }),
    };
  }

  const sortField = filters.sort ?? 'createdAt';
  const sortDir = filters.dir ?? 'desc';
  const orderBy: Prisma.SupplierOrderByWithRelationInput = { [sortField]: sortDir };

  const [items, total] = await Promise.all([
    client.supplier.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        mainCategory: true,
        rating: true,
        riskScore: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    client.supplier.count({ where }),
  ]);

  return {
    items,
    total,
    pageCount: Math.ceil(total / PAGE_SIZE),
    page: filters.page,
  };
}

export async function getSupplier(orgId: string, id: string) {
  const client = orgDb(orgId);
  return client.supplier.findFirst({
    where: { id },
    include: {
      contacts: {
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      },
      products: { orderBy: { createdAt: 'asc' } },
      attachments: {
        include: {
          uploadedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      interactions: {
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { occurredAt: 'desc' },
      },
      intelligenceReports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { orders: true } },
    },
  });
}

export async function getSupplierOrders(orgId: string, supplierId: string) {
  return db.order.findMany({
    where: { organizationId: orgId, supplierId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      currency: true,
      expectedDeliveryAt: true,
      deliveredAt: true,
      createdAt: true,
    },
  });
}

export async function getSupplierQualityChecks(orgId: string, supplierId: string) {
  return db.qualityCheck.findMany({
    where: { organizationId: orgId, order: { supplierId } },
    orderBy: { performedAt: 'desc' },
    include: {
      order: { select: { orderNumber: true } },
    },
  });
}

export async function getSupplierStats(orgId: string, supplierId: string) {
  const [orderAgg, qcTotal, qcPassed] = await Promise.all([
    db.order.aggregate({
      where: { organizationId: orgId, supplierId },
      _count: true,
      _sum: { totalCents: true },
    }),
    db.qualityCheck.count({
      where: { organizationId: orgId, order: { supplierId } },
    }),
    db.qualityCheck.count({
      where: { organizationId: orgId, order: { supplierId }, passed: true },
    }),
  ]);

  return {
    totalOrders: orderAgg._count,
    totalSpendCents: orderAgg._sum.totalCents ?? 0,
    qcPassRate: qcTotal > 0 ? qcPassed / qcTotal : null,
  };
}
