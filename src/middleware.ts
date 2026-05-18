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
  '/:locale/invoices(.*)',
  '/:locale/intelligence(.*)',
  '/:locale/analytics(.*)',
]);

const isAuthRoute = createRouteMatcher(['/:locale/sign-in(.*)', '/:locale/sign-up(.*)']);

const isOnboardingRoute = createRouteMatcher(['/:locale/onboarding(.*)']);

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
      const { userId, orgId, redirectToSignIn } = await auth();
      const prefix = localePrefix(request);

      if (isDashboardRoute(request)) {
        if (!userId) return redirectToSignIn({ returnBackUrl: request.url });
        if (!orgId) return NextResponse.redirect(new URL(`${prefix}/onboarding`, request.url));
      }

      if (isAuthRoute(request) && userId && orgId) {
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
  return handleI18n(request);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jit|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
