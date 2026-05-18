'use client';

import * as React from 'react';
import {
  DndContext,
  useDroppable,
  useDraggable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { updateOrderStatus } from '../actions';
import { KANBAN_STATUSES, STATUS_TRANSITIONS } from '../schemas';
import type { OrderListItem, OrderStatus } from '../types';

// ─── Currency format ──────────────────────────────────────────────────────────

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Column labels ────────────────────────────────────────────────────────────

const COLUMN_LABELS: Record<string, string> = {
  QUOTED: 'Quoted',
  CONFIRMED: 'Confirmed',
  IN_PRODUCTION: 'In production',
  QC: 'QC',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
};

// ─── Draggable card ───────────────────────────────────────────────────────────

interface CardProps {
  order: OrderListItem;
  isDragging?: boolean;
}

function OrderCard({ order, isDragging }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface-1 p-3 shadow-sm transition-shadow',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-accent',
      )}
    >
      <Link
        href={`/orders/${order.id}`}
        className="block font-mono text-sm font-medium text-accent hover:underline"
        onClick={(e) => isDragging && e.preventDefault()}
      >
        {order.orderNumber}
      </Link>
      {order.supplier && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{order.supplier.name}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-foreground">
          {formatMoney(order.totalCents, order.currency)}
        </span>
        {order.expectedDeliveryAt && (
          <span className="font-mono text-xs text-muted-foreground">
            {order.expectedDeliveryAt.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ order }: { order: OrderListItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { status: order.status },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <OrderCard order={order} isDragging={isDragging} />
    </div>
  );
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  orders,
  isOver,
}: {
  status: string;
  orders: OrderListItem[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex min-w-[260px] flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {COLUMN_LABELS[status] ?? status}
        </h3>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {orders.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[200px] flex-col gap-2 rounded-lg border border-border p-2 transition-colors',
          isOver ? 'border-accent/50 bg-accent/5' : 'bg-surface-2/40',
        )}
      >
        {orders.map((order) => (
          <DraggableCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-muted-foreground/50">No orders</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main kanban board ────────────────────────────────────────────────────────

interface OrderKanbanProps {
  orders: OrderListItem[];
}

export function OrderKanban({ orders: initialOrders }: OrderKanbanProps) {
  const [orders, setOrders] = React.useState(initialOrders);
  const [activeOrder, setActiveOrder] = React.useState<OrderListItem | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const grouped = React.useMemo(() => {
    const map: Record<string, OrderListItem[]> = {};
    for (const s of KANBAN_STATUSES) map[s] = [];
    for (const order of orders) {
      if (order.status in map) {
        map[order.status]?.push(order);
      }
    }
    return map;
  }, [orders]);

  function handleDragStart(event: DragStartEvent) {
    const order = orders.find((o) => o.id === event.active.id);
    setActiveOrder(order ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? String(event.over.id) : null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveOrder(null);
    setOverId(null);

    const { active, over } = event;
    if (!over) return;

    const orderId = String(active.id);
    const newStatus = String(over.id) as OrderStatus;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    const allowed = STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      toast.error(
        `Cannot move from ${COLUMN_LABELS[order.status] ?? order.status} to ${COLUMN_LABELS[newStatus] ?? newStatus}.`,
      );
      return;
    }

    // Optimistic update
    const previousOrders = orders;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      setOrders(previousOrders);
      toast.error(result.error);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            orders={grouped[status] ?? []}
            isOver={overId === status}
          />
        ))}
      </div>

      <DragOverlay>{activeOrder && <OrderCard order={activeOrder} />}</DragOverlay>
    </DndContext>
  );
}
