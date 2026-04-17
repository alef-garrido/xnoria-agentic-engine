// ==============================================================================
// Exnoria · Dashboard · Auth middleware
//
// Edge middleware: fast cookie presence check only.
// Full bcrypt session validation happens in API routes and page server components
// (bcrypt is too slow for edge runtime — cannot run here).
//
// Public paths that bypass this check:
//   - /login              — the login page itself
//   - /api/auth/login     — login endpoint
//   - /api/auth/logout    — logout endpoint (idempotent, safe without session)
//   - /api/health         — health check (no auth needed)
// ==============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'xnoria_session';

// Public pages (exact match)
const PUBLIC_PAGES = new Set(['/login']);

// Public API prefixes
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public pages
  if (PUBLIC_PAGES.has(pathname)) {
    return NextResponse.next();
  }

  // Always allow public API routes
  if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Check that the session cookie is present (existence check only — not validated here)
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    // API routes: return 401 JSON (clients handle redirects themselves)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Page routes: redirect to /login, preserving the intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static build assets)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - Files with a file extension (e.g. .png, .js, .css)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
