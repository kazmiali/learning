# Route Handlers & API Development

> "An API is a promise. Make it a good one." — Unknown

Route Handlers in Next.js App Router replace the Pages Router's API Routes. They provide a clean, Web Standards-based approach to building APIs that can run on both Node.js and Edge runtimes.

---

## Professional Definition

| Concept | Definition | Why Seniors Care |
|---------|------------|------------------|
| Route Handler | A file (`route.ts`) that exports HTTP method handlers | Build REST APIs, webhooks, and backend logic within Next.js |
| Web Standards | Uses native `Request` and `Response` objects | Portable code, no proprietary APIs, Edge-compatible |
| Edge Runtime | Run API logic at CDN edge locations | Sub-50ms responses globally |
| Dynamic Functions | Accessing `cookies()`, `headers()` makes routes dynamic | Understand when routes are cached vs. dynamic |

---

## Simple Explanation (Feynman Backpack Edition)

Imagine a hotel:

1. **Route Handlers** = The concierge desk. Guests (clients) make requests, and the concierge (handler) provides responses—room service, information, reservations.

2. **HTTP Methods** = Different request types. `GET` = "Tell me about my booking." `POST` = "Make a reservation." `DELETE` = "Cancel my booking."

3. **Edge Runtime** = Having concierge desks at every hotel entrance worldwide, not just the lobby. Faster service no matter where guests enter.

4. **Caching** = Pre-written answers for common questions. "What's the WiFi password?" is answered instantly without calling the manager (server).

---

## Creating Route Handlers

### Basic Structure

```
app/
├── api/
│   ├── users/
│   │   ├── route.ts          # /api/users
│   │   └── [id]/
│   │       └── route.ts      # /api/users/:id
│   ├── posts/
│   │   └── route.ts          # /api/posts
│   └── health/
│       └── route.ts          # /api/health
```

### Simple GET Handler

```typescript
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: 'Hello, World!' });
}
```

### All HTTP Methods

```typescript
// app/api/users/route.ts
import { NextRequest } from 'next/server';

// GET /api/users
export async function GET(request: NextRequest) {
  const users = await db.user.findMany();
  return Response.json(users);
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return Response.json(user, { status: 201 });
}

// PUT /api/users (bulk update)
export async function PUT(request: NextRequest) {
  const body = await request.json();
  await db.user.updateMany({ data: body });
  return Response.json({ success: true });
}

// DELETE /api/users (bulk delete)
export async function DELETE(request: NextRequest) {
  await db.user.deleteMany();
  return new Response(null, { status: 204 });
}

// PATCH, HEAD, OPTIONS also supported
export async function PATCH(request: NextRequest) {
  // Partial updates
}

export async function HEAD(request: NextRequest) {
  // Headers only, no body
}

export async function OPTIONS(request: NextRequest) {
  // CORS preflight
}
```

---

## Dynamic Routes

```typescript
// app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/:id
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  
  const user = await db.user.findUnique({
    where: { id }
  });
  
  if (!user) {
    return Response.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return Response.json(user);
}

// PUT /api/users/:id
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const body = await request.json();
  
  const user = await db.user.update({
    where: { id },
    data: body
  });
  
  return Response.json(user);
}

// DELETE /api/users/:id
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  
  await db.user.delete({ where: { id } });
  
  return new Response(null, { status: 204 });
}
```

### Catch-All Routes

```typescript
// app/api/files/[...path]/route.ts
// Matches: /api/files/a, /api/files/a/b/c

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { path } = await params;
  // path = ['a', 'b', 'c'] for /api/files/a/b/c
  
  const filePath = path.join('/');
  return Response.json({ filePath });
}
```

---

## Request Object

### Query Parameters

```typescript
// app/api/search/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // /api/search?q=nextjs&page=2&limit=10
  const query = searchParams.get('q');           // 'nextjs'
  const page = parseInt(searchParams.get('page') || '1');  // 2
  const limit = parseInt(searchParams.get('limit') || '10'); // 10
  
  const results = await search(query, { page, limit });
  
  return Response.json({
    query,
    page,
    limit,
    results
  });
}
```

### Request Body

```typescript
// app/api/posts/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // JSON body
  const body = await request.json();
  
  // Form data
  const formData = await request.formData();
  const name = formData.get('name');
  const file = formData.get('file') as File;
  
  // Text
  const text = await request.text();
  
  // ArrayBuffer (binary)
  const buffer = await request.arrayBuffer();
  
  // Blob
  const blob = await request.blob();
  
  return Response.json({ received: true });
}
```

