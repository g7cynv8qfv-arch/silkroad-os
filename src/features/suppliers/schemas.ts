import { z } from 'zod';

export const supplierSchema = z.object({
  id: z.string().cuid(),
  organizationId: z.string(),
  name: z.string().min(1).max(255),
  country: z.string().length(2).default('CN'),
  website: z.string().url().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSupplierSchema = supplierSchema.omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type Supplier = z.infer<typeof supplierSchema>;
export type CreateSupplier = z.infer<typeof createSupplierSchema>;
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>;
