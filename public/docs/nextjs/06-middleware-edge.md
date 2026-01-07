# Middleware & Edge Functions

> "The best middleware is the one you don't notice." — Unknown

Middleware in Next.js runs before a request is completed, allowing you to modify responses, redirect users, rewrite URLs, and implement authentication—all at the edge for maximum performance.

---

## Professional Definition

| Concept | Definition | Why Seniors Care |
|---------|------------|------------------|
| Middleware | Code that runs before every request, can modify request/response | Centralized auth, logging, redirects without touching route handlers |
| Edge Middleware | Middleware running on CDN edge nodes globally | Sub-50ms auth checks, geo-personalization worldwide |
| Request Matching | Pattern-based route matching for selective middleware | Don't run auth checks on public pages |
| Response Modification | Rewriting, redirecting, adding headers | A/B testing, feature flags, security headers |

---

## Simple Explanation (Feynman Backpack Edition)

Imagine an airport:

1. **Middleware** = Security checkpoint before gates. Every passenger (request) passes through, but not everyone is treated the same.

2. **Edge Middleware** = Having security checkpoints at every airport entrance worldwide, not just one central location. Faster for everyone.

3. **Matching** = TSA PreCheck lanes. Some passengers skip extra screening (static assets), others get full inspection (protected routes).

4. **Actions**:
   - **Redirect** = "Wrong terminal, go to Terminal B" (send to different URL)
   - **Rewrite** = "Use Gate 10 instead of Gate 5" (same destination, different path internally)
   - **Modify Headers** = "Add this security tag to your boarding pass"

---

## Creating Middleware

```typescript
// middleware.ts (must be in project root or src/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Runs on every matched request
  console.log('Middleware:', request.nextUrl.pathname);
  
  // Continue to the route
  return NextResponse.next();
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

---

## Route Matching

### Simple Patterns

```typescript
export const config = {
  matcher: '/dashboard/:path*',
};

// Matches:
// /dashboard
// /dashboard/settings
// /dashboard/settings/profile
```

### Multiple Patterns

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};
```

### Conditional Matching

```typescript
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
```

### In-Code Conditional Logic

```typescript
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Apply middleware logic
  // ...
}
```

---

## Common Middleware Patterns

### Authentication

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/settings', '/admin'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const pathname = request.nextUrl.pathname;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if route is auth route (login, register)
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Verify token
  const isValidSession = token ? await verifyToken(token) : false;
  
  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/admin/:path*', '/login', '/register'],
};
```

### Role-Based Access Control

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const roleRoutes: Record<string, string[]> = {
  admin: ['/admin/:path*'],
  moderator: ['/moderator/:path*', '/admin/reports/:path*'],
  user: ['/dashboard/:path*'],
};

export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  const pathname = request.nextUrl.pathname;
  
  // Check admin routes
  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // Check moderator routes
  if (pathname.startsWith('/moderator')) {
    if (!session || !['admin', 'moderator'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### Geolocation-Based Routing

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'US';
  const city = request.geo?.city || 'Unknown';
  const region = request.geo?.region || 'Unknown';
  
  // Redirect EU users to EU-specific pages
  const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL'];
  
  if (euCountries.includes(country) && !request.nextUrl.pathname.startsWith('/eu')) {
    return NextResponse.redirect(new URL(`/eu${request.nextUrl.pathname}`, request.url));
  }
  
  // Add geo headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-country', country);
  response.headers.set('x-user-city', city);
  
  return response;
}
```

### A/B Testing

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Only apply to specific pages
  if (pathname !== '/pricing') {
    return NextResponse.next();
  }
  
  // Check existing bucket
  let bucket = request.cookies.get('ab-bucket')?.value;
  
  // Assign bucket if not exists
  if (!bucket) {
    bucket = Math.random() < 0.5 ? 'control' : 'variant';
  }
  
  // Rewrite to variant page
  const url = request.nextUrl.clone();
  if (bucket === 'variant') {
    url.pathname = '/pricing-v2';
  }
  
  const response = NextResponse.rewrite(url);
  
  // Set cookie for consistent experience
  response.cookies.set('ab-bucket', bucket, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  return response;
}
```

### Feature Flags

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface FeatureFlags {
  newDashboard: boolean;
  darkMode: boolean;
  betaFeatures: boolean;
}

async function getFeatureFlags(userId?: string): Promise<FeatureFlags> {
  // Fetch from feature flag service (LaunchDarkly, Unleash, etc.)
  const response = await fetch(`https://flags.example.com/api/flags?userId=${userId}`, {
    next: { revalidate: 60 } // Cache for 60 seconds
  });
  return response.json();
}

