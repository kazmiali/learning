# Remix Performance & Optimization

> "Premature optimization is the root of all evil, but performance is a feature." — Engineering Wisdom

Remix is designed for performance by default—server rendering, automatic code splitting, and parallel data loading. But senior engineers must understand how to measure, debug, and optimize when needed.

---

## Professional Definition

| Concept | Definition | Impact |
|---------|------------|--------|
| Code Splitting | Breaking code into chunks loaded on demand | Smaller initial bundles |
| Prefetching | Loading resources before user needs them | Instant navigation |
| Streaming | Sending HTML progressively as data loads | Faster TTFB |
| Caching | Storing data/assets for reuse | Reduced server load |
| Critical Path | Resources needed for first render | Core Web Vitals |

---

## Built-in Performance Features

### Automatic Code Splitting

Remix splits code by route—each route is its own chunk:

```typescript
// Each route only loads its own code
routes/
  _index.tsx      → chunk-index.js
  about.tsx       → chunk-about.js
  posts/
    _index.tsx    → chunk-posts-index.js
    $postId.tsx   → chunk-posts-postId.js
```

**Why it matters:** Users only download code for the routes they visit.

### Parallel Data Loading

Nested routes load data in parallel, not in waterfall:

```
Traditional SPA:
Layout loader → Posts loader → Comments loader (sequential)

Remix:
Layout loader ↘
Posts loader  → All complete → Render
Comments loader ↗
```

```typescript
// All these load simultaneously
// routes/_layout.tsx
export const loader = async () => await getUser();

// routes/_layout.posts.tsx
export const loader = async () => await getPosts();

// routes/_layout.posts.$postId.tsx
export const loader = async () => await getComments();
```

---

## Prefetching Strategies

### Link Prefetching

```tsx
import { Link } from "@remix-run/react";

// None (default) - no prefetching
<Link to="/about">About</Link>

// Intent - prefetch on hover/focus
<Link to="/about" prefetch="intent">About</Link>

// Render - prefetch when link renders
<Link to="/about" prefetch="render">About</Link>

// Viewport - prefetch when link enters viewport
<Link to="/about" prefetch="viewport">About</Link>
```

### Prefetch Behavior

```tsx
export default function Navigation() {
  return (
    <nav>
      {/* Prefetch common navigation items */}
      <Link to="/" prefetch="render">Home</Link>
      <Link to="/products" prefetch="render">Products</Link>
      
      {/* Prefetch on intent for secondary navigation */}
      <Link to="/about" prefetch="intent">About</Link>
      <Link to="/contact" prefetch="intent">Contact</Link>
      
      {/* Long list - prefetch when visible */}
      {products.map(product => (
        <Link 
          key={product.id}
          to={`/products/${product.id}`}
          prefetch="viewport"
        >
          {product.name}
        </Link>
      ))}
    </nav>
  );
}
```

### Programmatic Prefetching

```tsx
import { usePrefetchBehavior } from "@remix-run/react";

function ProductCard({ product }) {
  const [prefetch, ref] = usePrefetchBehavior("intent");
  
  return (
    <Link
      ref={ref}
      to={`/products/${product.id}`}
      {...prefetch}
    >
      {product.name}
    </Link>
  );
}
```

---

## Streaming with defer()

Send HTML immediately, stream data as it loads:

```typescript
// app/routes/dashboard.tsx
import { defer } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  // Critical data - await immediately
  const user = await getUser(request);
  
  // Non-critical data - stream later
  const analyticsPromise = getAnalytics(user.id);
  const notificationsPromise = getNotifications(user.id);
  const recommendationsPromise = getRecommendations(user.id);
  
  return defer({
    user, // Immediately available
    analytics: analyticsPromise,         // Streams when ready
    notifications: notificationsPromise, // Streams when ready
    recommendations: recommendationsPromise,
  });
}

export default function Dashboard() {
  const { user, analytics, notifications, recommendations } = 
    useLoaderData<typeof loader>();
  
  return (
    <div>
      {/* Renders immediately */}
      <h1>Welcome, {user.name}</h1>
      
      {/* Streams when ready */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Await resolve={analytics}>
          {(data) => <AnalyticsChart data={data} />}
        </Await>
      </Suspense>
      
      <Suspense fallback={<NotificationsSkeleton />}>
        <Await resolve={notifications}>
          {(data) => <NotificationList notifications={data} />}
        </Await>
      </Suspense>
      
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Await resolve={recommendations}>
          {(data) => <RecommendedItems items={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### When to Use defer()

```typescript
// ✅ Good use cases for defer()
defer({
  // User needs to see the page, but analytics can load later
  user: await getUser(request),
  analytics: getAnalytics(), // Slow, non-critical
  
  // Main content loads fast, related items can stream
  product: await getProduct(params.id),
  relatedProducts: getRelatedProducts(params.id), // Secondary
  reviews: getReviews(params.id), // Can show skeleton
});

