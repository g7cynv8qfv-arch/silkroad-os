'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  createQcReportSchema,
  createShipmentSchema,
  updateShipmentSchema,
  STATUS_TRANSITIONS,
} from './schemas';
import type {
  ActionResult,
  CreateOrderInput,
  UpdateOrderInput,
  CreateQcReportInput,
  CreateShipmentInput,
  UpdateShipmentInput,
} from './types';
import type { Order, Shipment, QualityCheck } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOrderNumber(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${ymd}-${rand}`;
}

// ─── Order CRUD ────────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<ActionResult<Order>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const parsed = createOrderSchema.parse(input);
    const totalCents = parsed.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          organizationId: orgId,
          supplierId: parsed.supplierId ?? null,
          orderNumber: generateOrderNumber(),
          currency: parsed.currency,
          totalCents,
          expectedDeliveryAt: parsed.expectedDeliveryAt
            ? new Date(parsed.expectedDeliveryAt)
            : null,
          notes: parsed.notes ?? null,
          status: 'QUOTED',
        },
      });

      await tx.orderItem.createMany({
        data: parsed.items.map((item) => ({
          organizationId: orgId,
          orderId: created.id,
          productName: item.productName,
          sku: item.sku ?? null,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalCents: item.unitPriceCents * item.quantity,
        })),
      });

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'order.created',
          entityType: 'Order',
          entityId: created.id,
          metadata: { orderNumber: created.orderNumber, totalCents },
        },
      });

      return created;
    });

    revalidatePath('/orders');
    logger.info({ orderId: order.id, orgId }, 'order.created');
    return { success: true, data: order };
  } catch (err) {
    logger.error({ err }, 'createOrder failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function updateOrder(
  orderId: string,
  input: UpdateOrderInput,
): Promise<ActionResult<Order>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const parsed = updateOrderSchema.parse(input);

    const existing = await db.order.findFirst({ where: { id: orderId, organizationId: orgId } });
    if (!existing) return { success: false, error: 'Order not found.' };

    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        supplierId: parsed.supplierId ?? undefined,
        currency: parsed.currency ?? undefined,
        expectedDeliveryAt:
          parsed.expectedDeliveryAt === null
            ? null
            : parsed.expectedDeliveryAt
              ? new Date(parsed.expectedDeliveryAt)
              : undefined,
        notes: parsed.notes === null ? null : (parsed.notes ?? undefined),
      },
    });

    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
    return { success: true, data: updated };
  } catch (err) {
    logger.error({ err }, 'updateOrder failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
): Promise<ActionResult<Order>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const parsed = updateOrderStatusSchema.parse({ status: newStatus });

    const existing = await db.order.findFirst({ where: { id: orderId, organizationId: orgId } });
    if (!existing) return { success: false, error: 'Order not found.' };

    const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(parsed.status)) {
      return {
        success: false,
        error: `Invalid transition: ${existing.status} → ${parsed.status}. Allowed: ${allowed.join(', ') || 'none'}.`,
      };
    }

    const updated = await db.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: parsed.status,
          ...(parsed.status === 'DELIVERED' && { deliveredAt: new Date() }),
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'order.status_changed',
          entityType: 'Order',
          entityId: orderId,
          metadata: { from: existing.status, to: parsed.status },
        },
      });

      return order;
    });

    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
    logger.info({ orderId, from: existing.status, to: parsed.status }, 'order.status_changed');
    return { success: true, data: updated };
  } catch (err) {
    logger.error({ err }, 'updateOrderStatus failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteOrder(orderId: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireRole('ADMIN');
    const existing = await db.order.findFirst({ where: { id: orderId, organizationId: orgId } });
    if (!existing) return { success: false, error: 'Order not found.' };

    await db.order.delete({ where: { id: orderId } });
    revalidatePath('/orders');
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, 'deleteOrder failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── QC Report ────────────────────────────────────────────────────────────────

export async function createQcReport(
  orderId: string,
  input: CreateQcReportInput,
): Promise<ActionResult<QualityCheck>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const existing = await db.order.findFirst({ where: { id: orderId, organizationId: orgId } });
    if (!existing) return { success: false, error: 'Order not found.' };

    const parsed = createQcReportSchema.parse(input);
    const qc = await db.$transaction(async (tx) => {
      const check = await tx.qualityCheck.create({
        data: {
          organizationId: orgId,
          orderId,
          performedAt: new Date(parsed.performedAt),
          inspector: parsed.inspector ?? null,
          passed: parsed.passed,
          defectsFound: parsed.defectsFound,
          reportUrl: parsed.reportUrl ?? null,
          notes: parsed.notes ?? null,
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'order.qc_added',
          entityType: 'Order',
          entityId: orderId,
          metadata: { passed: parsed.passed, defectsFound: parsed.defectsFound },
        },
      });

      return check;
    });

    revalidatePath(`/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}/qc`);
    logger.info({ orderId, passed: parsed.passed }, 'qc_report.created');
    return { success: true, data: qc };
  } catch (err) {
    logger.error({ err }, 'createQcReport failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Shipment ─────────────────────────────────────────────────────────────────

export async function createShipment(
  orderId: string,
  input: CreateShipmentInput,
): Promise<ActionResult<Shipment>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const existing = await db.order.findFirst({ where: { id: orderId, organizationId: orgId } });
    if (!existing) return { success: false, error: 'Order not found.' };

    const parsed = createShipmentSchema.parse(input);
    const shipment = await db.$transaction(async (tx) => {
      const s = await tx.shipment.create({
        data: {
          organizationId: orgId,
          orderId,
          carrier: parsed.carrier ?? null,
          trackingNumber: parsed.trackingNumber ?? null,
          mode: parsed.mode,
          etd: parsed.etd ? new Date(parsed.etd) : null,
          eta: parsed.eta ? new Date(parsed.eta) : null,
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'order.shipment_added',
          entityType: 'Order',
          entityId: orderId,
          metadata: {
            carrier: parsed.carrier ?? null,
            trackingNumber: parsed.trackingNumber ?? null,
          },
        },
      });

      return s;
    });

    revalidatePath(`/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}/shipment`);
    return { success: true, data: shipment };
  } catch (err) {
    logger.error({ err }, 'createShipment failed');
    return { success: false, error: (err as Error).message };
  }
}

export async function updateShipment(
  shipmentId: string,
  orderId: string,
  input: UpdateShipmentInput,
): Promise<ActionResult<Shipment>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const parsed = updateShipmentSchema.parse(input);

    const shipment = await db.shipment.update({
      where: { id: shipmentId, organizationId: orgId },
      data: {
        carrier: parsed.carrier ?? undefined,
        trackingNumber: parsed.trackingNumber ?? undefined,
        mode: parsed.mode ?? undefined,
        etd: parsed.etd === null ? null : parsed.etd ? new Date(parsed.etd) : undefined,
        eta: parsed.eta === null ? null : parsed.eta ? new Date(parsed.eta) : undefined,
      },
    });

    revalidatePath(`/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}/shipment`);
    return { success: true, data: shipment };
  } catch (err) {
    logger.error({ err }, 'updateShipment failed');
    return { success: false, error: (err as Error).message };
  }
}