export async function middleware(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  const flags = await getFeatureFlags(userId);
  
  // Store flags in headers for use in components
  const response = NextResponse.next();
  response.headers.set('x-feature-flags', JSON.stringify(flags));
  
  // Redirect to new dashboard if flag enabled
  if (flags.newDashboard && request.nextUrl.pathname === '/dashboard') {
    return NextResponse.rewrite(new URL('/dashboard-v2', request.url));
  }
  
  return response;
}
```

### Rate Limiting

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: This is a simplified example. For production, use Redis or a proper rate limiting service
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

function rateLimit(ip: string): { success: boolean; limit: number; remaining: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;
  
  const record = rateLimitMap.get(ip);
  
  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { success: true, limit: maxRequests, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { success: false, limit: maxRequests, remaining: 0 };
  }
  
  record.count++;
  return { success: true, limit: maxRequests, remaining: maxRequests - record.count };
}

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { success, limit, remaining } = rateLimit(ip);
  
  if (!success) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        },
      }
    );
  }
  
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  
  return response;
}
```

### Security Headers

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}
```

---

## Middleware Response Types

### NextResponse.next()

Continue to the route, optionally modify request:

```typescript
export function middleware(request: NextRequest) {
  // Add custom header to request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-custom-header', 'my-value');
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

### NextResponse.redirect()

Redirect to a different URL:

```typescript
export function middleware(request: NextRequest) {
  // Internal redirect
  return NextResponse.redirect(new URL('/login', request.url));
  
  // External redirect
  return NextResponse.redirect('https://example.com');
  
  // With status code
  return NextResponse.redirect(new URL('/new-page', request.url), 301);
}
```

### NextResponse.rewrite()

Rewrite URL without changing browser URL:

```typescript
export function middleware(request: NextRequest) {
  // User sees /dashboard but content is from /dashboard-v2
  return NextResponse.rewrite(new URL('/dashboard-v2', request.url));
}
```

### Direct Response

Return a response directly without hitting the route:

```typescript
export function middleware(request: NextRequest) {
  // Block request
  return new NextResponse(
    JSON.stringify({ error: 'Forbidden' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

## Accessing Request Data

```typescript
export function middleware(request: NextRequest) {
  // URL and path
  const url = request.url;
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;
  
  // Headers
  const authHeader = request.headers.get('authorization');
  const userAgent = request.headers.get('user-agent');
  
  // Cookies
  const sessionCookie = request.cookies.get('session');
  const allCookies = request.cookies.getAll();
  
  // Geo data (Vercel)
  const country = request.geo?.country;
  const city = request.geo?.city;
  const region = request.geo?.region;
  const latitude = request.geo?.latitude;
  const longitude = request.geo?.longitude;
  
  // IP address
  const ip = request.ip;
  
  // Method
  const method = request.method;
  
  return NextResponse.next();
}
```

---

## Modifying Cookies

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Set cookie
  response.cookies.set('visited', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  
  // Set multiple cookies
  response.cookies.set({
    name: 'theme',
    value: 'dark',
    path: '/',
  });
  
  // Delete cookie
  response.cookies.delete('old-cookie');
  
  return response;
}
```

---

## Edge Runtime Limitations

Middleware runs on the Edge runtime, which has limitations:

| Supported | Not Supported |
|-----------|---------------|
| `fetch()` | Node.js `fs` module |
| `Request` / `Response` | Node.js `path` module |
| `Headers` | Node.js native modules |
| `URL` / `URLSearchParams` | Most npm packages |
| `TextEncoder` / `TextDecoder` | Heavy computation |
| `crypto.subtle` | Long-running tasks (>30s) |
| `WebSocket` | Database connections (use HTTP APIs) |
| Basic `console` methods | |

### Working with Databases in Middleware

```typescript
// ❌ Won't work - can't use traditional DB clients
import { PrismaClient } from '@prisma/client';

// ✅ Use HTTP-based DB APIs
export async function middleware(request: NextRequest) {
  // Use REST API to verify session
  const session = request.cookies.get('session')?.value;
  
  if (session) {
    const response = await fetch(`${process.env.API_URL}/verify-session`, {
      headers: { Authorization: `Bearer ${session}` },
    });
    
    if (!response.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}
```

---

## Chaining Middleware Logic

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define middleware functions
function authMiddleware(request: NextRequest): NextResponse | null {
  const token = request.cookies.get('session');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return null;
}

function geoMiddleware(request: NextRequest): NextResponse | null {
  const country = request.geo?.country;
  if (country === 'RU' && !request.nextUrl.pathname.startsWith('/blocked')) {
    return NextResponse.redirect(new URL('/blocked', request.url));
  }
  return null;
}

function logMiddleware(request: NextRequest): void {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);
}