// ❌ Don't defer critical data
defer({
  // User can't see anything useful without the product
  product: getProduct(params.id), // Should await!
});
```

---

## Caching Strategies

### HTTP Cache Headers

```typescript
// app/routes/api.products.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const products = await getProducts();
  
  return json(products, {
    headers: {
      // Cache for 1 hour, stale-while-revalidate for 24 hours
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      // Vary by cookie for personalized responses
      "Vary": "Cookie",
    },
  });
}
```

### Cache Control Patterns

```typescript
// app/utils/cache.server.ts
export const cacheHeaders = {
  // Static content (rarely changes)
  static: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
  
  // Dynamic but cacheable
  dynamic: {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  },
  
  // Private user data
  private: {
    "Cache-Control": "private, max-age=0, must-revalidate",
  },
  
  // No caching
  none: {
    "Cache-Control": "no-store",
  },
};

// Usage
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const data = await getUserData(user.id);
  
  return json(data, { headers: cacheHeaders.private });
}
```

### ETag Caching

```typescript
// app/routes/api.content.$slug.tsx
import { createHash } from "crypto";

export async function loader({ params }: LoaderFunctionArgs) {
  const content = await getContent(params.slug);
  
  if (!content) {
    throw new Response("Not found", { status: 404 });
  }
  
  // Generate ETag from content
  const etag = createHash("md5")
    .update(JSON.stringify(content))
    .digest("hex");
  
  return json(content, {
    headers: {
      "ETag": `"${etag}"`,
      "Cache-Control": "private, must-revalidate",
    },
  });
}
```

---

## Server-Side Caching

### In-Memory Cache

```typescript
// app/utils/cache.server.ts
interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  
  if (cached && cached.expires > now) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, {
    data,
    expires: now + ttlSeconds * 1000,
  });
  
  return data;
}

// Usage
export async function loader({ params }: LoaderFunctionArgs) {
  const post = await getCached(
    `post:${params.id}`,
    () => prisma.post.findUnique({ where: { id: params.id } }),
    300 // Cache for 5 minutes
  );
  
  return json({ post });
}
```

### Redis Cache

```typescript
// app/utils/redis.server.ts
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedRedis<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }
  
  // Fetch and cache
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  
  return data;
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

## Bundle Optimization

### Analyzing Bundle Size

```bash
# Build with stats
npx remix vite:build --stats

# Analyze with rollup-plugin-visualizer
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    remix(),
    visualizer({
      filename: "stats.html",
      gzipSize: true,
    }),
  ],
});
```

### Tree Shaking Best Practices

```typescript
// ❌ Imports entire library
import _ from "lodash";
const result = _.groupBy(items, "category");

// ✅ Imports only what's needed
import groupBy from "lodash/groupBy";
const result = groupBy(items, "category");

// ✅ Even better - use native or smaller alternatives
const grouped = items.reduce((acc, item) => {
  (acc[item.category] ??= []).push(item);
  return acc;
}, {} as Record<string, typeof items>);
```

### Dynamic Imports for Heavy Libraries

```typescript
// app/routes/editor.tsx
import { lazy, Suspense } from "react";

// Heavy editor component loaded only when needed
const RichTextEditor = lazy(() => import("~/components/RichTextEditor"));

export default function EditorPage() {
  return (
    <div>
      <h1>Editor</h1>
      <Suspense fallback={<div>Loading editor...</div>}>
        <RichTextEditor />
      </Suspense>
    </div>
  );
}
```

