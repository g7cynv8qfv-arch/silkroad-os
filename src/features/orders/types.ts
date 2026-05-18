import type { Order, OrderItem, Shipment, QualityCheck, Supplier, Invoice } from '@prisma/client';

export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export type {
  OrderStatus,
  ShipmentMode,
  OrderFilters,
  CreateOrderInput,
  UpdateOrderInput,
  CreateQcReportInput,
  CreateShipmentInput,
  UpdateShipmentInput,
} from './schemas';

// ─── List item (lean projection for table/kanban) ─────────────────────────────

export type OrderListItem = Pick<
  Order,
  | 'id'
  | 'orderNumber'
  | 'status'
  | 'totalCents'
  | 'currency'
  | 'expectedDeliveryAt'
  | 'deliveredAt'
  | 'createdAt'
  | 'updatedAt'
> & {
  supplier: Pick<Supplier, 'id' | 'name' | 'country'> | null;
};

// ─── Full order with relations (detail view) ──────────────────────────────────

export type OrderWithRelations = Order & {
  supplier: Pick<Supplier, 'id' | 'name' | 'country' | 'city'> | null;
  items: OrderItem[];
  shipments: Shipment[];
  qualityChecks: QualityCheck[];
  invoices: Pick<Invoice, 'id' | 'invoiceNumber' | 'totalCents' | 'status' | 'currency'>[];
};

// ─── Tracking ─────────────────────────────────────────────────────────────────

export interface TrackingEvent {
  timestamp: Date;
  location: string;
  description: string;
  status: 'completed' | 'in_transit' | 'pending';
}

export interface TrackingResult {
  carrier: string;
  trackingNumber: string;
  mode: string;
  currentStatus: string;
  estimatedDelivery: Date | null;
  events: TrackingEvent[];
}
