# Remix Routing & Loaders

> "The URL is the API." — Remix Philosophy

Remix uses file-based routing with a powerful nested routing system inherited from React Router. Every route can load its own data, handle its own errors, and render independently while sharing layouts with parent routes.

---

## Professional Definition

| Concept | Definition | Senior Consideration |
|---------|------------|---------------------|
| File-based Routing | Files in `app/routes/` automatically become routes | Naming conventions encode complex routing patterns |
| Nested Routes | Child routes render inside parent routes' `<Outlet>` | Enables parallel data loading and isolated error boundaries |
| Loaders | Server functions that fetch data for routes | Runs on every request (GET), cached via HTTP headers |
| Route Params | Dynamic segments extracted from URL | Type-safe with proper TypeScript patterns |
| Search Params | Query string parameters | Not reactive by default, must be parsed from request |

---

## Route File Naming Convention

Remix uses dots (`.`) and folders to define route hierarchy:

| File | URL | Description |
|------|-----|-------------|
| `app/routes/_index.tsx` | `/` | Index route (home) |
| `app/routes/about.tsx` | `/about` | Static route |
| `app/routes/blog.tsx` | `/blog` | Parent layout route |
| `app/routes/blog._index.tsx` | `/blog` | Blog index (inside layout) |
| `app/routes/blog.$slug.tsx` | `/blog/:slug` | Dynamic segment |
| `app/routes/blog.$slug_.edit.tsx` | `/blog/:slug/edit` | Trailing underscore escapes nesting |
| `app/routes/files.$.tsx` | `/files/*` | Splat/catch-all route |
| `app/routes/_auth.tsx` | N/A | Pathless layout (groups routes) |
| `app/routes/_auth.login.tsx` | `/login` | Uses _auth layout, no /auth in URL |
| `app/routes/($lang).products.tsx` | `/products` or `/en/products` | Optional segment |
| `app/routes/api.webhook[.json].tsx` | `/api/webhook.json` | Escaped dots in URL |

### Visual Guide to Route Nesting

```
URL: /dashboard/settings/profile

Routes loaded:
├── root.tsx                    (always loads)
├── routes/dashboard.tsx        (layout)
├── routes/dashboard.settings.tsx   (layout)
└── routes/dashboard.settings.profile.tsx  (page)

Each route's <Outlet> renders the next child.
```

---

## Loader Function Deep Dive

Loaders run on the server to fetch data before rendering:

```tsx
// app/routes/products.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";

// This function runs on the server
export async function loader({ request, params, context }: LoaderFunctionArgs) {
  // Access request info
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = 20;
  
  // Direct database access - this code never reaches the browser
  const products = await db.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  
  const total = await db.product.count();
  
  // json() creates a Response with proper headers
  return json({
    products,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// Component receives loader data via hook
export default function ProductsPage() {
  // TypeScript infers the type from loader return
  const { products, pagination } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
      <Pagination {...pagination} />
    </div>
  );
}
```

---

## Loader Arguments

### `request` - The Fetch Request

```tsx
export async function loader({ request }: LoaderFunctionArgs) {
  // URL and search params
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("q");
  const sortBy = url.searchParams.get("sort") ?? "date";
  
  // Headers
  const authHeader = request.headers.get("Authorization");
  const cookie = request.headers.get("Cookie");
  const acceptLanguage = request.headers.get("Accept-Language");
  
  // Request method (always GET for loaders)
  console.log(request.method); // "GET"
  
  return json({ /* data */ });
}
```

### `params` - Route Parameters

```tsx
// File: app/routes/users.$userId.posts.$postId.tsx
// URL: /users/123/posts/456

export async function loader({ params }: LoaderFunctionArgs) {
  // params are strings from the URL
  const userId = params.userId;  // "123"
  const postId = params.postId;  // "456"
  
  // Always validate and parse params
  const userIdNum = parseInt(userId);
  if (isNaN(userIdNum)) {
    throw new Response("Invalid user ID", { status: 400 });
  }
  
  const user = await getUser(userIdNum);
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  
  return json({ user });
}
```

### `context` - Server Context

