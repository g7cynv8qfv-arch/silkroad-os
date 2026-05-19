import { inngest } from '@/inngest/client';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const flagOverdueInvoices = inngest.createFunction(
  {
    id: 'flag-overdue-invoices',
    name: 'Flag overdue invoices',
    triggers: [{ cron: '0 0 * * *' }],
  },
  async ({ step }) => {
    const now = new Date();

    const overdue = await step.run('find-overdue-invoices', () =>
      db.invoice.findMany({
        where: { status: 'SENT', dueDate: { lt: now } },
        select: { id: true, organizationId: true, invoiceNumber: true },
      }),
    );

    if (overdue.length === 0) {
      logger.info({ count: 0 }, 'flag-overdue-invoices: nothing to update');
      return { updated: 0 };
    }

    await step.run('mark-as-overdue', () =>
      db.$transaction(async (tx) => {
        await tx.invoice.updateMany({
          where: { id: { in: overdue.map((i) => i.id) } },
          data: { status: 'OVERDUE' },
        });

        await tx.activityLog.createMany({
          data: overdue.map((inv) => ({
            organizationId: inv.organizationId,
            userId: null,
            action: 'invoice.overdue_flagged',
            entityType: 'Invoice',
            entityId: inv.id,
            metadata: { invoiceNumber: inv.invoiceNumber, flaggedAt: now.toISOString() },
          })),
        });
      }),
    );

    logger.info({ count: overdue.length }, 'flag-overdue-invoices: marked overdue');
    return { updated: overdue.length };
  },
);