---

## Image Optimization

### Responsive Images

```tsx
// app/components/ResponsiveImage.tsx
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}

export function ResponsiveImage({
  src,
  alt,
  sizes = "100vw",
  className,
}: ResponsiveImageProps) {
  // Generate srcset for different widths
  const widths = [320, 640, 960, 1280, 1920];
  const srcSet = widths
    .map((w) => `${src}?w=${w} ${w}w`)
    .join(", ");
  
  return (
    <img
      src={`${src}?w=960`}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
```

### Image CDN Integration

```typescript
// app/utils/images.ts
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "auto";
  } = {}
) {
  const { width, height, quality = 80, format = "auto" } = options;
  
  // Example with Cloudinary
  const transforms = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push(`q_${quality}`);
  if (format === "auto") transforms.push("f_auto");
  else transforms.push(`f_${format}`);
  
  return `https://res.cloudinary.com/your-cloud/image/upload/${transforms.join(",")}/${src}`;
}
```

---

## Database Query Optimization

### Avoiding N+1 Queries

```typescript
// ❌ N+1 problem
export async function loader() {
  const posts = await prisma.post.findMany();
  
  // Each iteration is a separate query!
  for (const post of posts) {
    post.author = await prisma.user.findUnique({
      where: { id: post.authorId },
    });
  }
  
  return json({ posts });
}

// ✅ Single query with include
export async function loader() {
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });
  
  return json({ posts });
}
```

### Pagination and Limiting

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        excerpt: true,
        createdAt: true,
      },
    }),
    prisma.post.count(),
  ]);
  
  return json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

---

## Measuring Performance

### Core Web Vitals

```typescript
// app/entry.client.tsx
import { onCLS, onFCP, onFID, onLCP, onTTFB } from "web-vitals";

function reportWebVitals(metric: { name: string; value: number }) {
  // Send to analytics
  console.log(metric);
  
  // Or send to your analytics endpoint
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify(metric),
    headers: { "Content-Type": "application/json" },
  });
}

// Report Core Web Vitals
onCLS(reportWebVitals);
onFCP(reportWebVitals);
onFID(reportWebVitals);
onLCP(reportWebVitals);
onTTFB(reportWebVitals);
```

### Server-Side Performance Monitoring

```typescript
// app/utils/perf.server.ts
export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return fn().finally(() => {
    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    
    // Send to monitoring service
    if (duration > 1000) {
      console.warn(`[SLOW] ${name} took ${duration.toFixed(2)}ms`);
    }
  });
}

// Usage
export async function loader({ params }: LoaderFunctionArgs) {
  const post = await measureAsync("getPost", () => 
    prisma.post.findUnique({ where: { id: params.id } })
  );
  
  return json({ post });
}
```

---

## Performance Checklist

### Development

- [ ] Profile loader performance
- [ ] Check for N+1 queries
- [ ] Analyze bundle size
- [ ] Test with slow network (Chrome DevTools)

### Production

- [ ] Enable compression (gzip/brotli)
- [ ] Set cache headers appropriately
- [ ] Use CDN for static assets
- [ ] Implement edge caching where possible
- [ ] Monitor Core Web Vitals
- [ ] Set up alerting for slow responses

---

## Senior Interview Focus Points

1. **How does Remix achieve better performance than typical SPAs?**
   - Server rendering eliminates loading spinners
   - Parallel data loading eliminates waterfalls
   - Automatic code splitting per route
   - Progressive enhancement means faster interaction

2. **When would you use defer() vs await?**
   - Await: Data needed for initial render
   - Defer: Secondary data that can stream
   - Consider: Does the user need to see this immediately?

3. **How do you debug slow loaders?**
   - Add timing measurements
   - Check database query plans
   - Look for N+1 queries
   - Profile with sampling tools
   - Check for synchronous blocking

4. **Prefetch strategy for large apps?**
   - `render` for primary navigation
   - `intent` for secondary links
   - `viewport` for long lists
   - Consider bandwidth and server load

5. **How do you handle cache invalidation?**
   - Short TTL + stale-while-revalidate
   - Event-driven invalidation (webhooks)
   - Manual purge endpoints
   - Versioned URLs for immutable content
