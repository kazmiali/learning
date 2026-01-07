# Performance Optimization & Best Practices

> "Premature optimization is the root of all evil, but mature optimization is the root of all good applications." — Adapted

Performance in Next.js isn't just about fast load times—it's about creating resilient applications that scale efficiently. This guide covers Core Web Vitals optimization, bundle analysis, caching strategies, and production best practices.

---

## Professional Definition

| Metric | Definition | Target | Why It Matters |
|--------|------------|--------|----------------|
| LCP (Largest Contentful Paint) | Time to render largest content | < 2.5s | Perceived load speed |
| FID (First Input Delay) | Time to respond to first interaction | < 100ms | Interactivity |
| CLS (Cumulative Layout Shift) | Visual stability during load | < 0.1 | User experience |
| TTFB (Time to First Byte) | Server response time | < 200ms | Server performance |
| INP (Interaction to Next Paint) | Overall responsiveness | < 200ms | Replaces FID (2024+) |

---

## Simple Explanation (Feynman Backpack Edition)

Imagine opening a restaurant:

1. **LCP** = How fast food arrives at the table. Customers see "the main dish" quickly.

2. **FID/INP** = How quickly servers respond to requests. "Excuse me, can I get water?" → Instant response vs. "Hold on..."

3. **CLS** = Tables and chairs not moving while customers sit down. Stable layout.

4. **TTFB** = Kitchen prep time before cooking starts. The faster you start, the sooner food arrives.

5. **Bundle Size** = The size of your kitchen equipment. A food truck (small bundle) moves faster than a semi-truck (bloated bundle).

---

## Image Optimization

### Next.js Image Component

```tsx
import Image from 'next/image';

// Basic usage
export function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="User avatar"
      width={64}
      height={64}
      priority // Load immediately (above the fold)
    />
  );
}

// Responsive image
export function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{ objectFit: 'cover' }}
      priority
    />
  );
}

// With placeholder blur
export function ProductImage({ product }: { product: Product }) {
  return (
    <Image
      src={product.imageUrl}
      alt={product.name}
      width={400}
      height={300}
      placeholder="blur"
      blurDataURL={product.blurDataUrl} // Base64 tiny image
    />
  );
}
```

### Image Configuration

```javascript
// next.config.js
const nextConfig = {
  images: {
    // Remote image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
    
    // Image formats
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Minimize image size
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
};

module.exports = nextConfig;
```

### Generate Blur Placeholders

```typescript
// lib/images.ts
import { getPlaiceholder } from 'plaiceholder';

export async function getImageWithBlur(src: string) {
  const buffer = await fetch(src).then(res => res.arrayBuffer());
  const { base64 } = await getPlaiceholder(Buffer.from(buffer));
  
  return {
    src,
    blurDataURL: base64,
  };
}
```

---

## Font Optimization

### Using next/font

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

```css
/* Use CSS variables */
.code {
  font-family: var(--font-roboto-mono);
}
```

### Local Fonts

```tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    {
      path: './fonts/MyFont-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/MyFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
});
```

---

## Code Splitting & Lazy Loading

### Dynamic Imports

```tsx
import dynamic from 'next/dynamic';

// Lazy load heavy component
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Only load on client
});

// Lazy load with named export
const Modal = dynamic(
  () => import('@/components/Modal').then(mod => mod.Modal),
  { loading: () => <ModalSkeleton /> }
);

export default function Dashboard() {
  return (
    <div>
      <Header />
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
```

### Component-Level Code Splitting

```tsx
'use client';

import { lazy, Suspense, useState } from 'react';

// Lazy load on interaction
const ExpensiveModal = lazy(() => import('./ExpensiveModal'));

export function ModalButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      
      {isOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <ExpensiveModal onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
```

### Route-Based Code Splitting

Next.js automatically code-splits by route. Each page only loads its dependencies.

---

## Bundle Analysis

### Setup

```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});
```

```bash
# Run analysis
ANALYZE=true npm run build
```

### Reducing Bundle Size

