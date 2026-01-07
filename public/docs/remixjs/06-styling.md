# Remix Styling

> "CSS is a core competency for frontend development." — Web Development Principle

Remix provides multiple approaches to styling your applications, from traditional CSS to modern CSS-in-JS solutions. The framework's route-based architecture enables intelligent CSS loading and unloading.

---

## Professional Definition

| Concept | Definition | Senior Consideration |
|---------|------------|---------------------|
| Route Styles | CSS files linked to specific routes | Loaded/unloaded with routes, no global CSS bloat |
| links Export | Define `<link>` tags per route | Enables preloading, media queries, route-scoped CSS |
| CSS Bundling | Automatic bundling with Vite | Tree-shaking, code splitting for styles |
| CSS Modules | Scoped class names via `.module.css` | No naming conflicts, component-level styles |
| Tailwind CSS | Utility-first CSS framework | Popular in Remix ecosystem, works out of box |

---

## Route-Based Stylesheets

### Basic Usage with links Export

```tsx
// app/routes/dashboard.tsx
import type { LinksFunction } from "@remix-run/node";

import dashboardStyles from "~/styles/dashboard.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: dashboardStyles },
];

export default function Dashboard() {
  return <div className="dashboard">...</div>;
}
```

### How Route Styles Work

```
URL Change: / → /dashboard → /dashboard/settings

Active Stylesheets:
/               → root.css
/dashboard      → root.css + dashboard.css
/dashboard/settings → root.css + dashboard.css + settings.css

When navigating away from /dashboard:
- dashboard.css is automatically removed
- No manual cleanup needed
```

---

## The links Export

The `links` export returns an array of link descriptors:

```tsx
import type { LinksFunction } from "@remix-run/node";

export const links: LinksFunction = () => [
  // Stylesheets
  { rel: "stylesheet", href: "/styles/global.css" },
  
  // With media queries
  { rel: "stylesheet", href: "/styles/print.css", media: "print" },
  { rel: "stylesheet", href: "/styles/dark.css", media: "(prefers-color-scheme: dark)" },
  { rel: "stylesheet", href: "/styles/large.css", media: "(min-width: 1024px)" },
  
  // Preloading
  { rel: "preload", href: "/fonts/inter.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: "/images/hero.jpg", as: "image" },
  
  // Preconnect for external resources
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  
  // Favicons
  { rel: "icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];
```

---

## Importing CSS Files

With Vite, import CSS files directly:

```tsx
// app/routes/products.tsx
import type { LinksFunction } from "@remix-run/node";

// ?url suffix gets the URL for the stylesheet
import styles from "~/styles/products.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];
```

### Global Styles in Root

```tsx
// app/root.tsx
import type { LinksFunction } from "@remix-run/node";

import globalStyles from "~/styles/global.css?url";
import tailwindStyles from "~/styles/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStyles },
  { rel: "stylesheet", href: globalStyles },
];
```

---

## CSS Modules

Scoped CSS with automatic class name generation:

```tsx
// app/components/Button/Button.tsx
import styles from "./Button.module.css";

interface ButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function Button({ variant = "primary", children }: ButtonProps) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

```css
/* app/components/Button/Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.primary:hover {
  background: #2563eb;
}

.secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.secondary:hover {
  background: #f3f4f6;
}
```

---

## Tailwind CSS Setup

### Installation

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configuration

```javascript
// tailwind.config.js
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
};
```

```css
/* app/styles/tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-primary-500 text-white px-4 py-2 rounded-md 
           hover:bg-primary-600 transition-colors;
  }
}
```

```tsx
// app/root.tsx
import type { LinksFunction } from "@remix-run/node";
import styles from "~/styles/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];
```

### Usage

```tsx
function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
      <p className="text-gray-600 mt-2">{product.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-bold text-primary-600">
          ${product.price}
        </span>
        <button className="btn-primary">Add to Cart</button>
      </div>
    </div>
  );
}
```

---

## Component Styles Pattern

Surface component styles to routes that use them:

```tsx
// app/components/Card/Card.tsx
import type { LinksFunction } from "@remix-run/node";
import styles from "./Card.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}
```

```tsx
// app/routes/products.tsx
import type { LinksFunction } from "@remix-run/node";
import { Card, links as cardLinks } from "~/components/Card/Card";
import styles from "~/styles/products.css?url";

// Surface component links
export const links: LinksFunction = () => [
  ...cardLinks(),
  { rel: "stylesheet", href: styles },
];

export default function Products() {
  return (
    <div>
      <Card>Product 1</Card>
      <Card>Product 2</Card>
    </div>
  );
}
```

---

## CSS-in-JS Options

### Vanilla Extract

```bash
npm install @vanilla-extract/css @vanilla-extract/vite-plugin
```

```typescript
// vite.config.ts
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

export default defineConfig({
  plugins: [remix(), vanillaExtractPlugin()],
});
```

```typescript
// app/components/Button/Button.css.ts
import { style, styleVariants } from "@vanilla-extract/css";

export const button = style({
  padding: "0.5rem 1rem",
  borderRadius: "4px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s",
});

export const variants = styleVariants({
  primary: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    ":hover": { background: "#2563eb" },
  },
  secondary: {
    background: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    ":hover": { background: "#f3f4f6" },
  },
});
```

```tsx
// app/components/Button/Button.tsx
import { button, variants } from "./Button.css";

export function Button({ variant = "primary", children }) {
  return (
    <button className={`${button} ${variants[variant]}`}>
      {children}
    </button>
  );
}
```

---

## Responsive Design Patterns

### Media Queries in links

```tsx
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: baseStyles },
  { rel: "stylesheet", href: mobileStyles, media: "(max-width: 639px)" },
  { rel: "stylesheet", href: tabletStyles, media: "(min-width: 640px) and (max-width: 1023px)" },
  { rel: "stylesheet", href: desktopStyles, media: "(min-width: 1024px)" },
];
```

### Container Queries

```css
/* Modern container queries */
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
    gap: 1rem;
  }
  
  .card-image {
    width: 150px;
    flex-shrink: 0;
  }
}
```

---

## Dark Mode

### CSS Variables Approach

```css
/* app/styles/global.css */
:root {
  --color-bg: #ffffff;
  --color-text: #1f2937;
  --color-primary: #3b82f6;
  --color-border: #e5e7eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111827;
    --color-text: #f9fafb;
    --color-primary: #60a5fa;
    --color-border: #374151;
  }
}

