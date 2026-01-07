# Deployment & Production

> "It works on my machine" is not a deployment strategy." — Unknown

Deploying Next.js applications requires understanding the different rendering modes, build outputs, and hosting options. This guide covers production deployment strategies, environment configuration, and operational best practices.

---

## Professional Definition

| Concept | Definition | Why Seniors Care |
|---------|------------|------------------|
| Build Output | The compiled application ready for deployment | Understanding output determines hosting options |
| Standalone Mode | Self-contained Node.js server without node_modules | Smaller Docker images, faster cold starts |
| Static Export | Pure static files (HTML, CSS, JS) | Deploy anywhere, no server needed |
| Edge Deployment | Running at CDN edge locations | Global low-latency, higher availability |
| Environment Variables | Configuration that varies between environments | Secure secrets management |

---

## Simple Explanation (Feynman Backpack Edition)

Imagine opening restaurant locations:

1. **Local Development** = Test kitchen. Experiment freely, taste everything.

2. **Build Process** = Creating the restaurant manual. Recipes, procedures, training materials.

3. **Staging** = Soft opening. Real customers, but limited audience. Find issues before grand opening.

4. **Production** = Grand opening. Real customers, real orders, reputation on the line.

5. **Deployment Options:**
   - **Vercel** = Franchise headquarters handles everything
   - **Self-hosted** = Own the building, manage everything yourself
   - **Static Export** = Food truck. Simple, goes anywhere, limited menu

---

## Build Process

### Development vs Production

```bash
# Development - fast refresh, detailed errors
npm run dev

# Production build - optimized, minified
npm run build

# Start production server
npm run start
```

### Build Output Analysis

```bash
# Run production build
npm run build

# Output:
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         92 kB
├ ○ /about                               1.2 kB         88 kB
├ ● /blog/[slug]                         2.5 kB         89 kB
├ ○ /dashboard                           8.1 kB         95 kB
└ λ /api/users                           0 B            0 B

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses getStaticProps)
λ  (Dynamic)  server-rendered on demand
```

---

## Deployment Platforms

### Vercel (Recommended)

Zero-config deployment for Next.js:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "cdg1"],
  "env": {
    "DATABASE_URL": "@database-url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Enable Standalone Output

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
};
```

```bash
# Build and run
docker build -t my-next-app .
docker run -p 3000:3000 my-next-app
```

### Self-Hosted (Node.js)

```bash
# Install dependencies
npm ci

# Build
npm run build

# Start with PM2
pm2 start npm --name "next-app" -- start

# Or with systemd
sudo nano /etc/systemd/system/nextjs.service
```

```ini
# /etc/systemd/system/nextjs.service
[Unit]
Description=Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/myapp
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable nextjs
sudo systemctl start nextjs
```

### Static Export

For static hosting (Netlify, GitHub Pages, S3):

```javascript
// next.config.js
module.exports = {
  output: 'export',
  // Optional: Change base path for GitHub Pages
  basePath: '/repo-name',
  images: {
    unoptimized: true, // Required for static export
  },
};
```

```bash
npm run build
# Output in 'out' directory
```

#### Static Export Limitations

| Not Supported | Alternative |
|---------------|-------------|
| Server Components with async | Use client-side fetching |
| Dynamic routes without `generateStaticParams` | Provide all params |
| API routes | External API |
| Middleware | Hosting platform rules |
| Image optimization | Use `unoptimized: true` |
| ISR | Build-time only |

---

## Environment Variables

### Environment Files

```
.env                  # All environments (committed)
.env.local            # Local overrides (gitignored)
.env.development      # Development only
.env.production       # Production only
.env.test             # Test environment
```

### Variable Types

```bash
# .env.local

# Server-only (never exposed to browser)
DATABASE_URL="postgresql://..."
API_SECRET="super-secret-key"
JWT_SECRET="jwt-secret"

