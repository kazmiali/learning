# Next.js 16 New Features & Changes

> "The future is already here — it's just not evenly distributed." — William Gibson

Next.js 16 was released on October 21, 2025, bringing major improvements to developer experience, caching, routing, and React integration. This guide covers all the new features, breaking changes, and migration strategies essential for senior full-stack engineer interviews.

---

## Professional Definition

| Concept | Definition | Why Seniors Care |
|---------|------------|------------------|
| Cache Components | New programming model using `"use cache"` directive with PPR | Explicit, opt-in caching replaces implicit behavior |
| Turbopack (stable) | Rust-based bundler now default for all apps | 2-5x faster builds, 10x faster Fast Refresh |
| `proxy.ts` | Replacement for `middleware.ts` on Node.js runtime | Clearer network boundary, single predictable runtime |
| Build Adapters API | Custom adapters to modify build process | Platform-agnostic deployments |
| React 19.2 | View Transitions, `useEffectEvent()`, `<Activity/>` | Native animations, cleaner effect logic |

---

## Simple Explanation (Feynman Backpack Edition)

Imagine upgrading from a bicycle to an electric car:

1. **Cache Components** = GPS with traffic prediction. You tell it where you want to go fast (cache), and it figures out the best route automatically.

2. **Turbopack** = Electric motor. Same controls, but everything accelerates 5x faster.

3. **`proxy.ts`** = Security checkpoint. Clear purpose, single location, everyone knows what it does.

4. **React Compiler** = Self-driving features. The car optimizes itself without you touching the pedals.

5. **View Transitions** = Smooth gear shifts. Pages flow into each other instead of jarring jumps.

---

## Major New Features

### 1. Cache Components (`"use cache"` directive)

Cache Components replace implicit caching with explicit, opt-in caching using the `"use cache"` directive.

```typescript
// next.config.ts
const nextConfig = {
  cacheComponents: true, // Enable Cache Components
};

export default nextConfig;
```

#### Using `"use cache"` Directive

```typescript
// app/products/page.tsx
import { unstable_cache } from 'next/cache';

// Cache an entire page
export default async function ProductsPage() {
  'use cache'; // This page will be cached
  
  const products = await fetchProducts();
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

```typescript
// Cache a function
async function getProducts() {
  'use cache';
  
  const res = await fetch('https://api.example.com/products');
  return res.json();
}

