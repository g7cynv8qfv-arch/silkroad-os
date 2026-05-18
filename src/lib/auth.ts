import { auth, currentUser } from '@clerk/nextjs/server';

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
 * Returns the current org session. Throws if user is unauthenticated or has no active org.
 * Every server action and server component in (dashboard) must call this.
 */
export async function getCurrentOrg(): Promise<OrgSession> {
  // Dev bypass: allow the app shell to render without Clerk configured
  if (!process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) {
    return { userId: 'dev-user', orgId: 'dev-org', role: 'OWNER' };
  }

  const { userId, orgId, orgRole } = await auth();

  if (!userId) throw new Error('Unauthorized: not authenticated.');
  if (!orgId) throw new Error('Unauthorized: no active organization. Complete onboarding first.');

  return { userId, orgId, role: parseClerkRole(orgRole) };
}

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
