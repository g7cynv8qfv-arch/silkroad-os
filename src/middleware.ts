import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/lib/i18n/routing';

const handleI18n = createIntlMiddleware(routing);

const isDashboardRoute = createRouteMatcher([
  '/:locale/(dashboard)(.*)',
  '/:locale/dashboard(.*)',
  '/:locale/suppliers(.*)',
  '/:locale/orders(.*)',
  '/:locale/invoices(.*)',
  '/:locale/intelligence(.*)',
  '/:locale/analytics(.*)',
]);

const isAuthRoute = createRouteMatcher(['/:locale/sign-in(.*)', '/:locale/sign-up(.*)']);

const isOnboardingRoute = createRouteMatcher(['/:locale/onboarding(.*)']);

const isHomeRoute = createRouteMatcher(['/:locale']);

function localePrefix(request: NextRequest): string {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const first = segments[0] ?? '';
  return routing.locales.includes(first as (typeof routing.locales)[number])
    ? `/${first}`
    : `/${routing.defaultLocale}`;
}

// When Clerk key is present, compose Clerk + intl middleware.
// Without a key (local dev without .env.local), fall through to intl-only.
const hasClerkKey = !!process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];

const clerkHandler = hasClerkKey
  ? clerkMiddleware(async (auth, request: NextRequest) => {
      // API routes must not go through next-intl locale detection — it would
      // redirect /api/… to /fr/api/… which doesn't exist. Clerk auth context
      // is still set up by clerkMiddleware before this return.
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
      }

      const rawAuth = await auth();
      const { userId, redirectToSignIn } = rawAuth;
      // @clerk/backend 1.14.1 only reads the flat org_id claim; v2 compact JWTs
      // store the org under sessionClaims.o.id — fall back to that field.
      // sessionClaims is null for unauthenticated requests, so guard with ??.
      const compactClaims = (rawAuth.sessionClaims ?? {}) as Record<string, unknown> & {
        o?: { id?: string };
      };
      const orgId = rawAuth.orgId ?? compactClaims.o?.id;
      const prefix = localePrefix(request);

      if (isDashboardRoute(request)) {
        if (!userId) return redirectToSignIn({ returnBackUrl: request.url });
        // Note: orgId check is intentionally in the dashboard layout, NOT here.
        // Checking !orgId here would redirect before Clerk can complete its
        // JWT handshake (which exchanges __clerk_db_jwt for a fresh __session
        // including the new orgId after setActive). The layout guards instead.
      }

      // Signed-in user without org visiting home or auth pages → send to onboarding
      if (userId && !orgId && (isHomeRoute(request) || isAuthRoute(request))) {
        return NextResponse.redirect(new URL(`${prefix}/onboarding`, request.url));
      }

      // Fully authenticated user visiting auth or home pages → send to dashboard
      if (userId && orgId && (isHomeRoute(request) || isAuthRoute(request))) {
        return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url));
      }

      if (isOnboardingRoute(request) && userId && orgId) {
        return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url));
      }

      return handleI18n(request);
    })
  : null;

export function middleware(request: NextRequest) {
  if (clerkHandler) {
    return clerkHandler(request, {} as never);
  }
  // Without Clerk: API routes bypass next-intl to prevent /api/… → /fr/api/… redirect.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  return handleI18n(request);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jit|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
