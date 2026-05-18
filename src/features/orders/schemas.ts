import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  'QUOTED',
  'CONFIRMED',
  'IN_PRODUCTION',
  'QC',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export const KANBAN_STATUSES = [
  'QUOTED',
  'CONFIRMED',
  'IN_PRODUCTION',
  'QC',
  'SHIPPED',
  'DELIVERED',
] as const;

export const SHIPMENT_MODES = ['AIR', 'SEA', 'RAIL', 'ROAD'] as const;

export const CURRENCIES = ['USD', 'EUR', 'CNY', 'GBP', 'HKD'] as const;

// ─── Status transition graph (enforced server-side) ────────────────────────────

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  QUOTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['QC', 'CANCELLED'],
  QC: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

// ─── Core schemas ─────────────────────────────────────────────────────────────

export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const shipmentModeSchema = z.enum(SHIPMENT_MODES);

export const orderItemInputSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().max(100).optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPriceCents: z.number().int().min(0, 'Price must be non-negative'),
});

export const createOrderSchema = z.object({
  supplierId: z.string().cuid().optional(),
  currency: z.enum(CURRENCIES).default('USD'),
  expectedDeliveryAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(orderItemInputSchema).min(1, 'At least one item is required'),
});

export const updateOrderSchema = z.object({
  supplierId: z.string().cuid().optional(),
  currency: z.enum(CURRENCIES).optional(),
  expectedDeliveryAt: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

// ─── QC report schema ──────────────────────────────────────────────────────────

export const createQcReportSchema = z.object({
  performedAt: z.string().datetime({ offset: true }),
  inspector: z.string().max(100).optional(),
  passed: z.boolean(),
  defectsFound: z.number().int().min(0).default(0),
  reportUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

// ─── Shipment schema ──────────────────────────────────────────────────────────

export const createShipmentSchema = z.object({
  carrier: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  mode: shipmentModeSchema.default('SEA'),
  etd: z.string().datetime({ offset: true }).optional().nullable(),
  eta: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateShipmentSchema = createShipmentSchema.partial();

// ─── Filters ──────────────────────────────────────────────────────────────────

export const orderFiltersSchema = z.object({
  q: z.string().optional(),
  status: orderStatusSchema.optional(),
  supplierId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['createdAt', 'orderNumber', 'totalCents', 'expectedDeliveryAt']).optional(),
  dir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  view: z.enum(['table', 'kanban']).default('table'),
});

// ─── Exported types ───────────────────────────────────────────────────────────

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type ShipmentMode = z.infer<typeof shipmentModeSchema>;
export type OrderFilters = z.infer<typeof orderFiltersSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type CreateQcReportInput = z.infer<typeof createQcReportSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