// Chain middleware
export function middleware(request: NextRequest) {
  // Logging (always runs)
  logMiddleware(request);
  
  // Geo check (may redirect)
  const geoResponse = geoMiddleware(request);
  if (geoResponse) return geoResponse;
  
  // Auth check (may redirect)
  const authResponse = authMiddleware(request);
  if (authResponse) return authResponse;
  
  // Continue
  return NextResponse.next();
}
```

---

## Testing Middleware

```typescript
// __tests__/middleware.test.ts
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('middleware', () => {
  it('redirects unauthenticated users from protected routes', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/dashboard')
    );
    
    const response = await middleware(request);
    
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
  
  it('allows authenticated users to access protected routes', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/dashboard'),
      {
        headers: {
          cookie: 'session=valid-token',
        },
      }
    );
    
    const response = await middleware(request);
    
    expect(response.status).toBe(200);
  });
  
  it('adds security headers', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/')
    );
    
    const response = await middleware(request);
    
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
```

---

## Senior-Level Interview Prompts & Answers

### 1. "When should you use middleware vs. route-level checks?"

**Answer:** 
- **Middleware**: Cross-cutting concerns affecting many routes (auth, logging, security headers, redirects). Runs at edge for performance.
- **Route-level**: Route-specific logic, complex authorization requiring database queries, when you need full Node.js APIs.

Middleware is best for fast, simple checks. Complex logic should happen in routes or server actions.

### 2. "How do you handle database operations in Edge Middleware?"

**Answer:** Edge runtime doesn't support traditional database drivers. Options:
1. Use HTTP-based database services (PlanetScale, Neon, Upstash)
2. Call an API route that handles DB operations
3. Use JWT tokens that contain encoded user data
4. Move complex checks to route handlers

For auth, encode essential user data in a signed JWT cookie verified at the edge.

### 3. "How do you implement feature flags at the edge?"

**Answer:** 
1. Fetch feature flags from an edge-compatible service (LaunchDarkly, Vercel Edge Config)
2. Cache flags with short TTL for performance
3. Use `NextResponse.rewrite()` to serve different versions
4. Store user bucket in cookies for consistent experience
5. Pass flags via headers to components

The edge allows global, low-latency feature flag evaluation.

### 4. "What are the trade-offs of putting logic in middleware?"

**Answer:**
- **Pros**: Runs before route handlers, centralized logic, edge performance, affects all matched routes
- **Cons**: Limited to Edge runtime (no Node.js APIs), can't use most npm packages, no direct DB access, harder to test

Balance by keeping middleware simple (auth, redirects) and putting complex logic in routes.

---

## Common Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| Heavy computation | 30s timeout, slow responses | Keep middleware lightweight |
| Using Node.js modules | Runtime errors | Use Edge-compatible alternatives |
| Missing matcher config | Runs on every request | Configure specific route patterns |
| Blocking static assets | Slow page loads | Exclude `/_next/static` |
| State in middleware | Inconsistent behavior (edge is stateless) | Use cookies/headers for state |
| Complex DB queries | Not supported | Use HTTP APIs or move to routes |
