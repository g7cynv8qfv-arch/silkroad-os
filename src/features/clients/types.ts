import type { Client } from '@prisma/client';

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ClientListItem = Client & {
  _count: { invoices: number };
  totalRevenueCents: number;
};
