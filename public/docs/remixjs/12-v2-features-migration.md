# Remix v2 Features & Migration Guide

> "The best code is the code you don't have to write." — Remix Philosophy

Remix v2 brings significant improvements in developer experience, performance, and alignment with React best practices. This document covers v2 features, breaking changes, and migration strategies.

---

## Professional Definition

| Feature | V1 Behavior | V2 Behavior |
|---------|------------|-------------|
| Flat Routes | Nested folders | Flat file convention |
| Route Module API | CatchBoundary/ErrorBoundary | Single ErrorBoundary |
| Meta Export | Returns array | Returns MetaDescriptor[] |
| Links Export | Same | Enhanced typing |
| Fetcher Behavior | Key-based | Instance-based |
| Dev Server | @remix-run/dev | Vite |

---

## Vite Integration

Remix v2 embraces Vite as the default build tool:

### Configuration

```typescript
// vite.config.ts
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    remix({
      // Remix options
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  // Vite options
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
});
```

### Benefits of Vite

1. **Faster Dev Server**: HMR in milliseconds
2. **Smaller Bundles**: Better tree-shaking
3. **Plugin Ecosystem**: Use any Vite plugin
4. **Better DX**: Native TypeScript, JSX support

### Using Vite Plugins

```typescript
// vite.config.ts
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    remix(),
    svgr(), // Import SVGs as React components
    visualizer({ // Bundle analysis
      open: true,
      gzipSize: true,
    }),
  ],
});
```

---

## Flat Routes Convention

V2 uses a flat file structure by default:

### V1 (Nested) vs V2 (Flat)

```
// V1 Nested Structure
routes/
  posts/
    index.tsx        → /posts
    $postId.tsx      → /posts/:postId
    $postId/
      edit.tsx       → /posts/:postId/edit
      comments.tsx   → /posts/:postId/comments

// V2 Flat Structure
routes/
  posts._index.tsx           → /posts
  posts.$postId.tsx          → /posts/:postId
  posts.$postId.edit.tsx     → /posts/:postId/edit
  posts.$postId.comments.tsx → /posts/:postId/comments
```

### File Naming Conventions

| Convention | Meaning | Example |
|------------|---------|---------|
| `.` | Nesting separator | `posts.$postId.tsx` → `/posts/:postId` |
| `_` | Pathless layout | `_auth.login.tsx` → `/login` (uses `_auth.tsx` layout) |
| `_index` | Index route | `posts._index.tsx` → `/posts` |
| `$` | Dynamic segment | `$postId` → `:postId` |
| `($)` | Optional segment | `($lang)` → `/:lang?` |
| `[.]` | Escape dot in URL | `sitemap[.xml].tsx` → `/sitemap.xml` |
| `$` (splat) | Catch-all | `$.tsx` → `/*` |

### Complex Examples

```
routes/
  # Layout routes
  _app.tsx                    # Pathless layout
  _app._index.tsx             # / (with _app layout)
  _app.dashboard.tsx          # /dashboard
  _app.dashboard.settings.tsx # /dashboard/settings
  
  # Auth (separate layout)
  _auth.tsx                   # Auth layout (no URL segment)
  _auth.login.tsx             # /login
  _auth.register.tsx          # /register
  
  # Resource routes
  api.users.tsx               # /api/users
  api.users.$userId.tsx       # /api/users/:userId
  
  # File extensions in URL
  rss[.xml].tsx               # /rss.xml
  og-image.$title[.png].tsx   # /og-image/:title.png
```

---

## Unified Error Boundary

V2 consolidates `CatchBoundary` and `ErrorBoundary`:

### V1 Pattern (Deprecated)

```typescript
// V1 - Two separate boundaries
export function CatchBoundary() {
  const caught = useCatch();
  return <div>Caught: {caught.status}</div>;
}

export function ErrorBoundary({ error }) {
  return <div>Error: {error.message}</div>;
}
```

### V2 Pattern

