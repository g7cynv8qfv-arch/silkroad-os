import { z } from 'zod';

export const invoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']);

export const invoiceSchema = z.object({
  id: z.string().cuid(),
  organizationId: z.string(),
  orderId: z.string().nullable(),
  number: z.string().min(1).max(100),
  status: invoiceStatusSchema,
  amountCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default('USD'),
  dueAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
