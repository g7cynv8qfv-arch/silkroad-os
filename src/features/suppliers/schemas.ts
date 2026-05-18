import { z } from 'zod';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SUPPLIER_CATEGORIES = [
  'Electronics',
  'Textiles',
  'Furniture',
  'Machinery',
  'Toys & Games',
  'Food & Beverage',
  'Automotive',
  'Chemicals',
  'Metals',
  'Plastics',
  'Health & Beauty',
  'Sports & Outdoors',
  'Home & Garden',
  'Office Supplies',
  'Packaging',
  'Other',
] as const;

export const SUPPLIER_STATUSES = ['ACTIVE', 'ARCHIVED', 'BLACKLISTED'] as const;

export const INTERACTION_TYPES = ['EMAIL', 'CALL', 'MEETING', 'SAMPLE', 'QC'] as const;

export const SORT_COLUMNS = [
  'name',
  'country',
  'rating',
  'riskScore',
  'createdAt',
  'updatedAt',
] as const;

const urlOrEmpty = z.union([z.string().url(), z.literal(''), z.undefined()]);

// ─── Step 1: Company Info ─────────────────────────────────────────────────────

export const createSupplierStep1Schema = z.object({
  name: z.string().min(1, 'required').max(255),
  country: z.string().length(2).default('CN'),
  city: z.string().max(100).optional(),
  websiteUrl: urlOrEmpty,
  alibabaUrl: urlOrEmpty,
  the1688Url: urlOrEmpty,
  mainCategory: z.string().optional(),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).nullable().optional(),
  employeeCount: z.number().int().min(1).nullable().optional(),
  certifications: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional(),
});

// ─── Step 2: Contacts ─────────────────────────────────────────────────────────

export const contactInputSchema = z.object({
  name: z.string().min(1, 'required').max(255),
  role: z.string().max(100).optional(),
  email: z.union([z.string().email(), z.literal(''), z.undefined()]),
  phone: z.string().max(50).optional(),
  wechat: z.string().max(100).optional(),
  whatsapp: z.string().max(50).optional(),
  isPrimary: z.boolean().default(false),
});

export const createSupplierStep2Schema = z.object({
  contacts: z.array(contactInputSchema).default([]),
});

// ─── Step 3: Products ─────────────────────────────────────────────────────────

export const productInputSchema = z.object({
  name: z.string().min(1, 'required').max(255),
  sku: z.string().max(100).optional(),
  moq: z.number().int().min(1).nullable().optional(),
  unitPriceCents: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).default('USD'),
  leadTimeDays: z.number().int().min(0).nullable().optional(),
});

export const createSupplierStep3Schema = z.object({
  products: z.array(productInputSchema).default([]),
});

// ─── Combined create / update ─────────────────────────────────────────────────

export const createSupplierSchema = createSupplierStep1Schema
  .merge(createSupplierStep2Schema)
  .merge(createSupplierStep3Schema);

export const updateSupplierSchema = createSupplierStep1Schema.partial();

// ─── Standalone contact / product schemas ─────────────────────────────────────

export const createContactSchema = contactInputSchema;
export const updateContactSchema = contactInputSchema.partial();

export const createProductSchema = productInputSchema;
export const updateProductSchema = productInputSchema.partial();

// ─── Interaction ──────────────────────────────────────────────────────────────

export const createInteractionSchema = z.object({
  type: z.enum(INTERACTION_TYPES),
  summary: z.string().min(1).max(5000),
  occurredAt: z.coerce.date(),
});

// ─── List filters ─────────────────────────────────────────────────────────────

export const supplierFiltersSchema = z.object({
  q: z.string().optional(),
  country: z.string().length(2).optional(),
  category: z.string().optional(),
  status: z.enum(SUPPLIER_STATUSES).optional(),
  ratingMin: z.coerce.number().min(0).max(5).optional(),
  ratingMax: z.coerce.number().min(0).max(5).optional(),
  riskMin: z.coerce.number().min(0).max(10).optional(),
  riskMax: z.coerce.number().min(0).max(10).optional(),
  sort: z.enum(SORT_COLUMNS).optional(),
  dir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

// ─── Excel import row ─────────────────────────────────────────────────────────

export const importRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  country: z.string().length(2).default('CN'),
  city: z.string().optional(),
  websiteUrl: urlOrEmpty,
  mainCategory: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  notes: z.string().optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type SupplierFilters = z.infer<typeof supplierFiltersSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
export type ImportRow = z.infer<typeof importRowSchema>;

// Legacy aliases (kept for backward compatibility with types.ts)
export type Supplier = {
  id: string;
  organizationId: string;
  name: string;
  country: string;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};
export type CreateSupplier = CreateSupplierInput;
export type UpdateSupplier = UpdateSupplierInput;
