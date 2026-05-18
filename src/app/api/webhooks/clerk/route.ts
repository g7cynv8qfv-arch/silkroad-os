import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';

interface ClerkUserData {
  id: string;
  email_addresses: Array<{ email_address: string; id: string }>;
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
}

interface ClerkOrgData {
  id: string;
  name: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData | ClerkOrgData;
}

export async function POST(request: Request) {
  const webhookSecret = process.env['CLERK_WEBHOOK_SECRET'];
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers.' }, { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const { type, data } = event;

  try {
    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const userData = data as ClerkUserData;
        const primaryEmail = userData.email_addresses.find(
          (e) => e.id === userData.primary_email_address_id,
        );
        if (!primaryEmail) break;

        await db.user.upsert({
          where: { clerkUserId: userData.id },
          create: {
            clerkUserId: userData.id,
            email: primaryEmail.email_address,
            firstName: userData.first_name,
            lastName: userData.last_name,
            avatarUrl: userData.image_url,
          },
          update: {
            email: primaryEmail.email_address,
            firstName: userData.first_name,
            lastName: userData.last_name,
            avatarUrl: userData.image_url,
          },
        });
        break;
      }

      case 'organization.created':
      case 'organization.updated': {
        const orgData = data as ClerkOrgData;
        await db.organization.upsert({
          where: { clerkOrgId: orgData.id },
          create: {
            clerkOrgId: orgData.id,
            name: orgData.name,
            slug: orgData.id,
          },
          update: {
            name: orgData.name,
          },
        });
        break;
      }

      case 'organization.deleted': {
        const orgData = data as ClerkOrgData;
        await db.organization.deleteMany({
          where: { clerkOrgId: orgData.id },
        });
        break;
      }

      case 'user.deleted': {
        const userData = data as ClerkUserData;
        await db.user.deleteMany({
          where: { clerkUserId: userData.id },
        });
        break;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Database operation failed: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