// Cache a component
async function ProductList() {
  'use cache';
  
  const products = await getProducts();
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

#### Key Points

| Aspect | Behavior |
|--------|----------|
| Default | All dynamic code runs at request time (no implicit caching) |
| Opt-in | Use `"use cache"` to explicitly cache pages, components, or functions |
| Cache Keys | Compiler automatically generates cache keys |
| PPR Integration | Works seamlessly with Partial Prerendering |

---

### 2. Turbopack (Stable & Default)

Turbopack is now the default bundler for all Next.js apps.

```bash
# Turbopack is now automatic
next dev   # Uses Turbopack by default
next build # Uses Turbopack by default

# Opt out to webpack if needed
next dev --webpack
next build --webpack
```

#### Performance Improvements

| Metric | Improvement |
|--------|-------------|
| Production builds | 2-5x faster |
| Fast Refresh | Up to 10x faster |
| Adoption | 50%+ dev sessions, 20%+ production builds on Next.js 15.3+ |

#### File System Caching (Beta)

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
```

Stores compiler artifacts on disk between runs for faster startup in large projects.

---

### 3. `proxy.ts` (Replaces `middleware.ts`)

The new `proxy.ts` file replaces `middleware.ts` with a clearer purpose.

```typescript
// proxy.ts (root of your project)
import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  // Authentication check
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Geo-based routing
  const country = request.geo?.country || 'US';
  if (country === 'DE' && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/de', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

#### Migration from `middleware.ts`

```typescript
// Before (middleware.ts) - DEPRECATED
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}

// After (proxy.ts) - NEW
export default function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}
```

| Change | Details |
|--------|---------|
| File rename | `middleware.ts` → `proxy.ts` |
| Function rename | `middleware()` → `proxy()` |
| Export type | Named → Default export |
| Runtime | Runs on Node.js runtime |
| Edge support | `middleware.ts` still works for Edge but is deprecated |

---

### 4. React Compiler Support (Stable)

Built-in React Compiler integration for automatic memoization.

```typescript
// next.config.ts
const nextConfig = {
  reactCompiler: true, // Note: moved from experimental
};

export default nextConfig;
```

```bash
# Install the Babel plugin
npm install babel-plugin-react-compiler@latest
```

#### What React Compiler Does

```tsx
// Before: Manual memoization
import { useMemo, useCallback, memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => 
    data.map(item => expensiveOperation(item)), [data]
  );
  
  const handleClick = useCallback(() => {
    console.log(processedData);
  }, [processedData]);
  
  return <div onClick={handleClick}>{processedData.length}</div>;
});

// After: React Compiler handles it automatically
const ExpensiveComponent = ({ data }) => {
  const processedData = data.map(item => expensiveOperation(item));
  
  const handleClick = () => {
    console.log(processedData);
  };
  
  return <div onClick={handleClick}>{processedData.length}</div>;
};
```

---

### 5. Improved Caching APIs

#### `revalidateTag()` (Updated)

Now requires a `cacheLife` profile as the second argument:

```typescript
import { revalidateTag } from 'next/cache';

// ✅ Use built-in cacheLife profiles
revalidateTag('blog-posts', 'max');    // Recommended for most cases
revalidateTag('news-feed', 'hours');
revalidateTag('analytics', 'days');

// Or use inline object with custom revalidation time
revalidateTag('products', { expire: 3600 });

// ⚠️ DEPRECATED - single argument form
revalidateTag('blog-posts'); // Don't use this anymore
```

#### `updateTag()` (New)

Server Actions-only API with read-your-writes semantics:

```typescript
'use server';

import { updateTag } from 'next/cache';

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile);
  
  // Expire cache and refresh immediately
  // User sees their changes right away
  updateTag(`user-${userId}`);
}
```

#### `refresh()` (New)

Server Actions-only API for refreshing uncached data:

```typescript
'use server';

import { refresh } from 'next/cache';

export async function markNotificationAsRead(notificationId: string) {
  await db.notifications.markAsRead(notificationId);
  
  // Refresh uncached data (like notification count in header)
  // without touching the cache
  refresh();
}
```

#### Caching API Comparison

| API | Use Case | Behavior |
|-----|----------|----------|
| `revalidateTag(tag, profile)` | Invalidate tagged cached entries | SWR: serve stale, revalidate in background |
| `updateTag(tag)` | User expects to see changes immediately | Read-your-writes: expire and fetch fresh |
| `refresh()` | Refresh uncached dynamic data | Re-render without touching cache |

---

### 6. Enhanced Routing and Navigation

#### Layout Deduplication

```typescript
// Before: 50 product links = 50 layout downloads
// After: 50 product links = 1 shared layout download

// app/products/layout.tsx
export default function ProductLayout({ children }) {
  return (
    <div className="product-container">
      <ProductSidebar />
      {children}
    </div>
  );
}
```

#### Incremental Prefetching

- Prefetches only parts not already in cache
- Cancels requests when link leaves viewport
- Prioritizes on hover or viewport re-entry
- Re-prefetches when data is invalidated

---

### 7. React 19.2 Features

#### View Transitions

```tsx
'use client';

import { ViewTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function AnimatedNav() {
  const router = useRouter();
  
  const navigate = (href: string) => {
    document.startViewTransition(() => {
      router.push(href);
    });
  };
  
  return (
    <nav>
      <button onClick={() => navigate('/home')}>Home</button>
      <button onClick={() => navigate('/about')}>About</button>
    </nav>
  );
}
```

#### `useEffectEvent()`

Extract non-reactive logic from Effects:

```tsx
import { useEffect, useEffectEvent } from 'react';

function ChatRoom({ roomId, onMessage }) {
  // This function is stable - won't cause Effect to re-run
  const onReceiveMessage = useEffectEvent((message) => {
    onMessage(message);
  });
  
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('message', onReceiveMessage);
    return () => connection.disconnect();
  }, [roomId]); // Only re-run when roomId changes
}
```

#### `<Activity/>` Component

Render "background activity" while maintaining state:

```tsx
import { Activity } from 'react';

function TabContainer({ activeTab }) {
  return (
    <div>
      {/* Visible tab */}
      <TabContent tab={activeTab} />
      
      {/* Hidden tabs - state preserved, effects cleaned up */}
      {tabs.filter(t => t !== activeTab).map(tab => (
        <Activity key={tab} mode="hidden">
          <TabContent tab={tab} />
        </Activity>
      ))}
    </div>
  );
}
```

---

### 8. Next.js DevTools MCP

Model Context Protocol integration for AI-assisted debugging:

```typescript
// Provides AI agents with:
// - Next.js knowledge (routing, caching, rendering)
// - Unified browser and server logs
// - Automatic error access with stack traces
// - Page awareness and contextual understanding
```

---

### 9. Build Adapters API (Alpha)

Create custom adapters for deployment platforms:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    adapterPath: require.resolve('./my-adapter.js'),
  },
};

module.exports = nextConfig;
```

```javascript
// my-adapter.js
module.exports = {
  name: 'my-custom-adapter',
  
  async onBuild({ buildOutput }) {
    // Process build output for your platform
    console.log('Processing build for custom platform...');
    return modifiedOutput;
  },
  
  async onDev({ config }) {
    // Modify config during development
    return config;
  },
};
```

---

## Breaking Changes Summary

### Version Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 20.9+ (Node.js 18 no longer supported) |
| TypeScript | 5.1.0+ |
| Chrome | 111+ |
| Firefox | 111+ |
| Safari | 16.4+ |

### Removals

| Removed Feature | Migration |
|-----------------|-----------|
| AMP support | Removed entirely (useAmp, config.amp) |
| `next lint` command | Use ESLint or Biome directly |
| `serverRuntimeConfig`, `publicRuntimeConfig` | Use `.env` files |
| `experimental.turbopack` | Moved to top-level `turbopack` |
| `experimental.dynamicIO` | Renamed to `cacheComponents` |
| `experimental.ppr` | Replaced by Cache Components |
| Sync params/searchParams access | Must use `await` |
| Sync `cookies()`, `headers()`, `draftMode()` | Must use `await` |

### Behavior Changes

| Change | Details |
|--------|---------|
| Default bundler | Turbopack (opt out with `--webpack`) |
| `images.minimumCacheTTL` | 60s → 4 hours (14400s) |
| `images.qualities` | [1..100] → [75] (coerced to closest) |
| `revalidateTag()` | Now requires second argument (cacheLife profile) |
| Parallel routes | All slots require explicit `default.js` files |

### Async APIs Migration

```typescript
// Before (Next.js 15)
export default function Page({ params, searchParams }) {
  const { id } = params;
  const { query } = searchParams;
}