```tsx
// Context is passed from your server adapter
// Useful for platform-specific data (Cloudflare bindings, Express req, etc.)

export async function loader({ context }: LoaderFunctionArgs) {
  // In Cloudflare Workers:
  const env = context.cloudflare.env;
  const kv = env.MY_KV_NAMESPACE;
  
  // In Express with custom context:
  const expressUser = context.user;
  
  return json({ /* data */ });
}

// server.ts (Express example)
app.all("*", createRequestHandler({
  build,
  getLoadContext(req) {
    return { user: req.user }; // This becomes context
  },
}));
```

---

## Type-Safe Loaders with TypeScript

```tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Define your data shape
interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

interface LoaderData {
  products: Product[];
  featured: Product | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const products = await fetchProducts();
  const featured = await getFeaturedProduct();
  
  // Type the return explicitly for complex cases
  return json<LoaderData>({
    products,
    featured,
  });
}

export default function ProductsPage() {
  // useLoaderData infers the type from loader
  const data = useLoaderData<typeof loader>();
  // data.products is Product[]
  // data.featured is Product | null (serialized)
  
  return <ProductList products={data.products} />;
}
```

### Understanding Serialization

```tsx
export async function loader() {
  return json({
    date: new Date(),        // Becomes string after serialization
    map: new Map(),          // Becomes {} (empty object)
    set: new Set([1, 2, 3]), // Becomes {}
    bigint: 123n,            // Error! BigInt can't be serialized
    function: () => {},      // Stripped out
    undefined: undefined,    // Stripped out
    symbol: Symbol("x"),     // Stripped out
  });
}

// Solution for Date objects:
export default function Page() {
  const { date } = useLoaderData<typeof loader>();
  // date is string, parse it
  const dateObj = new Date(date);
}
```

---

## Throwing Responses in Loaders

Use `throw` to exit early with proper HTTP responses:

```tsx
import { json, redirect } from "@remix-run/node";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Check authentication
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    // Redirect to login
    throw redirect("/login");
  }
  
  const userId = session.get("userId");
  const user = await getUser(userId);
  
  // 404 for missing resources
  const post = await getPost(params.postId);
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  
  // 403 for forbidden access
  if (post.authorId !== userId && !user.isAdmin) {
    throw json(
      { error: "You don't have permission to view this post" },
      { status: 403 }
    );
  }
  
  // 400 for bad requests
  if (!params.postId || isNaN(parseInt(params.postId))) {
    throw new Response("Invalid post ID", { status: 400 });
  }
  
  return json({ post, user });
}
```

---

## Nested Routes & Outlets

Parent routes render children via `<Outlet>`:

```tsx
// app/routes/dashboard.tsx (Parent Layout)
import { Outlet, NavLink } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  // This data is available to all child routes
  const user = await requireUser(request);
  return json({ user });
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Welcome, {user.name}</h2>
        <nav>
          <NavLink to="/dashboard" end>Overview</NavLink>
          <NavLink to="/dashboard/analytics">Analytics</NavLink>
          <NavLink to="/dashboard/settings">Settings</NavLink>
        </nav>
      </aside>
      
      <main className="content">
        {/* Child routes render here */}
        <Outlet />
      </main>
    </div>
  );
}
```

```tsx
// app/routes/dashboard._index.tsx (Dashboard home)
export default function DashboardHome() {
  return <h1>Dashboard Overview</h1>;
}

// app/routes/dashboard.analytics.tsx
export async function loader() {
  const stats = await getAnalytics();
  return json({ stats });
}

export default function Analytics() {
  const { stats } = useLoaderData<typeof loader>();
  return <AnalyticsChart data={stats} />;
}
```

---

## Pathless Layout Routes

Group routes under a shared layout without affecting the URL:

```tsx
// app/routes/_auth.tsx
// This creates a layout for auth pages without /auth in URL

export default function AuthLayout() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <Logo />
        <Outlet />
      </div>
      <footer>© 2025 Company</footer>
    </div>
  );
}

// app/routes/_auth.login.tsx → /login
// app/routes/_auth.register.tsx → /register
// app/routes/_auth.forgot-password.tsx → /forgot-password
```

