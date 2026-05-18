import { db, orgDb } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { OrderFilters } from './schemas';

export const PAGE_SIZE = 50;

export async function listOrders(orgId: string, filters: OrderFilters) {
  const client = orgDb(orgId);
  const skip = (filters.page - 1) * PAGE_SIZE;

  const where: Prisma.OrderWhereInput = {};

  if (filters.q) {
    where.OR = [
      { orderNumber: { contains: filters.q, mode: 'insensitive' } },
      { supplier: { name: { contains: filters.q, mode: 'insensitive' } } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
      ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
    };
  }

  const sortField = filters.sort ?? 'createdAt';
  const sortDir = filters.dir ?? 'desc';
  const orderBy: Prisma.OrderOrderByWithRelationInput = { [sortField]: sortDir };

  const [items, total] = await Promise.all([
    client.order.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        expectedDeliveryAt: true,
        deliveredAt: true,
        createdAt: true,
        updatedAt: true,
        supplier: {
          select: { id: true, name: true, country: true },
        },
      },
    }),
    client.order.count({ where }),
  ]);

  return { items, total, pageCount: Math.ceil(total / PAGE_SIZE), page: filters.page };
}

export async function listAllOrders(orgId: string) {
  return orgDb(orgId).order.findMany({
    where: { status: { not: 'CANCELLED' } },
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
      updatedAt: true,
      supplier: {
        select: { id: true, name: true, country: true },
      },
    },
  });
}

export async function getOrder(orgId: string, id: string) {
  return db.order.findFirst({
    where: { id, organizationId: orgId },
    include: {
      supplier: { select: { id: true, name: true, country: true, city: true } },
      items: { orderBy: { createdAt: 'asc' } },
      shipments: { orderBy: { createdAt: 'desc' } },
      qualityChecks: { orderBy: { performedAt: 'desc' } },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          totalCents: true,
          status: true,
          currency: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
}

export async function getOrderTimeline(orgId: string, orderId: string) {
  return db.activityLog.findMany({
    where: {
      organizationId: orgId,
      entityType: 'Order',
      entityId: orderId,
      action: { in: ['order.created', 'order.status_changed'] },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      action: true,
      metadata: true,
      createdAt: true,
    },
  });
}
