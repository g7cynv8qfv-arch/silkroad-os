import type { TrackingResult, TrackingEvent } from '@/features/orders/types';

// ─── Interface (real carrier APIs plug in here) ────────────────────────────────
//
// To integrate a real carrier:
// 1. Create src/lib/logistics/carriers/{carrier}.ts implementing CarrierAdapter
// 2. Register it in CARRIER_ADAPTERS below
// 3. The mock adapter is the fallback / dev stub
//
// Supported real carriers (future): DHL, Maersk, FedEx, CMA-CGM, UPS

export interface CarrierAdapter {
  getTrackingEvents(trackingNumber: string): Promise<TrackingResult>;
}

// ─── ETA lookup table (mode + etd → estimated transit days) ──────────────────

const TRANSIT_DAYS: Record<string, number> = {
  SEA: 28,
  AIR: 5,
  RAIL: 18,
  ROAD: 10,
};

export function estimateEta(mode: string, etd: Date): Date {
  const days = TRANSIT_DAYS[mode] ?? 21;
  const eta = new Date(etd);
  eta.setDate(eta.getDate() + days);
  return eta;
}

// ─── Mock tracking adapter ────────────────────────────────────────────────────

function seedInt(str: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const SEA_LOCATIONS = [
  'Shenzhen Port, China',
  'Hong Kong Terminal, HK',
  'Singapore Hub, SG',
  'Port Said, Egypt',
  'Port of Rotterdam, Netherlands',
  'Destination Port',
];

const AIR_LOCATIONS = [
  'Shenzhen Baoan Airport, China',
  'Hong Kong Intl Airport, HK',
  'Dubai Airport, UAE',
  'Charles de Gaulle Airport, France',
  'Customs Clearance — Paris CDG',
  'Local Delivery Hub',
];

const RAIL_LOCATIONS = [
  'Chengdu Rail Terminal, China',
  'Urumqi Customs, China',
  'Dostyk Border, Kazakhstan',
  'Moscow Rail Hub, Russia',
  'Warsaw Terminal, Poland',
  'Hamburg Intermodal Hub, Germany',
];

function getLocations(mode: string): string[] {
  if (mode === 'AIR') return AIR_LOCATIONS;
  if (mode === 'RAIL') return RAIL_LOCATIONS;
  return SEA_LOCATIONS;
}

const EVENT_DESCRIPTIONS = [
  'Shipment picked up from facility',
  'Departed origin port/hub',
  'In transit — on vessel/vehicle',
  'Arrived at transit hub',
  'Customs clearance completed',
  'Arrived at destination port/hub',
  'Out for local delivery',
  'Delivered to recipient',
];

export async function getTrackingEvents(
  carrier: string,
  trackingNumber: string,
  mode = 'SEA',
): Promise<TrackingResult> {
  const seed = seedInt(trackingNumber, 42);
  const locations = getLocations(mode);
  const eventCount = Math.min(3 + (seed % 4), locations.length);

  const now = Date.now();
  const transitDays = TRANSIT_DAYS[mode] ?? 21;
  const startOffset = transitDays * 24 * 60 * 60 * 1000;
  const intervalMs = startOffset / eventCount;

  const events: TrackingEvent[] = [];
  for (let i = 0; i < eventCount; i++) {
    const timestamp = new Date(now - startOffset + i * intervalMs);
    events.push({
      timestamp,
      location: locations[i] ?? locations[0] ?? 'Unknown',
      description: EVENT_DESCRIPTIONS[i] ?? 'In transit',
      status: i < eventCount - 1 ? 'completed' : 'in_transit',
    });
  }

  const lastEvent = events[events.length - 1];
  const estimatedDelivery = new Date(
    (lastEvent?.timestamp.getTime() ?? now) + (transitDays / 2) * 24 * 60 * 60 * 1000,
  );

  return {
    carrier,
    trackingNumber,
    mode,
    currentStatus: lastEvent?.description ?? 'Unknown',
    estimatedDelivery,
    events,
  };
}
