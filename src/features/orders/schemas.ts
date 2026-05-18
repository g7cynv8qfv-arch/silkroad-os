import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'DRAFT',
  'CONFIRMED',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export const orderSchema = z.object({
  id: z.string().cuid(),
  organizationId: z.string(),
  reference: z.string().min(1).max(100),
  status: orderStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type Order = z.infer<typeof orderSchema>;
