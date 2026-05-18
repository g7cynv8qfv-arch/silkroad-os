'use client';

import * as React from 'react';
import { Plane, Ship, Train, Truck, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Shipment } from '@prisma/client';
import type { TrackingResult } from '../types';

// ─── Mode icon ────────────────────────────────────────────────────────────────

function ModeIcon({ mode, className }: { mode: string; className?: string }) {
  const Icon = { AIR: Plane, SEA: Ship, RAIL: Train, ROAD: Truck }[mode] ?? Ship;
  return <Icon className={className} />;
}

const MODE_LABELS: Record<string, string> = {
  AIR: 'Air freight',
  SEA: 'Sea freight',
  RAIL: 'Rail freight',
  ROAD: 'Road freight',
};

// ─── ETA countdown ────────────────────────────────────────────────────────────

function EtaCountdown({ eta }: { eta: Date }) {
  const now = new Date();
  const diffMs = eta.getTime() - now.getTime();

  if (diffMs < 0) {
    return <span className="text-sm text-emerald-400">Arrived</span>;
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <span className="text-sm font-medium text-foreground">
      {days}d {hours}h remaining
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ShipmentTrackerProps {
  shipment: Shipment;
  className?: string;
}

export function ShipmentTracker({ shipment, className }: ShipmentTrackerProps) {
  const [result, setResult] = React.useState<TrackingResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function track() {
    if (!shipment.trackingNumber || !shipment.carrier) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/tracking?carrier=${encodeURIComponent(shipment.carrier)}&trackingNumber=${encodeURIComponent(shipment.trackingNumber)}&mode=${shipment.mode}`,
      );
      if (!res.ok) throw new Error('Failed to fetch tracking data');
      const data = (await res.json()) as TrackingResult;
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const hasTrackingInfo = Boolean(shipment.carrier || shipment.trackingNumber);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Mode</p>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ModeIcon mode={shipment.mode} className="h-4 w-4 text-accent" />
            {MODE_LABELS[shipment.mode] ?? shipment.mode}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Carrier</p>
          <p className="mt-1 text-sm font-medium text-foreground">{shipment.carrier ?? '—'}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">ETD</p>
          <p className="mt-1 font-mono text-sm text-foreground">
            {shipment.etd
              ? shipment.etd.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">ETA</p>
          <div className="mt-1 font-mono text-sm text-foreground">
            {shipment.eta ? (
              <div className="space-y-0.5">
                <p>
                  {shipment.eta.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <EtaCountdown eta={shipment.eta} />
              </div>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      {/* Tracking number */}
      {shipment.trackingNumber && (
        <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Tracking number</p>
            <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
              {shipment.trackingNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={track}
              disabled={loading || !hasTrackingInfo}
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Track now
            </Button>
            {shipment.carrier && (
              <Button size="sm" variant="ghost" asChild>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(shipment.carrier + ' tracking ' + shipment.trackingNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Last event */}
      {shipment.lastEventDescription && (
        <div className="flex items-start gap-2 text-sm">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <span className="text-foreground">{shipment.lastEventDescription}</span>
            {shipment.lastEventAt && (
              <span className="ml-2 text-xs text-muted-foreground">
                {shipment.lastEventAt.toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Tracking events */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {result && (
        <ol className="space-y-0" aria-label="Tracking events">
          {[...result.events].reverse().map((event, i) => (
            <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
              {i < result.events.length - 1 && (
                <div
                  className="absolute left-[9px] top-5 h-full w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <div
                className={cn(
                  'relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2',
                  event.status === 'completed'
                    ? 'border-accent bg-accent'
                    : event.status === 'in_transit'
                      ? 'border-accent bg-surface-1'
                      : 'border-border bg-surface-1',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground">{event.location}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {event.timestamp.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
