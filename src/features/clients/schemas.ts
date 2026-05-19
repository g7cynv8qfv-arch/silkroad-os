import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().length(2).default('FR'),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientFiltersSchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientFilters = z.infer<typeof clientFiltersSchema>;
