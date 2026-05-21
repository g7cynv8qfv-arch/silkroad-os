import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

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

interface ClerkMembershipData {
  id: string;
  role: string;
  organization: { id: string };
  public_user_data: { user_id: string };
}

type ClerkEventData = ClerkUserData | ClerkOrgData | ClerkMembershipData;

interface ClerkWebhookEvent {
  type: string;
  data: ClerkEventData;
}

export async function POST(request: Request) {
  const webhookSecret =
    process.env['CLERK_WEBHOOK_SECRET'] ?? process.env['CLERK_WEBHOOK_SIGNING_SECRET'];

  if (!webhookSecret) {
    logger.error('Clerk webhook secret not configured (CLERK_WEBHOOK_SECRET)');
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
  logger.info({ eventType: type }, 'Processing Clerk webhook');

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

      case 'user.deleted': {
        const userData = data as ClerkUserData;
        await db.user.deleteMany({ where: { clerkUserId: userData.id } });
        break;
      }

      case 'organization.created':
      case 'organization.updated': {
        const orgData = data as ClerkOrgData;
        await db.organization.upsert({
          where: { clerkOrgId: orgData.id },
          create: { clerkOrgId: orgData.id, name: orgData.name, slug: orgData.id },
          update: { name: orgData.name },
        });
        break;
      }

      case 'organization.deleted': {
        const orgData = data as ClerkOrgData;
        await db.organization.deleteMany({ where: { clerkOrgId: orgData.id } });
        break;
      }

      case 'organizationMembership.created': {
        const mem = data as ClerkMembershipData;

        // Resolve both local IDs — rows may not exist yet if the user.created
        // webhook hasn't been processed. Upsert ensures idempotency.
        const [localOrg, localUser] = await Promise.all([
          db.organization.findUnique({ where: { clerkOrgId: mem.organization.id } }),
          db.user.findUnique({ where: { clerkUserId: mem.public_user_data.user_id } }),
        ]);

        if (!localOrg || !localUser) {
          // Defer: rows will be created when user/org webhooks fire or on first login.
          logger.warn(
            { orgId: mem.organization.id, userId: mem.public_user_data.user_id },
            'organizationMembership.created: local rows not yet available, skipping upsert',
          );
          break;
        }

        const role = mapClerkRole(mem.role);
        await db.membership.upsert({
          where: { userId_organizationId: { userId: localUser.id, organizationId: localOrg.id } },
          create: { userId: localUser.id, organizationId: localOrg.id, role },
          update: { role },
        });
        break;
      }

      case 'organizationMembership.deleted': {
        const mem = data as ClerkMembershipData;

        const [localOrg, localUser] = await Promise.all([
          db.organization.findUnique({ where: { clerkOrgId: mem.organization.id } }),
          db.user.findUnique({ where: { clerkUserId: mem.public_user_data.user_id } }),
        ]);

        if (localOrg && localUser) {
          await db.membership.deleteMany({
            where: { userId: localUser.id, organizationId: localOrg.id },
          });
        }
        break;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ eventType: type, error: message }, 'Clerk webhook DB operation failed');
    return NextResponse.json({ error: `Database operation failed: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapClerkRole(clerkRole: string): 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' {
  const suffix = clerkRole.replace(/^org:/, '').toUpperCase();
  if (suffix === 'OWNER') return 'OWNER';
  if (suffix === 'ADMIN') return 'ADMIN';
  if (suffix === 'MEMBER') return 'MEMBER';
  return 'VIEWER';
}