/* Usage */
body {
  background-color: var(--color-bg);
  color: var(--color-text);
}

.card {
  border: 1px solid var(--color-border);
}
```

### Theme Toggle with Sessions

```tsx
// app/utils/theme.server.ts
import { createCookieSessionStorage } from "@remix-run/node";

const themeStorage = createCookieSessionStorage({
  cookie: {
    name: "theme",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET!],
  },
});

export async function getTheme(request: Request) {
  const session = await themeStorage.getSession(request.headers.get("Cookie"));
  return session.get("theme") || "system";
}

export async function setTheme(request: Request, theme: string) {
  const session = await themeStorage.getSession(request.headers.get("Cookie"));
  session.set("theme", theme);
  return themeStorage.commitSession(session);
}
```

```tsx
// app/root.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const theme = await getTheme(request);
  return json({ theme });
}

export default function App() {
  const { theme } = useLoaderData<typeof loader>();
  
  return (
    <html lang="en" data-theme={theme}>
      <head>...</head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}
```

```css
/* Theme styles */
[data-theme="light"] {
  --color-bg: #ffffff;
  --color-text: #1f2937;
}

[data-theme="dark"] {
  --color-bg: #111827;
  --color-text: #f9fafb;
}

[data-theme="system"] {
  /* Uses prefers-color-scheme */
}
```

---

## Animation Patterns

### CSS Transitions for Route Changes

```css
/* app/styles/transitions.css */
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity 150ms;
}
```

### Loading State Animations

```tsx
import { useNavigation } from "@remix-run/react";

function PageTransition({ children }) {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  
  return (
    <div className={`page ${isLoading ? "loading" : ""}`}>
      {children}
    </div>
  );
}
```

```css
.page {
  transition: opacity 0.2s;
}

.page.loading {
  opacity: 0.7;
  pointer-events: none;
}
```

---

## Performance Best Practices

### Critical CSS

```tsx
// Inline critical styles for above-the-fold content
export const links: LinksFunction = () => [
  // Critical styles loaded first
  { rel: "stylesheet", href: criticalStyles },
  
  // Non-critical styles with preload
  { rel: "preload", href: fullStyles, as: "style" },
  { rel: "stylesheet", href: fullStyles },
];
```

### Preloading Fonts

```tsx
export const links: LinksFunction = () => [
  // Preconnect to font origin
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  
  // Preload critical fonts
  {
    rel: "preload",
    href: "/fonts/inter-var.woff2",
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  
  // Stylesheet
  { rel: "stylesheet", href: styles },
];
```

### Avoiding Flash of Unstyled Content (FOUC)

```css
/* Add to critical CSS */
.no-fouc {
  visibility: hidden;
}

.fouc-ready .no-fouc {
  visibility: visible;
}
```

```tsx
// In root, add class when hydrated
useEffect(() => {
  document.documentElement.classList.add("fouc-ready");
}, []);
```

---

## Senior Interview Focus Points

1. **How does Remix handle CSS differently?**
   - Route-based loading/unloading
   - No CSS-in-JS runtime needed
   - Native browser caching
   - Automatic code splitting

2. **links vs importing CSS:**
   ```tsx
   // links export - declarative, preloadable
   export const links = () => [{ rel: "stylesheet", href: styles }];
   
   // Direct import with ?url - same result, different syntax
   import styles from "./styles.css?url";
   ```

3. **Component styles composition:**
   - Export `links` from components
   - Surface to routes via spread: `...cardLinks()`
   - Only loads CSS when component's route is active

4. **CSS-in-JS considerations:**
   - Vanilla Extract: Zero-runtime, type-safe
   - Tailwind: Utility-first, great DX
   - CSS Modules: Scoped classes, standard tooling
   - Avoid runtime CSS-in-JS (styled-components) for SSR issues

5. **Performance optimization:**
   - Use media queries in links
   - Preload critical fonts
   - Keep styles route-scoped
   - Leverage browser caching with proper headers