### Headers

```typescript
// app/api/protected/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Access request headers
  const authHeader = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const userAgent = request.headers.get('user-agent');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const token = authHeader.split(' ')[1];
  // Validate token...
  
  return Response.json({ authenticated: true });
}
```

### Cookies

```typescript
// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Read cookies from request
  const sessionCookie = request.cookies.get('session');
  
  // Or use the cookies() function
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme');
  
  return Response.json({ session: sessionCookie?.value });
}

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  
  // Authenticate user...
  const token = await createSession(username);
  
  // Set cookie in response
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
  
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  // Delete cookie
  response.cookies.delete('session');
  
  return response;
}
```

---

## Response Patterns

### JSON Response

```typescript
// Simple
return Response.json(data);

// With status
return Response.json(data, { status: 201 });

// With headers
return Response.json(data, {
  status: 200,
  headers: {
    'Cache-Control': 'max-age=3600',
    'X-Custom-Header': 'value'
  }
});
```

### Other Response Types

```typescript
// Text
return new Response('Hello, World!', {
  headers: { 'Content-Type': 'text/plain' }
});

// HTML
return new Response('<h1>Hello</h1>', {
  headers: { 'Content-Type': 'text/html' }
});

// Redirect
return Response.redirect(new URL('/login', request.url));

// Or using NextResponse
import { NextResponse } from 'next/server';
return NextResponse.redirect(new URL('/login', request.url));

// Empty response
return new Response(null, { status: 204 });

// Stream
const stream = new ReadableStream({
  async start(controller) {
    for (let i = 0; i < 10; i++) {
      controller.enqueue(`data: ${i}\n\n`);
      await new Promise(r => setTimeout(r, 1000));
    }
    controller.close();
  }
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});
```

### File Downloads

```typescript
// app/api/download/route.ts
import { readFile } from 'fs/promises';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const fileBuffer = await readFile('./files/report.pdf');
  
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="report.pdf"'
    }
  });
}
```

---

## Error Handling

```typescript
// app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validation
    if (!id || isNaN(Number(id))) {
      return Response.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const user = await db.user.findUnique({
      where: { id: Number(id) }
    });
    
    // Not found
    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return Response.json(user);
    
  } catch (error) {
    console.error('Error fetching user:', error);
    
    // Internal server error
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Standardized Error Responses

```typescript
// lib/api-error.ts
export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  console.error('Unhandled error:', error);
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Usage in route handler
export async function GET(request: NextRequest) {
  try {
    // ... handler logic
  } catch (error) {
    return handleAPIError(error);
  }
}
```

---

## Caching Route Handlers

### Static (Cached) Route Handlers

```typescript
// app/api/config/route.ts
// GET with no dynamic functions = cached at build time

export async function GET() {
  const config = {
    version: '1.0.0',
    features: ['feature1', 'feature2']
  };
  
  return Response.json(config);
}

// Force static
export const dynamic = 'force-static';
```

### Dynamic Route Handlers

```typescript
// app/api/users/route.ts
import { cookies, headers } from 'next/headers';

// Using cookies() or headers() makes it dynamic
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  
  // Or explicitly
  // export const dynamic = 'force-dynamic';
  
  return Response.json({ /* ... */ });
}
```

### Revalidation

```typescript
// app/api/posts/route.ts

// Revalidate every 60 seconds
export const revalidate = 60;