```typescript
// V2 - Single unified ErrorBoundary
import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();
  
  // Handle thrown Response objects
  if (isRouteErrorResponse(error)) {
    return (
      <div className="error-container">
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data?.message || "Something went wrong"}</p>
      </div>
    );
  }
  
  // Handle thrown Error objects
  if (error instanceof Error) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === "development" && (
          <pre>{error.stack}</pre>
        )}
      </div>
    );
  }
  
  // Handle unknown errors
  return (
    <div className="error-container">
      <h1>Unknown Error</h1>
      <p>Something unexpected happened</p>
    </div>
  );
}
```

---

## Meta Function V2

V2 uses a more powerful meta export:

### V1 Meta (Deprecated)

```typescript
// V1
export const meta: MetaFunction = () => {
  return {
    title: "My Page",
    description: "Page description",
  };
};
```

### V2 Meta

```typescript
// V2 - Returns array of meta descriptors
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = ({ data, params, matches }) => {
  return [
    { title: "My Page" },
    { name: "description", content: "Page description" },
    { property: "og:title", content: "My Page" },
    { property: "og:type", content: "website" },
  ];
};
```

### Meta with Loader Data

```typescript
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "Not Found" }];
  }
  
  return [
    { title: data.post.title },
    { name: "description", content: data.post.excerpt },
    { property: "og:title", content: data.post.title },
    { property: "og:image", content: data.post.image },
  ];
};
```

### Merging Parent Meta

```typescript
// V2 merges are explicit
export const meta: MetaFunction = ({ matches }) => {
  // Get parent meta
  const parentMeta = matches
    .flatMap(match => match.meta ?? [])
    .filter(meta => !("title" in meta)); // Filter out parent title
  
  return [
    ...parentMeta,
    { title: "Child Page Title" },
  ];
};
```

---

## Fetcher Improvements

### V2 Fetcher Identity

```typescript
// V2 - Fetchers are tracked by instance, not key
function TodoItem({ todo }) {
  // Each component instance has its own fetcher
  const fetcher = useFetcher();
  
  // No need for unique keys
  return (
    <fetcher.Form method="post">
      {/* ... */}
    </fetcher.Form>
  );
}
```

### Fetcher with Key (When Needed)

```typescript
// Use key when you need to access same fetcher from different components
function TodoActions({ todoId }) {
  const fetcher = useFetcher({ key: `todo-${todoId}` });
  
  return (
    <fetcher.Form method="post">
      <input type="hidden" name="todoId" value={todoId} />
      <button type="submit">Complete</button>
    </fetcher.Form>
  );
}

// Access same fetcher elsewhere
function TodoStatus({ todoId }) {
  const fetchers = useFetchers();
  const fetcher = fetchers.find(f => f.key === `todo-${todoId}`);
  
  if (fetcher?.state === "submitting") {
    return <span>Updating...</span>;
  }
  
  return null;
}
```

---

## Future Flags

Enable v3 behaviors incrementally:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    remix({
      future: {
        // Enable v3 behaviors
        v3_fetcherPersist: true,      // Fetchers persist after navigation
        v3_relativeSplatPath: true,   // Relative paths in splat routes
        v3_throwAbortReason: true,    // Throw AbortError on abort
        v3_singleFetch: true,         // Single fetch for all loaders
        v3_lazyRouteDiscovery: true,  // Lazy load route manifest
      },
    }),
  ],
});
```

### v3_singleFetch

Combines all loader requests into a single HTTP request:

```typescript
// Without singleFetch (multiple requests)
GET /api/_data?route=root
GET /api/_data?route=routes/dashboard
GET /api/_data?route=routes/dashboard.settings

// With singleFetch (single request)
GET /dashboard/settings?_data=routes/root,routes/dashboard,routes/dashboard.settings
```

```typescript
// Enable in config
future: {
  v3_singleFetch: true,
}

// Return type changes
export function loader() {
  // Can now return any serializable value, not just Response
  return {
    user: { name: "John" },
    timestamp: new Date(), // Dates are serialized properly
  };
}
```

---

## Migration Guide

### Step 1: Update Dependencies

```bash
# Update to v2
npm install @remix-run/node@latest @remix-run/react@latest
npm install @remix-run/dev@latest -D