# Client-side (exposed to browser)
NEXT_PUBLIC_API_URL="https://api.example.com"
NEXT_PUBLIC_GA_ID="G-XXXXXXX"
```

### Runtime Configuration

```javascript
// next.config.js
module.exports = {
  serverRuntimeConfig: {
    // Only available on server
    mySecret: process.env.MY_SECRET,
  },
  publicRuntimeConfig: {
    // Available on both server and client
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  },
};
```

### Validating Environment Variables

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
});
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Test
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  e2e:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Database Migrations in CI

```yaml
# .github/workflows/ci.yml
jobs:
  migrate:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Monitoring & Observability

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
});
```

```typescript
// app/global-error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <h1>Something went wrong!</h1>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
```

### Analytics

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Health Checks

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
```

---

## Security Checklist

### Headers Configuration

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim(),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Security Best Practices

| Category | Practice |
|----------|----------|
| Environment | Never commit secrets to git |
| Auth | Use httpOnly cookies for tokens |
| CSRF | Use SameSite cookies |
| XSS | Sanitize user input |
| SQL Injection | Use parameterized queries (ORMs do this) |
| Rate Limiting | Implement on API routes |
| Dependencies | Regular security audits (`npm audit`) |

---

## Scaling Strategies

### Horizontal Scaling

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    deploy:
      replicas: 3
    ports:
      - "3000-3002:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - app
```

```nginx
# nginx.conf
upstream nextjs {
    server app:3000;
    server app:3001;
    server app:3002;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### CDN Configuration

```javascript
// next.config.js
module.exports = {
  // Serve static assets from CDN
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.example.com'
    : '',
  
  // Image optimization from CDN
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
};
```

---

## Rollback Strategies

### Blue-Green Deployment

```yaml
# Vercel handles this automatically
# For self-hosted:

# 1. Deploy to "green" environment
# 2. Run health checks
# 3. Switch load balancer to green
# 4. Keep blue as rollback
```

### Feature Flags for Safe Rollouts

```typescript
// lib/feature-flags.ts
import { unstable_flag as flag } from '@vercel/flags/next';

export const showNewFeature = flag({
  key: 'new-feature',
  decide: async () => {
    // Roll out to 10% of users
    return Math.random() < 0.1;
  },
});
```

```tsx
// app/page.tsx
import { showNewFeature } from '@/lib/feature-flags';

export default async function Page() {
  const useNewFeature = await showNewFeature();
  
  return useNewFeature ? <NewFeature /> : <OldFeature />;
}
```

---

## Senior-Level Interview Prompts & Answers

### 1. "How do you handle zero-downtime deployments?"

**Answer:** Multiple strategies:
1. **Blue-Green**: Run two environments, switch at load balancer
2. **Rolling updates**: Gradually replace instances (Kubernetes)
3. **Vercel/serverless**: Automatic with immutable deployments
4. **Database**: Use backward-compatible migrations

Key: Health checks, graceful shutdown, and ability to rollback quickly.

### 2. "How do you manage environment variables across environments?"

**Answer:**
1. Use `.env.*` files for local development (gitignored)
2. Store secrets in platform's secret management (Vercel, AWS Secrets Manager)
3. Validate env vars at build time with Zod
4. Never expose server secrets to client (no `NEXT_PUBLIC_` prefix)
5. Use different values per environment (dev/staging/prod)

### 3. "What's your production monitoring strategy?"

**Answer:**
1. **Error tracking**: Sentry for exception monitoring
2. **Performance**: Vercel Analytics, Web Vitals
3. **Logs**: Structured logging to aggregator (Datadog, Logtail)
4. **Health checks**: `/api/health` endpoint for load balancers
5. **Alerts**: PagerDuty/Slack for critical issues
6. **Dashboards**: Grafana for custom metrics

### 4. "How do you optimize cold starts in serverless?"

**Answer:**
1. Reduce bundle size (tree-shaking, dynamic imports)
2. Use `output: 'standalone'` for smaller deployments
3. Keep functions warm with scheduled pings
4. Use Edge runtime for faster cold starts
5. Lazy-load heavy dependencies
6. Use connection pooling for databases

---

## Common Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| Committing `.env.local` | Exposed secrets | Add to `.gitignore` |
| No health checks | Silent failures | Implement `/api/health` |
| Large Docker images | Slow deployments | Use standalone output |
| Missing database connection pooling | Connection exhaustion | Use PgBouncer or serverless DBs |
| No rollback plan | Stuck with broken deploy | Blue-green, feature flags |
| Ignoring Core Web Vitals | Poor user experience | Monitor and optimize |
