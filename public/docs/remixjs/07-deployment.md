# Remix Deployment & Production

> "Ship it." — The Most Important Step

Remix is designed to run on any JavaScript runtime. This flexibility means you can deploy to traditional Node.js servers, serverless functions, or edge runtimes. Understanding deployment options is crucial for senior engineers.

---

## Professional Definition

| Concept | Definition | Senior Consideration |
|---------|------------|---------------------|
| Adapters | Platform-specific request handlers | Bridge between platform and Remix |
| Server Build | Compiled server-side code | Single entry point for your server |
| Client Build | Browser bundles and assets | Static files served from CDN |
| Edge Runtime | Code running at CDN edge locations | Sub-50ms latency globally |
| Serverless | Functions spun up on-demand | Cost-effective, auto-scaling |

---

## Build Output Structure

```bash
# Production build
npm run build

# Output structure
build/
├── client/                 # Browser assets (serve statically)
│   ├── assets/
│   │   ├── root-abc123.js
│   │   ├── routes/
│   │   └── ...
│   └── favicon.ico
│
└── server/                 # Server code (run with Node/Edge)
    └── index.js           # Server entry point
```

---

## Deployment Targets

### 1. Node.js Server (Express)

```typescript
// server.ts
import { createRequestHandler } from "@remix-run/express";
import express from "express";
import compression from "compression";
import morgan from "morgan";

const app = express();

// Compression
app.use(compression());

// Logging
app.use(morgan("tiny"));

// Static files with long cache
app.use(
  "/assets",
  express.static("build/client/assets", {
    immutable: true,
    maxAge: "1y",
  })
);

// Other static files (favicon, etc.)
app.use(express.static("build/client", { maxAge: "1h" }));

// Remix handler
app.all(
  "*",
  createRequestHandler({
    build: await import("./build/server/index.js"),
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Vercel

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build/client",
  "framework": null,
  "functions": {
    "build/server/index.js": {
      "runtime": "@vercel/node@3"
    }
  },
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": { "Cache-Control": "public, max-age=31536000, immutable" },
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/build/server/index.js"
    }
  ]
}
```

```typescript
// app/entry.server.tsx for Vercel
import { createRequestHandler } from "@remix-run/vercel";
import * as build from "./build/server";

export default createRequestHandler({ build });
```

### 3. Cloudflare Workers (Edge)

```typescript
// server.ts
import { createRequestHandler, logDevReady } from "@remix-run/cloudflare";
import * as build from "./build/server";

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const handler = createRequestHandler(build, process.env.NODE_ENV);
    return handler(request, {
      cloudflare: { env, ctx },
    });
  },
};
```

```toml
# wrangler.toml
name = "my-remix-app"
main = "build/server/index.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./build/client"
```

### 4. Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build/client"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

```typescript
// netlify/functions/server.ts
import { createRequestHandler } from "@remix-run/netlify";
import * as build from "../../build/server";

export const handler = createRequestHandler({ build });
```

### 5. AWS Lambda

```typescript
// server.ts
import { createRequestHandler } from "@remix-run/architect";
import * as build from "./build/server";

export const handler = createRequestHandler({
  build,
  getLoadContext(event) {
    return {
      awsRequestId: event.requestContext.requestId,
    };
  },
});
```

### 6. Fly.io

```dockerfile
# Dockerfile
FROM node:20-slim AS base

# Build stage
FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
```

```toml
# fly.toml
app = "my-remix-app"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true

[env]
  NODE_ENV = "production"
```

---

## Environment Variables

### Server-Side Variables

```typescript
// Only accessed on server
export async function loader() {
  const apiKey = process.env.API_KEY; // Safe!
  const data = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return json({ data: await data.json() });
}
```

