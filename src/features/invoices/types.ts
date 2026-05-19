import type { Invoice, InvoiceItem, Payment, Client, Order } from '@prisma/client';

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export type InvoiceListItem = Pick<
  Invoice,
  | 'id'
  | 'invoiceNumber'
  | 'type'
  | 'status'
  | 'issueDate'
  | 'dueDate'
  | 'currency'
  | 'subtotalCents'
  | 'taxCents'
  | 'totalCents'
  | 'paidCents'
  | 'sentAt'
  | 'createdAt'
> & {
  client: Pick<Client, 'id' | 'name' | 'email'>;
};

export type InvoiceDetail = Invoice & {
  client: Pick<
    Client,
    | 'id'
    | 'name'
    | 'email'
    | 'addressLine1'
    | 'addressLine2'
    | 'city'
    | 'postalCode'
    | 'country'
    | 'taxId'
  >;
  order: Pick<Order, 'id' | 'orderNumber'> | null;
  items: InvoiceItem[];
  payments: Payment[];
};

export type FinanceDashboard = {
  outstandingCents: number;
  overdueCount: number;
  aging: {
    bucket: '0-30' | '31-60' | '61-90' | '90+';
    count: number;
    totalCents: number;
  }[];
  revenueChart: {
    month: string;
    totalCents: number;
  }[];
  topClients: {
    clientId: string;
    clientName: string;
    totalCents: number;
    invoiceCount: number;
  }[];
};
