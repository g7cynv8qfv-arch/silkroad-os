import type {
  Supplier,
  SupplierContact,
  SupplierProduct,
  SupplierAttachment,
  SupplierInteraction,
  IntelligenceReport,
} from '@prisma/client';

export type { Supplier, CreateSupplier, UpdateSupplier } from './schemas';
export type {
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateContactInput,
  UpdateContactInput,
  CreateProductInput,
  UpdateProductInput,
  CreateInteractionInput,
  ImportRow,
  SupplierFilters,
} from './schemas';

export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export type SupplierWithRelations = Supplier & {
  contacts: SupplierContact[];
  products: SupplierProduct[];
  attachments: (SupplierAttachment & {
    uploadedBy: { firstName: string | null; lastName: string | null } | null;
  })[];
  interactions: (SupplierInteraction & {
    createdBy: { firstName: string | null; lastName: string | null } | null;
  })[];
  intelligenceReports: IntelligenceReport[];
  _count: { orders: number };
};

export type SupplierListItem = Pick<
  Supplier,
  | 'id'
  | 'name'
  | 'country'
  | 'city'
  | 'mainCategory'
  | 'rating'
  | 'riskScore'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
> & {
  _count: { orders: number };
  orders: { createdAt: Date }[];
};

export type ImportRowResult = {
  row: number;
  name: string;
  success: boolean;
  error?: string;
};
