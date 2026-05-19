import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export { auth, currentUser };

// ── Role hierarchy ────────────────────────────────────────────────────────────

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

const ROLE_RANK: Record<OrgRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

// Clerk stores roles as e.g. "org:owner", "org:admin", "org:member", "org:viewer"
function parseClerkRole(clerkRole: string | null | undefined): OrgRole {
  if (!clerkRole) return 'VIEWER';
  const suffix = clerkRole.replace(/^org:/, '').toUpperCase();
  if (suffix === 'OWNER' || suffix === 'ADMIN' || suffix === 'MEMBER' || suffix === 'VIEWER') {
    return suffix;
  }
  return 'VIEWER';
}

// ── Permission map ─────────────────────────────────────────────────────────────

type Permission =
  | 'suppliers:read'
  | 'suppliers:write'
  | 'suppliers:delete'
  | 'orders:read'
  | 'orders:write'
  | 'orders:delete'
  | 'invoices:read'
  | 'invoices:write'
  | 'invoices:delete'
  | 'intelligence:read'
  | 'members:read'
  | 'members:write'
  | 'billing:read'
  | 'billing:write'
  | 'org:delete';

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  OWNER: [
    'suppliers:read',
    'suppliers:write',
    'suppliers:delete',
    'orders:read',
    'orders:write',
    'orders:delete',
    'invoices:read',
    'invoices:write',
    'invoices:delete',
    'intelligence:read',
    'members:read',
    'members:write',
    'billing:read',
    'billing:write',
    'org:delete',
  ],
  ADMIN: [
    'suppliers:read',
    'suppliers:write',
    'suppliers:delete',
    'orders:read',
    'orders:write',
    'orders:delete',
    'invoices:read',
    'invoices:write',
    'invoices:delete',
    'intelligence:read',
    'members:read',
    'members:write',
    'billing:read',
  ],
  MEMBER: [
    'suppliers:read',
    'suppliers:write',
    'orders:read',
    'orders:write',
    'invoices:read',
    'invoices:write',
    'intelligence:read',
    'members:read',
  ],
  VIEWER: ['suppliers:read', 'orders:read', 'invoices:read', 'intelligence:read', 'members:read'],
};

// ── Core session types ────────────────────────────────────────────────────────

export interface OrgSession {
  userId: string;
  orgId: string;
  role: OrgRole;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the current org session with LOCAL database IDs (not Clerk IDs).
 * Upserts User / Organization / Membership rows on first encounter so the app
 * works even before Clerk webhooks have fired.
 * Wrapped in React cache() so the DB round-trips happen at most once per request.
 */
export const getCurrentOrg = cache(async (): Promise<OrgSession> => {
  // Dev bypass: allow the app shell to run without Clerk configured.
  // We still upsert real DB rows so foreign key constraints are satisfied.
  if (!process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) {
    const devOrg = await db.organization.upsert({
      where: { clerkOrgId: 'dev-org' },
      create: { clerkOrgId: 'dev-org', name: 'Dev Organization', slug: 'dev-org' },
      update: {},
    });
    const devUser = await db.user.upsert({
      where: { clerkUserId: 'dev-user' },
      create: { clerkUserId: 'dev-user', email: 'dev@localhost' },
      update: {},
    });
    await db.membership.upsert({
      where: { userId_organizationId: { userId: devUser.id, organizationId: devOrg.id } },
      create: { userId: devUser.id, organizationId: devOrg.id, role: 'OWNER' },
      update: {},
    });
    return { userId: devUser.id, orgId: devOrg.id, role: 'OWNER' };
  }

  const { userId: clerkUserId, orgId: clerkOrgId, orgRole } = await auth();

  if (!clerkUserId) throw new Error('Unauthorized: not authenticated.');
  if (!clerkOrgId)
    throw new Error('Unauthorized: no active organization. Complete onboarding first.');

  // ── User ──────────────────────────────────────────────────────────────────
  // Fast path: row already exists (common case after first sign-in)
  let localUser = await db.user.findUnique({ where: { clerkUserId } });
  if (!localUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error('Unauthorized: could not resolve user profile.');
    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;
    if (!email) throw new Error('Unauthorized: user has no primary email.');
    localUser = await db.user.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
      },
      update: {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
      },
    });
  }

  // ── Organization ──────────────────────────────────────────────────────────
  // Slug uses clerkOrgId as a unique placeholder; webhook will set the real name/slug.
  const localOrg = await db.organization.upsert({
    where: { clerkOrgId },
    create: { clerkOrgId, name: clerkOrgId, slug: clerkOrgId },
    update: {},
  });

  // ── Membership ────────────────────────────────────────────────────────────
  const role = parseClerkRole(orgRole);
  await db.membership.upsert({
    where: { userId_organizationId: { userId: localUser.id, organizationId: localOrg.id } },
    create: { userId: localUser.id, organizationId: localOrg.id, role },
    update: { role },
  });

  return { userId: localUser.id, orgId: localOrg.id, role };
});

/**
 * Enforces a minimum role. Throws 403 if the caller's role is below `minRole`.
 */
export async function requireRole(minRole: OrgRole): Promise<OrgSession> {
  const session = await getCurrentOrg();

  if (ROLE_RANK[session.role] < ROLE_RANK[minRole]) {
    throw new Error(`Forbidden: requires ${minRole} role, caller has ${session.role}.`);
  }

  return session;
}

/**
 * Returns true if the current user has the given permission.
 * Does NOT throw — use for conditional rendering.
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  try {
    const session = await getCurrentOrg();
    return ROLE_PERMISSIONS[session.role].includes(permission);
  } catch {
    return false;
  }
}

export type { Permission };