```typescript
// ❌ Imports entire library
import { format, parse, addDays } from 'date-fns';

// ✅ Import specific functions (tree-shakeable)
import format from 'date-fns/format';
import parse from 'date-fns/parse';

// ❌ Heavy icon library
import { Icon } from '@iconify/react';

// ✅ Specific icons only
import HomeIcon from '@iconify/icons-mdi/home';
```

### Import Cost Awareness

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
    ],
  },
};
```

---

## Caching Strategies

### HTTP Cache Headers

```typescript
// app/api/data/route.ts
export async function GET() {
  const data = await fetchData();
  
  return Response.json(data, {
    headers: {
      // Cache for 1 hour, stale-while-revalidate for 1 day
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

### Static Page Headers

```typescript
// app/products/page.tsx
export const revalidate = 3600; // Revalidate every hour

// Or in next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### Client-Side Caching with SWR

```tsx
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function UserProfile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/users/${userId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Dedupe requests for 1 minute
    }
  );

  if (isLoading) return <Skeleton />;
  if (error) return <Error />;
  
  return <Profile user={data} />;
}
```

---

## Server Component Optimization

### Parallel Data Fetching

```tsx
// ✅ Parallel - independent data
export default async function Dashboard() {
  const [user, posts, analytics] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchAnalytics(),
  ]);

  return (
    <div>
      <UserCard user={user} />
      <PostList posts={posts} />
      <AnalyticsChart data={analytics} />
    </div>
  );
}
```

### Streaming with Suspense

```tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      {/* Renders immediately */}
      <Header />
      
      {/* Streams in when ready */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChart />
      </Suspense>
      
      <Suspense fallback={<TableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
}
```

### Preloading Data

```tsx
// lib/data.ts
import { cache } from 'react';

// Deduplicated across component tree
export const getUser = cache(async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Preload function
export function preloadUser(id: string) {
  void getUser(id);
}

// Usage in parent component
export default function Page({ userId }: { userId: string }) {
  // Start fetching early
  preloadUser(userId);
  
  return <UserProfile userId={userId} />;
}
```

---

## Client Component Optimization

### Memoization

```tsx
'use client';

import { memo, useMemo, useCallback } from 'react';

// Memoize expensive component
const ExpensiveList = memo(function ExpensiveList({ 
  items 
}: { 
  items: Item[] 
}) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

// Memoize expensive computation
function Dashboard({ data }: { data: DataPoint[] }) {
  const processedData = useMemo(() => {
    return data.map(point => ({
      ...point,
      computed: expensiveCalculation(point),
    }));
  }, [data]);

  // Memoize callback
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return <ExpensiveList items={processedData} onClick={handleClick} />;
}
```

### Avoiding Re-renders

```tsx
'use client';

import { useState } from 'react';

// ❌ Bad: SearchBox re-renders on every keystroke
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  return (
    <div>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
      />
      <SearchBox query={query} /> {/* Re-renders on every keystroke */}
      <Results results={results} />
    </div>
  );
}

// ✅ Good: Isolate frequently changing state
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  
  // Debounce before searching
  const debouncedSearch = useDebouncedCallback(onSearch, 300);

  return (
    <input
      value={query}
      onChange={e => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}

function SearchPage() {
  const [results, setResults] = useState([]);

  return (
    <div>
      <SearchInput onSearch={handleSearch} />
      <Results results={results} />
    </div>
  );
}
```

---

## Reducing JavaScript

### Keep Client Components Small

```tsx
// ❌ Bad: Entire component is client
'use client';

export default function ProductPage({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <img src={product.image} alt={product.name} />
      <Reviews reviews={product.reviews} />
      {/* Only this part needs client */}
      <input value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
      <button>Add to Cart</button>
    </div>
  );
}

// ✅ Good: Extract only interactive parts
// app/products/[id]/page.tsx (Server Component)
export default async function ProductPage({ params }) {
  const product = await fetchProduct(params.id);
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <img src={product.image} alt={product.name} />
      <Reviews reviews={product.reviews} />
      <AddToCartButton productId={product.id} price={product.price} />
    </div>
  );
}

// components/AddToCartButton.tsx (Client Component)
'use client';

export function AddToCartButton({ productId, price }) {
  const [quantity, setQuantity] = useState(1);
  // Small, focused client component
}
```

---

## Prefetching

### Link Prefetching

```tsx
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      {/* Prefetched by default for visible links */}
      <Link href="/dashboard">Dashboard</Link>
      
      {/* Disable prefetch for rarely visited pages */}
      <Link href="/settings" prefetch={false}>Settings</Link>
    </nav>
  );
}
```

### Programmatic Prefetching

```tsx
'use client';

