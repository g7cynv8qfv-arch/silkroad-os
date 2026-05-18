import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentOrg } from '@/lib/auth';
import { getTrackingEvents } from '@/lib/logistics/tracking';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    await getCurrentOrg();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const carrier = searchParams.get('carrier') ?? 'Unknown';
  const trackingNumber = searchParams.get('trackingNumber');
  const mode = searchParams.get('mode') ?? 'SEA';

  if (!trackingNumber) {
    return NextResponse.json({ error: 'trackingNumber is required' }, { status: 400 });
  }

  try {
    const result = await getTrackingEvents(carrier, trackingNumber, mode);
    return NextResponse.json(result);
  } catch (err) {
    logger.error({ err }, 'tracking.get failed');
    return NextResponse.json({ error: 'Failed to fetch tracking data' }, { status: 500 });
  }
}