# Add Vite
npm install vite @vitejs/plugin-react -D
npm install vite-tsconfig-paths -D
```

### Step 2: Create Vite Config

```typescript
// vite.config.ts
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [remix(), tsconfigPaths()],
});
```

### Step 3: Update Scripts

```json
// package.json
{
  "scripts": {
    "dev": "remix vite:dev",
    "build": "remix vite:build",
    "start": "remix-serve ./build/server/index.js"
  }
}
```

### Step 4: Migrate Route Files

```bash
# Use migration script
npx @remix-run/dev routes:migrate
```

Or manually rename:

```
# Before (v1)
routes/posts/index.tsx
routes/posts/$postId.tsx

# After (v2)
routes/posts._index.tsx
routes/posts.$postId.tsx
```

### Step 5: Update ErrorBoundary

```typescript
// Before (v1)
export function CatchBoundary() {
  const caught = useCatch();
  // ...
}

export function ErrorBoundary({ error }: { error: Error }) {
  // ...
}

// After (v2)
import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    // Handle Response errors (was CatchBoundary)
  }
  
  if (error instanceof Error) {
    // Handle Error (was ErrorBoundary)
  }
}
```

### Step 6: Update Meta Export

```typescript
// Before (v1)
export const meta: MetaFunction = () => ({
  title: "Page Title",
  description: "Description",
});

// After (v2)
export const meta: MetaFunction = () => [
  { title: "Page Title" },
  { name: "description", content: "Description" },
];
```

---

## Breaking Changes Summary

| Feature | V1 | V2 | Migration |
|---------|----|----|-----------|
| Build Tool | esbuild | Vite | Create vite.config.ts |
| Routes | Nested folders | Flat files | Rename with dots |
| CatchBoundary | Separate export | Merged into ErrorBoundary | Use isRouteErrorResponse |
| meta | Returns object | Returns array | Change to array format |
| headers | Per-route | Per-route (unchanged) | N/A |
| links | Per-route | Per-route (unchanged) | N/A |
| useCatch | Available | Removed | Use useRouteError |
| useLoaderData | Generic inference | Same but stricter | Add types |

---

## New Features in Detail

### Lazy Route Discovery

```typescript
future: {
  v3_lazyRouteDiscovery: true,
}
```

- Route manifest isn't downloaded upfront
- Routes discovered as user navigates
- Significantly smaller initial JS payload

### Client Data

```typescript
// app/routes/dashboard.tsx
export async function clientLoader({ serverLoader }) {
  // Check cache first
  const cached = sessionStorage.getItem("dashboard-data");
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Otherwise fetch from server
  const data = await serverLoader();
  sessionStorage.setItem("dashboard-data", JSON.stringify(data));
  return data;
}

export async function clientAction({ serverAction }) {
  // Optimistic update
  const result = await serverAction();
  // Clear cache
  sessionStorage.removeItem("dashboard-data");
  return result;
}
```

### HydrateFallback

```typescript
// Show while client modules load
export function HydrateFallback() {
  return (
    <div className="loading">
      <Skeleton />
    </div>
  );
}
```

---

## Senior Interview Focus Points

1. **Why did Remix switch to Vite?**
   - Faster dev server (native ESM)
   - Better HMR (module-level, not file-level)
   - Huge plugin ecosystem
   - Standard tooling (not proprietary)

2. **Explain the flat routes convention:**
   - Dots (`.`) represent URL nesting
   - Underscores (`_`) create pathless layouts
   - Makes route hierarchy visible at a glance
   - Reduces folder nesting complexity

3. **Why merge CatchBoundary and ErrorBoundary?**
   - Simpler mental model
   - `isRouteErrorResponse` handles both cases
   - Aligns with React's error boundary concept
   - Reduces boilerplate

4. **What's the benefit of single fetch?**
   - One HTTP request instead of many
   - Reduces latency overhead
   - Better for HTTP/1.1 (no multiplexing)
   - Simplifies caching strategies

5. **Migration strategy for large apps:**
   - Enable future flags incrementally
   - Migrate routes in batches
   - Run both v1 and v2 patterns temporarily
   - Use codemods where available
   - Comprehensive testing at each step