---

## Parallel Data Loading

Nested routes load data in parallel, not sequentially:

```
URL: /dashboard/users/123

Loading happens simultaneously:
┌────────────────────────────────────────┐
│ root.tsx loader ─────────────────►     │
│ dashboard.tsx loader ──────────►       │
│ dashboard.users.tsx loader ────►       │
│ dashboard.users.$id.tsx loader ►       │
└────────────────────────────────────────┘
         Time ──────────────────────────►

Total time = max(loader times), not sum(loader times)
```

---

## Accessing Parent Loader Data

Use `useRouteLoaderData` to access parent route data:

```tsx
// app/routes/dashboard.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  return json({ user });
}

// app/routes/dashboard.settings.tsx
import { useRouteLoaderData } from "@remix-run/react";

export default function Settings() {
  // Access parent loader data by route ID
  const dashboardData = useRouteLoaderData<typeof dashboardLoader>(
    "routes/dashboard"
  );
  
  return (
    <div>
      <h1>Settings for {dashboardData?.user.name}</h1>
    </div>
  );
}
```

---

## Revalidation & shouldRevalidate

Control when loaders refetch:

```tsx
import type { ShouldRevalidateFunction } from "@remix-run/react";

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) => {
  // Don't revalidate if only search params changed
  if (currentUrl.pathname === nextUrl.pathname) {
    return false;
  }
  
  // Don't revalidate after GET form submissions
  if (formMethod === "GET") {
    return false;
  }
  
  // Use default behavior otherwise
  return defaultShouldRevalidate;
};

export async function loader() {
  // This loader won't refetch unnecessarily
  return json({ data: await expensiveFetch() });
}
```

---

## Resource Routes

Routes without a default export are "resource routes" - they return raw responses:

```tsx
// app/routes/api.products.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const products = await getProducts();
  
  // Return JSON for API consumers
  return json(products);
}

// app/routes/reports.$id[.pdf].tsx
export async function loader({ params }: LoaderFunctionArgs) {
  const report = await getReport(params.id);
  const pdf = await generatePDF(report);
  
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${params.id}.pdf"`,
    },
  });
}

// app/routes/sitemap[.xml].tsx
export async function loader() {
  const pages = await getAllPages();
  const sitemap = generateSitemap(pages);
  
  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
```

---

## Splat Routes (Catch-All)

Handle any remaining path segments:

```tsx
// app/routes/files.$.tsx
// Matches: /files/docs/2024/report.pdf

export async function loader({ params }: LoaderFunctionArgs) {
  // The "*" param contains the rest of the path
  const filePath = params["*"]; // "docs/2024/report.pdf"
  
  const file = await getFile(filePath);
  if (!file) {
    throw new Response("File not found", { status: 404 });
  }
  
  return new Response(file.content, {
    headers: {
      "Content-Type": file.mimeType,
    },
  });
}
```

---

## Senior Interview Focus Points

1. **Explain the loader execution model:**
   - Loaders run in parallel for nested routes
   - They run on the server only
   - Data is serialized via JSON
   - Thrown responses become error boundaries

2. **How do you handle authentication in loaders?**
   ```tsx
   // Create a reusable utility
   async function requireUser(request: Request) {
     const session = await getSession(request.headers.get("Cookie"));
     const userId = session.get("userId");
     if (!userId) throw redirect("/login");
     return getUser(userId);
   }
   
   export async function loader({ request }: LoaderFunctionArgs) {
     const user = await requireUser(request);
     return json({ user });
   }
   ```

3. **What's the difference between throwing and returning?**
   - `throw redirect()` - Exits loader immediately, triggers redirect
   - `return redirect()` - Same effect, but clearer intent
   - `throw new Response(null, { status: 404 })` - Triggers ErrorBoundary
   - `return json({ error: "..." })` - Component must handle the error case

4. **How do you optimize loader performance?**
   - Use `defer()` for non-critical data
   - Implement proper caching headers
   - Use database indexes
   - Parallelize independent queries
   - Consider edge deployment