import { useRouter } from 'next/navigation';

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  return (
    <div
      onMouseEnter={() => router.prefetch(`/products/${product.id}`)}
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <h2>{product.name}</h2>
    </div>
  );
}
```

---

## Monitoring & Measuring

### Web Vitals Reporting

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Web Vitals

```typescript
// app/web-vitals.ts
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    console.log(metric);
    
    // Example: Send to Google Analytics
    window.gtag?.('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(
        metric.name === 'CLS' ? metric.value * 1000 : metric.value
      ),
      non_interaction: true,
    });
  });
  
  return null;
}
```

---

## Production Checklist

### Build Optimization

```javascript
// next.config.js
module.exports = {
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable SWC minification (default in Next.js 13+)
  swcMinify: true,
  
  // Optimize package imports
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};
```

### Performance Checklist

| Category | Check |
|----------|-------|
| Images | ✅ Using next/image with proper sizes |
| Fonts | ✅ Using next/font with display: swap |
| JS Bundle | ✅ Dynamic imports for heavy components |
| Caching | ✅ Proper Cache-Control headers |
| Data | ✅ Parallel fetching with Promise.all |
| Streaming | ✅ Suspense for slow components |
| Third-party | ✅ Lazy load analytics, chat widgets |
| Client JS | ✅ Minimal 'use client' usage |

---

## Senior-Level Interview Prompts & Answers

### 1. "How do you optimize Core Web Vitals in Next.js?"

**Answer:**
- **LCP**: Prioritize above-the-fold images with `priority`, use streaming for content, optimize fonts with `next/font`
- **CLS**: Set explicit image dimensions, reserve space for dynamic content, preload fonts
- **INP**: Minimize client JavaScript, use `startTransition` for non-urgent updates, debounce handlers

Measure with Lighthouse, Chrome DevTools, and real user monitoring.

### 2. "How do you reduce bundle size in Next.js?"

**Answer:**
1. Keep components server-side when possible
2. Use dynamic imports for heavy client components
3. Analyze with `@next/bundle-analyzer`
4. Use tree-shakeable imports (specific paths)
5. Enable `optimizePackageImports` for known heavy packages
6. Avoid importing entire libraries

### 3. "Explain Next.js caching layers and how to optimize each."

**Answer:** Four layers:
1. **Request Memoization**: Automatic for same fetch in render tree
2. **Data Cache**: Set `revalidate` or tags for fetch results
3. **Full Route Cache**: Optimize by maximizing static routes
4. **Router Cache**: Client-side, refresh with `router.refresh()`

Optimize by understanding defaults (cache-first), explicitly opting out when needed, and using tags for surgical revalidation.

### 4. "How do you handle performance monitoring in production?"

**Answer:**
1. Real User Monitoring (RUM) with Vercel Speed Insights or custom implementation
2. `useReportWebVitals` hook to capture metrics
3. Error boundaries with logging (Sentry, LogRocket)
4. Lighthouse CI in deployment pipeline
5. Synthetic monitoring for critical paths

---

## Common Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| Images without dimensions | CLS issues | Always set width/height |
| Using 'use client' everywhere | Bloated bundles | Only add when truly needed |
| Sequential data fetching | Slow TTFB | Use Promise.all() |
| No loading states | Poor perceived performance | Add loading.tsx, Suspense |
| Blocking third-party scripts | Delayed interactivity | Lazy load with dynamic |
| Large inline data | Bloated HTML | Fetch in separate components |