// After (Next.js 16)
export default async function Page({ 
  params, 
  searchParams 
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query: string }>;
}) {
  const { id } = await params;
  const { query } = await searchParams;
}
```

```typescript
// Before
import { cookies, headers } from 'next/headers';

export default function Page() {
  const cookieStore = cookies();
  const headersList = headers();
}

// After
import { cookies, headers } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const headersList = await headers();
}
```

---

## Migration Guide

### Automated Migration

```bash
# Use the codemod CLI for automated migration
npx @next/codemod@canary upgrade latest
```

### Manual Steps

1. **Update dependencies:**
```bash
npm install next@latest react@latest react-dom@latest
```

2. **Rename middleware:**
```bash
# Rename file
mv middleware.ts proxy.ts

# Update export
# middleware() → proxy()
# export function → export default function
```

3. **Update async APIs:**
```typescript
// Add await to params, searchParams, cookies(), headers()
```

4. **Update caching APIs:**
```typescript
// revalidateTag('tag') → revalidateTag('tag', 'max')
```

5. **Add default.js to parallel routes:**
```typescript
// app/@modal/default.tsx
export default function Default() {
  return null;
}
```

---

## Senior-Level Interview Prompts & Answers

### 1. "What is the biggest architectural change in Next.js 16?"

**Answer:** Cache Components fundamentally change how caching works:

1. **Implicit → Explicit**: All code is dynamic by default. Caching is opt-in via `"use cache"` directive.
2. **Compiler-generated keys**: No manual cache key management.
3. **Completes PPR story**: Static shells with dynamic holes, now with explicit cache boundaries.

This aligns Next.js with developer expectations - you get predictable behavior without hidden caching surprises.

### 2. "Why did Next.js replace middleware.ts with proxy.ts?"

**Answer:** Several reasons:
1. **Clearer naming**: "Proxy" better describes what it does (intercept/route requests)
2. **Single runtime**: `proxy.ts` runs on Node.js, eliminating Edge runtime confusion
3. **Network boundary clarity**: Makes it obvious this is the app's entry point for routing logic
4. **Deprecation path**: Edge middleware still works but is deprecated, giving time to migrate

### 3. "How do the new caching APIs differ from Next.js 15?"

**Answer:** Three-tier system:

| API | Purpose |
|-----|---------|
| `revalidateTag(tag, profile)` | Background revalidation (SWR). User sees stale content while fresh data loads |
| `updateTag(tag)` | Immediate invalidation. User sees fresh data in same request (Server Actions only) |
| `refresh()` | Re-render uncached data without touching cache |

The key insight: `revalidateTag` is for background jobs, `updateTag` is for user actions where they expect immediate feedback.

### 4. "What's the impact of Turbopack being default?"

**Answer:**
1. **Performance**: 2-5x faster builds, 10x faster HMR
2. **Compatibility**: Most webpack configs work, but custom loaders may need updates
3. **File system caching**: New beta feature for persistent compilation cache
4. **Opt-out**: `--webpack` flag available for gradual migration

---

## Common Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using sync params access | Build fails in Next.js 16 | Add `await` to params, searchParams |
| Single-argument `revalidateTag` | Deprecated, different behavior | Add cacheLife profile as second argument |
| Missing `default.js` in parallel routes | Build fails | Create `default.js` returning `null` or `notFound()` |
| Using `middleware.ts` for new projects | Deprecated, will be removed | Use `proxy.ts` instead |
| Expecting implicit caching | Data re-fetches on every request | Use `"use cache"` directive explicitly |
| Not updating Node.js | Build fails | Upgrade to Node.js 20.9+ |

---

## Quick Reference

```typescript
// next.config.ts - Next.js 16 config example
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Cache Components (replaces PPR)
  cacheComponents: true,
  
  // Enable React Compiler
  reactCompiler: true,
  
  // Turbopack is now default (no config needed)
  // Use turbopack: {} for customization
  
  experimental: {
    // File system caching for Turbopack
    turbopackFileSystemCacheForDev: true,
    
    // Custom build adapter
    adapterPath: './my-adapter.js',
  },
};

export default nextConfig;
```

```bash
# Upgrade commands
npx @next/codemod@canary upgrade latest  # Automated
npm install next@latest react@latest react-dom@latest  # Manual
```