### Client-Side Variables

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    "process.env.PUBLIC_API_URL": JSON.stringify(process.env.PUBLIC_API_URL),
  },
});
```

```typescript
// Access in client code
const apiUrl = process.env.PUBLIC_API_URL;
```

### Type-Safe Environment

```typescript
// app/env.server.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
```

---

## Production Optimization

### Caching Headers

```typescript
// app/routes/products.tsx
export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    // Browser caches for 5 minutes
    // CDN caches for 1 hour
    "Cache-Control": "public, max-age=300, s-maxage=3600",
    // Serve stale while revalidating
    "CDN-Cache-Control": "stale-while-revalidate=86400",
  };
};
```

### Static Asset Caching

```typescript
// server.ts
app.use(
  "/assets",
  express.static("build/client/assets", {
    immutable: true,
    maxAge: "1y", // Fingerprinted files can be cached forever
  })
);

app.use(
  express.static("build/client", {
    maxAge: "1h", // Other static files cached for 1 hour
  })
);
```

### Compression

```typescript
import compression from "compression";

app.use(compression());
```

### Security Headers

```typescript
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Remix needs inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
```

---

## Health Checks & Monitoring

### Health Check Route

```typescript
// app/routes/health.tsx
export async function loader() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response("Unhealthy", { status: 503 });
  }
}
```

### Request Logging

```typescript
// server.ts
import morgan from "morgan";

// Custom format with response time
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);
```

### Error Tracking (Sentry Example)

```typescript
// app/entry.server.tsx
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export function handleError(error: Error, { request }: { request: Request }) {
  Sentry.captureException(error, {
    extra: {
      url: request.url,
      method: request.method,
    },
  });
}
```

---

## Database Considerations

### Connection Pooling

```typescript
// app/utils/db.server.ts
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
}

export { prisma };
```

### Serverless Database Connections

```typescript
// For serverless, use connection poolers like PgBouncer or Prisma Data Proxy
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Use pooled connection URL
    },
  },
});
```

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npm run typecheck
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Fly.io
        uses: superfly/flyctl-actions@v1
        with:
          args: "deploy"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## Performance Monitoring

### Web Vitals Tracking

```typescript
// app/entry.client.tsx
import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { reportWebVitals } from "./utils/vitals";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});

// Report metrics
reportWebVitals(console.log);
```

```typescript
// app/utils/vitals.ts
import { onCLS, onFCP, onFID, onLCP, onTTFB } from "web-vitals";

export function reportWebVitals(onReport: (metric: any) => void) {
  onCLS(onReport);
  onFCP(onReport);
  onFID(onReport);
  onLCP(onReport);
  onTTFB(onReport);
}
```

---

## Rollback Strategies

### Immutable Deployments

```bash
# Fly.io - keep multiple versions
fly releases

# Rollback to previous version
fly releases rollback
```

### Blue-Green Deployment

```yaml
# fly.toml
[deploy]
  strategy = "bluegreen"
```

### Feature Flags

```typescript
// app/utils/features.server.ts
export function isFeatureEnabled(feature: string, userId?: string) {
  const flags = {
    newCheckout: true,
    darkMode: process.env.NODE_ENV === "development",
  };
  
  return flags[feature] ?? false;
}

// Usage in loader
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const showNewCheckout = isFeatureEnabled("newCheckout", user?.id);
  
  return json({ showNewCheckout });
}
```

---

## Senior Interview Focus Points

1. **How do you choose a deployment target?**
   - Consider cold start times (serverless vs always-on)
   - Geographic distribution needs (edge vs regional)
   - Database proximity requirements
   - Cost at scale
   - Team expertise

2. **Edge vs Node.js runtime:**
   - Edge: Faster TTFB globally, limited APIs
   - Node.js: Full API access, better for heavy computation
   - Hybrid: Edge for static/cached, Node for dynamic

3. **How do you handle secrets?**
   - Never commit to git
   - Use platform-specific secret management
   - Validate at startup with schema
   - Different values per environment

4. **Database in serverless:**
   - Connection pooling is essential
   - Use managed connection pools (PgBouncer, Prisma Data Proxy)
   - Consider edge databases (Turso, Cloudflare D1)

5. **Monitoring in production:**
   - Health checks for load balancers
   - Error tracking (Sentry)
   - Performance monitoring (Web Vitals)
   - Request logging with correlation IDs
