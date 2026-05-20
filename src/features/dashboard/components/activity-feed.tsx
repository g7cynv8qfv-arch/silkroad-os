import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  Package,
  Building2,
  FileText,
  Zap,
  UserPlus,
  TruckIcon,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Edit3,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { getRecentActivity, type ActivityItem } from '../queries';

// ─── Action → icon + color map ────────────────────────────────────────────────

const ACTION_MAP: Record<string, { Icon: LucideIcon; color: string; label: string }> = {
  'order.created': { Icon: PlusCircle, color: 'text-accent bg-accent/10', label: 'Created order' },
  'order.status_changed': {
    Icon: Package,
    color: 'text-warning bg-warning/10',
    label: 'Updated order',
  },
  'order.deleted': { Icon: Trash2, color: 'text-danger bg-danger/10', label: 'Deleted order' },
  'supplier.created': {
    Icon: Building2,
    color: 'text-success bg-success/10',
    label: 'Added supplier',
  },
  'supplier.updated': { Icon: Edit3, color: 'text-info bg-info/10', label: 'Updated supplier' },
  'supplier.deleted': {
    Icon: Trash2,
    color: 'text-danger bg-danger/10',
    label: 'Deleted supplier',
  },
  'invoice.created': {
    Icon: FileText,
    color: 'text-accent bg-accent/10',
    label: 'Created invoice',
  },
  'invoice.sent': { Icon: Zap, color: 'text-info bg-info/10', label: 'Sent invoice' },
  'invoice.paid': {
    Icon: CheckCircle2,
    color: 'text-success bg-success/10',
    label: 'Invoice paid',
  },
  'invoice.overdue': {
    Icon: AlertTriangle,
    color: 'text-danger bg-danger/10',
    label: 'Invoice overdue',
  },
  'shipment.created': { Icon: TruckIcon, color: 'text-info bg-info/10', label: 'Added shipment' },
  'member.invited': {
    Icon: UserPlus,
    color: 'text-success bg-success/10',
    label: 'Invited member',
  },
};

const ENTITY_HREF: Record<string, (id: string) => string> = {
  Order: (id) => `/orders/${id}`,
  Supplier: (id) => `/suppliers/${id}`,
  Invoice: (id) => `/invoices/${id}`,
};

function resolveAction(action: string) {
  return (
    ACTION_MAP[action] ?? {
      Icon: Edit3,
      color: 'text-muted-foreground bg-surface-2',
      label: action.replace(/\./g, ' '),
    }
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const { Icon, color, label } = resolveAction(item.action);
  const href = ENTITY_HREF[item.entityType]?.(item.entityId);
  const meta = item.metadata as Record<string, string>;
  const entityLabel =
    meta['supplierName'] ??
    meta['orderNumber'] ??
    meta['invoiceNumber'] ??
    meta['entityLabel'] ??
    '';
  const actorName = item.actorName ?? 'System';

  const content = (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2/60">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${color}`}
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          <span className="font-medium">{actorName}</span>{' '}
          <span className="text-muted-foreground">{label.toLowerCase()}</span>
          {entityLabel && (
            <>
              {' '}
              <span className="font-mono text-xs font-medium text-foreground/80">
                {entityLabel}
              </span>
            </>
          )}
        </p>
        <time className="text-xs text-muted-foreground" dateTime={item.createdAt.toISOString()}>
          {timeAgo(item.createdAt)}
        </time>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}

interface ActivityFeedPanelProps {
  orgId: string;
}

export async function ActivityFeedPanel({ orgId }: ActivityFeedPanelProps) {
  const [t, items] = await Promise.all([getTranslations('dashboard'), getRecentActivity(orgId)]);

  return (
    <section
      className="flex flex-col rounded-xl border border-border bg-surface-1 p-5"
      aria-label={t('activity.title')}
    >
      <h2 className="mb-4 text-sm font-semibold text-foreground">{t('activity.title')}</h2>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('activity.empty')}</p>
      ) : (
        <div className="space-y-0.5 overflow-hidden" role="feed">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
