'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { computeInvoiceTotals } from '@/lib/currency';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  INVOICE_STATUS_TRANSITIONS,
} from './schemas';
import type { ActionResult } from './types';
import type { Invoice, Payment, InvoiceStatus as PrismaInvoiceStatus } from '@prisma/client';

// ─── Invoice number generation ─────────────────────────────────────────────────

async function generateInvoiceNumber(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SR-${year}-`;
  const last = await db.invoice.findFirst({
    where: { organizationId: orgId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });
  let seq = 1;
  if (last) {
    const parts = last.invoiceNumber.split('-');
    const n = parseInt(parts[parts.length - 1] ?? '0', 10);
    seq = (isNaN(n) ? 0 : n) + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createInvoice(input: unknown): Promise<ActionResult<Invoice>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const parsed = createInvoiceSchema.parse(input);

    const clientExists = await db.client.findFirst({
      where: { id: parsed.clientId, organizationId: orgId },
    });
    if (!clientExists) return { success: false, error: 'Client not found.' };

    const { subtotalCents, taxCents, totalCents } = computeInvoiceTotals(
      parsed.items,
      parsed.taxRateBps,
    );

    const invoice = await db.$transaction(async (tx) => {
      const number = await generateInvoiceNumber(orgId);
      const created = await tx.invoice.create({
        data: {
          organizationId: orgId,
          clientId: parsed.clientId,
          orderId: parsed.orderId ?? null,
          invoiceNumber: number,
          type: parsed.type,
          currency: parsed.currency,
          issueDate: parsed.issueDate ? new Date(parsed.issueDate) : new Date(),
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
          taxRateBps: parsed.taxRateBps,
          paymentTermsDays: parsed.paymentTermsDays ?? null,
          notes: parsed.notes ?? null,
          subtotalCents,
          taxCents,
          totalCents,
          status: 'DRAFT',
        },
      });

      await tx.invoiceItem.createMany({
        data: parsed.items.map((item) => ({
          organizationId: orgId,
          invoiceId: created.id,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalCents: item.unitPriceCents * item.quantity,
        })),
      });

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'invoice.created',
          entityType: 'Invoice',
          entityId: created.id,
          metadata: { invoiceNumber: number, totalCents },
        },
      });

      return created;
    });

    revalidatePath('/invoices');
    logger.info({ invoiceId: invoice.id, orgId }, 'invoice.created');
    return { success: true, data: invoice };
  } catch (err) {
    logger.error({ err }, 'createInvoice failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Update (draft only) ──────────────────────────────────────────────────────

export async function updateInvoice(
  invoiceId: string,
  input: unknown,
): Promise<ActionResult<Invoice>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const parsed = updateInvoiceSchema.parse(input);

    const existing = await db.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    });
    if (!existing) return { success: false, error: 'Invoice not found.' };
    if (existing.status !== 'DRAFT') {
      return { success: false, error: 'Only draft invoices can be edited.' };
    }

    const items = parsed.items ?? [];
    const taxRateBps = parsed.taxRateBps ?? existing.taxRateBps;
    const { subtotalCents, taxCents, totalCents } =
      items.length > 0
        ? computeInvoiceTotals(items, taxRateBps)
        : {
            subtotalCents: existing.subtotalCents,
            taxCents: existing.taxCents,
            totalCents: existing.totalCents,
          };

    const updated = await db.$transaction(async (tx) => {
      if (items.length > 0) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId, organizationId: orgId } });
        await tx.invoiceItem.createMany({
          data: items.map((item) => ({
            organizationId: orgId,
            invoiceId,
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalCents: item.unitPriceCents * item.quantity,
          })),
        });
      }

      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          orderId: parsed.orderId === null ? null : (parsed.orderId ?? undefined),
          type: parsed.type ?? undefined,
          currency: parsed.currency ?? undefined,
          issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
          dueDate:
            parsed.dueDate === null ? null : parsed.dueDate ? new Date(parsed.dueDate) : undefined,
          taxRateBps,
          paymentTermsDays:
            parsed.paymentTermsDays === null ? null : (parsed.paymentTermsDays ?? undefined),
          notes: parsed.notes === null ? null : (parsed.notes ?? undefined),
          subtotalCents,
          taxCents,
          totalCents,
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'invoice.updated',
          entityType: 'Invoice',
          entityId: invoiceId,
          metadata: {},
        },
      });

      return inv;
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, data: updated };
  } catch (err) {
    logger.error({ err }, 'updateInvoice failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendInvoice(invoiceId: string): Promise<ActionResult<Invoice>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
      include: {
        client: true,
        items: true,
        organization: true,
      },
    });
    if (!invoice) return { success: false, error: 'Invoice not found.' };
    if (!['DRAFT', 'SENT'].includes(invoice.status)) {
      return { success: false, error: 'Invoice cannot be sent in its current status.' };
    }
    if (!invoice.client.email) {
      return { success: false, error: 'Client has no email address.' };
    }

    const resendKey = process.env['RESEND_API_KEY'];
    const fromEmail = process.env['RESEND_FROM_EMAIL'] ?? 'invoices@silkroute.app';

    if (!resendKey) {
      return {
        success: false,
        error: 'Email non configuré. Ajoutez RESEND_API_KEY dans votre .env.local.',
      };
    }

    {
      try {
        const [{ renderInvoicePdf }, { Resend }, { InvoiceEmailTemplate }, { render }] =
          await Promise.all([
            import('@/lib/pdf/render'),
            import('resend'),
            import('@/emails/InvoiceEmail'),
            import('@react-email/components'),
          ]);
        const React = await import('react');

        const pdfBuffer = await renderInvoicePdf(invoice);

        const emailHtml = await render(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (React as any).createElement(InvoiceEmailTemplate, { invoice }),
        );

        const resend = new Resend(resendKey);
        const sendResult = await resend.emails.send({
          from: fromEmail,
          to: [invoice.client.email],
          subject: `Invoice ${invoice.invoiceNumber} — ${invoice.organization.name}`,
          html: emailHtml,
          attachments: [
            {
              filename: `${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer.toString('base64'),
            },
          ],
        });

        await db.activityLog.create({
          data: {
            organizationId: orgId,
            userId,
            action: 'invoice.email_sent',
            entityType: 'Invoice',
            entityId: invoiceId,
            metadata: { to: invoice.client.email, emailId: sendResult.data?.id ?? null },
          },
        });
      } catch (emailErr) {
        logger.error({ emailErr, invoiceId }, 'invoice email send failed');
        await db.activityLog.create({
          data: {
            organizationId: orgId,
            userId,
            action: 'invoice.email_failed',
            entityType: 'Invoice',
            entityId: invoiceId,
            metadata: { error: (emailErr as Error).message },
          },
        });
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'SENT', sentAt: new Date() },
      });
      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'invoice.sent',
          entityType: 'Invoice',
          entityId: invoiceId,
          metadata: {},
        },
      });
      return inv;
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    logger.info({ invoiceId }, 'invoice.sent');
    return { success: true, data: updated };
  } catch (err) {
    logger.error({ err }, 'sendInvoice failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Record payment ───────────────────────────────────────────────────────────

export async function recordPayment(
  invoiceId: string,
  input: unknown,
): Promise<ActionResult<Payment>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const parsed = recordPaymentSchema.parse(input);

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    });
    if (!invoice) return { success: false, error: 'Invoice not found.' };
    if (!['SENT', 'OVERDUE'].includes(invoice.status)) {
      return { success: false, error: 'Payment can only be recorded on sent or overdue invoices.' };
    }

    const newPaidCents = invoice.paidCents + parsed.amountCents;
    const newStatus = newPaidCents >= invoice.totalCents ? 'PAID' : invoice.status;

    const payment = await db.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          organizationId: orgId,
          invoiceId,
          amountCents: parsed.amountCents,
          currency: parsed.currency,
          method: parsed.method,
          paidAt: new Date(parsed.paidAt),
          reference: parsed.reference ?? null,
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidCents: newPaidCents, status: newStatus },
      });

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'invoice.payment_recorded',
          entityType: 'Invoice',
          entityId: invoiceId,
          metadata: { amountCents: parsed.amountCents, method: parsed.method, newStatus },
        },
      });

      return p;
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    logger.info({ invoiceId, amountCents: parsed.amountCents }, 'invoice.payment_recorded');
    return { success: true, data: payment };
  } catch (err) {
    logger.error({ err }, 'recordPayment failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Update status ────────────────────────────────────────────────────────────

export async function updateInvoiceStatus(
  invoiceId: string,
  targetStatus: PrismaInvoiceStatus,
): Promise<ActionResult<Invoice>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const invoice = await db.invoice.findFirst({ where: { id: invoiceId, organizationId: orgId } });
    if (!invoice) return { success: false, error: 'Invoice not found.' };

    const allowed = INVOICE_STATUS_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes(targetStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${invoice.status} to ${targetStatus}.`,
      };
    }

    const updated = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: targetStatus },
      });
      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'invoice.status_updated',
          entityType: 'Invoice',
          entityId: invoiceId,
          metadata: { from: invoice.status, to: targetStatus },
        },
      });
      return inv;
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    logger.info({ invoiceId, from: invoice.status, to: targetStatus }, 'invoice.status_updated');
    return { success: true, data: updated };
  } catch (err) {
    logger.error({ err }, 'updateInvoiceStatus failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelInvoice(invoiceId: string): Promise<ActionResult<Invoice>> {
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const invoice = await db.invoice.findFirst({ where: { id: invoiceId, organizationId: orgId } });
    if (!invoice) return { success: false, error: 'Invoice not found.' };

    const allowed = INVOICE_STATUS_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes('CANCELLED')) {
      return { success: false, error: `Cannot cancel invoice in ${invoice.status} status.` };
    }

    const updated = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'CANCELLED' },
      });
      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'invoice.cancelled',
          entityType: 'Invoice',
          entityId: invoiceId,
          metadata: { from: invoice.status },
        },
      });
      return inv;
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, data: updated };
  } catch (err) {
    logger.error({ err }, 'cancelInvoice failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Delete (draft only) ──────────────────────────────────────────────────────

export async function deleteInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireRole('ADMIN');
    const invoice = await db.invoice.findFirst({ where: { id: invoiceId, organizationId: orgId } });
    if (!invoice) return { success: false, error: 'Invoice not found.' };
    if (!['DRAFT', 'CANCELLED'].includes(invoice.status)) {
      return {
        success: false,
        error: 'Seules les factures DRAFT ou CANCELLED peuvent être supprimées.',
      };
    }
    await db.invoice.delete({ where: { id: invoiceId } });
    revalidatePath('/invoices');
    return { success: true };
  } catch (err) {
    logger.error({ err }, 'deleteInvoice failed');
    return { success: false, error: (err as Error).message };
  }
}