export async function GET() {
  const posts = await fetchPosts();
  return Response.json(posts);
}
```

---

## CORS (Cross-Origin Resource Sharing)

```typescript
// app/api/public/route.ts
import { NextRequest } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function GET(request: NextRequest) {
  const data = await fetchData();
  
  return Response.json(data, {
    headers: corsHeaders
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await createItem(body);
  
  return Response.json(result, {
    status: 201,
    headers: corsHeaders
  });
}
```

### Middleware for Global CORS

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    
    return response;
  }
}

export const config = {
  matcher: '/api/:path*'
};
```

---

## Rate Limiting

```typescript
// lib/rate-limit.ts
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  ip: string,
  limit: number = 100,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimit.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }
  
  if (record.count >= limit) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { 
    success: true, 
    remaining: limit - record.count, 
    resetTime: record.resetTime 
  };
}

// app/api/limited/route.ts
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success, remaining, resetTime } = checkRateLimit(ip);
  
  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }
  
  return Response.json(
    { data: 'Success' },
    {
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      }
    }
  );
}
```

---

## File Uploads

```typescript
// app/api/upload/route.ts
import { NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  
  if (!file) {
    return Response.json(
      { error: 'No file uploaded' },
      { status: 400 }
    );
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json(
      { error: 'Invalid file type' },
      { status: 400 }
    );
  }
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return Response.json(
      { error: 'File too large' },
      { status: 400 }
    );
  }
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Save file
  const filename = `${Date.now()}-${file.name}`;
  const filepath = join(process.cwd(), 'public', 'uploads', filename);
  await writeFile(filepath, buffer);
  
  return Response.json({
    url: `/uploads/${filename}`,
    name: file.name,
    size: file.size
  });
}

// Increase body size limit if needed
export const config = {
  api: {
    bodyParser: false // Disable default parser for file uploads
  }
};
```

---

## Streaming & Server-Sent Events

```typescript
// app/api/stream/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send events every second
      for (let i = 0; i < 10; i++) {
        const data = { count: i, timestamp: Date.now() };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
        await new Promise(r => setTimeout(r, 1000));
      }
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Client-side consumption
// const eventSource = new EventSource('/api/stream');
// eventSource.onmessage = (event) => {
//   const data = JSON.parse(event.data);
//   console.log(data);
// };
```

---

## Edge Runtime

```typescript
// app/api/edge/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';
  
  return Response.json({
    message: `Hello, ${name}!`,
    runtime: 'edge'
  });
}
```

### Edge vs Node.js Runtime

| Feature | Edge | Node.js |
|---------|------|---------|
| Cold start | ~0ms | 250ms+ |
| Location | CDN edge | Origin server |
| APIs | Web APIs only | Full Node.js |
| File system | ❌ No | ✅ Yes |
| Native modules | ❌ No | ✅ Yes |
| Database | Serverless DBs | Any DB |
| Max execution | 30s (Vercel) | Configurable |

---

## Webhooks

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed');
    return Response.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
      
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  return Response.json({ received: true });
}
```

---

## Senior-Level Interview Prompts & Answers

### 1. "When would you use Route Handlers vs Server Actions?"

**Answer:**
- **Route Handlers**: External API consumers, webhooks, file downloads, streaming, complex HTTP semantics (status codes, headers, redirects). RESTful APIs.
- **Server Actions**: Internal mutations triggered by UI (forms, buttons). Type-safe, no endpoint to build, automatic revalidation.

Use Route Handlers when you need an API endpoint; Server Actions when React components need to mutate data.

### 2. "How do you handle authentication in Route Handlers?"

**Answer:** Multiple approaches:
1. **Middleware**: Check auth before request reaches handler (best for protecting many routes)
2. **In-handler**: Check cookies/headers in each handler (more control)
3. **HOF Pattern**: Wrap handlers with auth-checking function

Always use httpOnly cookies for tokens, validate on every request, and return appropriate HTTP status codes (401 vs 403).

### 3. "How do you make Route Handlers cacheable?"

**Answer:** By default, GET handlers with no dynamic functions are cached. To ensure caching:
- Don't use `cookies()`, `headers()`, or `searchParams`
- Set `export const dynamic = 'force-static'`
- Use `export const revalidate = N` for time-based revalidation

For dynamic data, set proper Cache-Control headers for client/CDN caching.

### 4. "Explain Edge vs Node.js runtime trade-offs."

**Answer:**
- **Edge**: Near-zero cold start, global distribution, but limited to Web APIs. Best for auth checks, redirects, A/B testing, simple transformations.
- **Node.js**: Full API access (filesystem, native modules, any database driver), but slower cold starts and runs at origin.

I use Edge for latency-critical paths and Node.js for complex backend operations.

---

## Common Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| Missing error handling | Unhandled exceptions crash | Wrap in try-catch, return proper status |
| Not validating input | Security vulnerabilities | Validate all input with Zod/Yup |
| Exposing sensitive data | Security breach | Sanitize responses, use DTOs |
| Ignoring CORS | Frontend can't call API | Add CORS headers |
| No rate limiting | DoS vulnerability | Implement rate limiting |
| Blocking operations | Slow responses | Use async operations, streaming |
