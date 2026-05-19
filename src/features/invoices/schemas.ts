import { z } from 'zod';
import { CURRENCIES } from '@/lib/currency';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const INVOICE_TYPES = ['PROFORMA', 'COMMERCIAL', 'CREDIT_NOTE'] as const;
export const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
export const PAYMENT_METHODS = [
  'WIRE_TRANSFER',
  'PAYPAL',
  'CREDIT_CARD',
  'CRYPTO',
  'OTHER',
] as const;

export const INVOICE_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PAID', 'CANCELLED'],
  PAID: ['SENT', 'OVERDUE'],
  CANCELLED: [],
};

// ─── Core schemas ─────────────────────────────────────────────────────────────

export const invoiceItemInputSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().int().min(1, 'Min 1'),
  unitPriceCents: z.number().int().min(0, 'Must be non-negative'),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().cuid('Invalid client'),
  orderId: z.string().cuid().optional(),
  type: z.enum(INVOICE_TYPES).default('COMMERCIAL'),
  currency: z.enum(CURRENCIES).default('USD'),
  issueDate: z.string().datetime({ offset: true }).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  taxRateBps: z.number().int().min(0).max(50000).default(0),
  paymentTermsDays: z.number().int().min(0).max(365).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(invoiceItemInputSchema).min(1, 'At least one item is required'),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().omit({ clientId: true });

export const recordPaymentSchema = z.object({
  amountCents: z.number().int().positive('Amount must be positive'),
  currency: z.enum(CURRENCIES),
  method: z.enum(PAYMENT_METHODS).default('WIRE_TRANSFER'),
  paidAt: z.string().datetime({ offset: true }),
  reference: z.string().max(200).optional().nullable(),
});

export const invoiceFiltersSchema = z.object({
  q: z.string().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  clientId: z.string().optional(),
  type: z.enum(INVOICE_TYPES).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  sort: z
    .enum(['issueDate', 'dueDate', 'totalCents', 'invoiceNumber', 'createdAt'])
    .default('createdAt'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  tab: z.enum(['invoices', 'finance']).default('invoices'),
});

// ─── Exported types ───────────────────────────────────────────────────────────

export type InvoiceType = (typeof INVOICE_TYPES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
