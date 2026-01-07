# Advanced Remix Patterns & Senior Interview Topics

> "Simplicity is the ultimate sophistication." — Leonardo da Vinci

This document covers advanced patterns, architectural decisions, and topics senior engineers should master for Remix applications.

---

## Professional Definition

| Pattern | Definition | Use Case |
|---------|------------|----------|
| Resource Routes | Routes that return non-HTML responses | APIs, downloads, images |
| Pathless Routes | Routes that add layout without affecting URL | Shared UI sections |
| Outlet Context | Passing data through nested route hierarchy | Shared state in layouts |
| Optimistic UI | Updating UI before server confirms | Better perceived performance |
| Compound Components | Components that work together | Form builders, wizards |

---

## Advanced Routing Patterns

### Route Groups (Pathless Layouts)

Create shared layouts without affecting URLs:

```
routes/
  _auth.tsx           # Layout for auth pages (no URL segment)
  _auth.login.tsx     # /login
  _auth.register.tsx  # /register
  
  _dashboard.tsx      # Dashboard layout
  _dashboard.tsx      # /
  _dashboard.settings.tsx  # /settings
  _dashboard.profile.tsx   # /profile
```

```typescript
// app/routes/_auth.tsx
export default function AuthLayout() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <Logo />
        <Outlet />
      </div>
    </div>
  );
}

// app/routes/_auth.login.tsx
export default function Login() {
  return (
    <Form method="post">
      <h1>Login</h1>
      {/* Form fields */}
    </Form>
  );
}
```

### Dynamic Segments with Constraints

```typescript
// app/routes/posts.$postId.tsx
// Validate postId format in loader
export async function loader({ params }: LoaderFunctionArgs) {
  const { postId } = params;
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(postId)) {
    throw new Response("Invalid post ID", { status: 400 });
  }
  
  const post = await getPost(postId);
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  
  return json({ post });
}
```

### Optional Segments

```typescript
// app/routes/products.($category).tsx
// Matches: /products, /products/electronics, /products/clothing
export async function loader({ params }: LoaderFunctionArgs) {
  const { category } = params; // undefined or string
  
  const products = category
    ? await getProductsByCategory(category)
    : await getAllProducts();
  
  return json({ products, category });
}
```

### Splat Routes

```typescript
// app/routes/docs.$.tsx
// Matches: /docs, /docs/intro, /docs/api/users/create
export async function loader({ params }: LoaderFunctionArgs) {
  const path = params["*"] || "index"; // "api/users/create"
  
  const doc = await getDocumentation(path);
  if (!doc) {
    throw new Response("Document not found", { status: 404 });
  }
  
  return json({ doc, path });
}
```

---

## Resource Routes

Routes that return non-HTML responses:

### API Endpoint

```typescript
// app/routes/api.users.ts
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q");
  
  const users = await searchUsers(search);
  
  return json(users, {
    headers: {
      "Cache-Control": "private, max-age=60",
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  const data = await request.json();
  const user = await createUser(data);
  
  return json(user, { status: 201 });
}
```

### File Download

```typescript
// app/routes/files.$fileId[.pdf].ts
export async function loader({ params }: LoaderFunctionArgs) {
  const file = await getFile(params.fileId);
  
  if (!file) {
    throw new Response("File not found", { status: 404 });
  }
  
  return new Response(file.content, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.name}.pdf"`,
    },
  });
}
```

### Dynamic Image Generation

```typescript
// app/routes/og-image.$title[.png].tsx
import { ImageResponse } from "@vercel/og";

export async function loader({ params }: LoaderFunctionArgs) {
  const title = decodeURIComponent(params.title || "Default Title");
  
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        {title}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### RSS Feed

```typescript
// app/routes/rss[.xml].ts
export async function loader() {
  const posts = await getRecentPosts(20);
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>https://example.com</link>
    <description>Latest posts</description>
    ${posts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>https://example.com/posts/${post.slug}</link>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
    </item>
    `).join("")}
  </channel>
</rss>`;
  
  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
```

### Sitemap

```typescript
// app/routes/sitemap[.xml].ts
export async function loader() {
  const pages = await getAllPages();
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>https://example.com${page.path}</loc>
    <lastmod>${page.updatedAt}</lastmod>
    <changefreq>${page.changeFreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  `).join("")}
</urlset>`;
  
  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
```

---

## Outlet Context

Pass data through nested routes without prop drilling:

```typescript
// app/routes/dashboard.tsx
import { Outlet, useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const permissions = await getUserPermissions(user.id);
  
  return json({ user, permissions });
}

export default function Dashboard() {
  const { user, permissions } = useLoaderData<typeof loader>();
  
  return (
    <div className="dashboard">
      <Sidebar user={user} />
      <main>
        {/* Pass context to all nested routes */}
        <Outlet context={{ user, permissions }} />
      </main>
    </div>
  );
}

// Type the context
export type DashboardContext = {
  user: User;
  permissions: string[];
};
```

```typescript
// app/routes/dashboard.settings.tsx
import { useOutletContext } from "@remix-run/react";
import type { DashboardContext } from "./dashboard";

export default function Settings() {
  const { user, permissions } = useOutletContext<DashboardContext>();
  
  const canEditSettings = permissions.includes("settings:edit");
  
  return (
    <div>
      <h1>Settings for {user.name}</h1>
      {canEditSettings ? (
        <SettingsForm user={user} />
      ) : (
        <p>You don't have permission to edit settings</p>
      )}
    </div>
  );
}
```

---

## Form Patterns

### Multi-Step Forms

```typescript
// app/routes/onboarding.tsx
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const savedData = session.get("onboarding") || {};
  
  return json({ savedData });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const formData = await request.formData();
  const step = formData.get("step");
  
  // Merge new data with saved data
  const savedData = session.get("onboarding") || {};
  const stepData = Object.fromEntries(formData.entries());
  const newData = { ...savedData, ...stepData };
  
  session.set("onboarding", newData);
  
  if (step === "3") {
    // Final step - complete onboarding
    await completeOnboarding(newData);
    session.unset("onboarding");
    return redirect("/dashboard", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
  
  // Move to next step
  const nextStep = parseInt(step as string) + 1;
  return redirect(`/onboarding?step=${nextStep}`, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function Onboarding() {
  const { savedData } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const step = parseInt(searchParams.get("step") || "1");
  
  return (
    <div>
      <ProgressIndicator currentStep={step} totalSteps={3} />
      
      <Form method="post">
        <input type="hidden" name="step" value={step} />
        
        {step === 1 && <PersonalInfoStep data={savedData} />}
        {step === 2 && <PreferencesStep data={savedData} />}
        {step === 3 && <ConfirmationStep data={savedData} />}
        
        <div className="buttons">
          {step > 1 && (
            <Link to={`?step=${step - 1}`}>Back</Link>
          )}
          <button type="submit">
            {step === 3 ? "Complete" : "Next"}
          </button>
        </div>
      </Form>
    </div>
  );
}
```

### Multiple Forms on One Page

```typescript
// app/routes/settings.tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  switch (intent) {
    case "updateProfile":
      return updateProfile(formData);
    case "changePassword":
      return changePassword(formData);
    case "updateNotifications":
      return updateNotifications(formData);
    default:
      return json({ error: "Invalid intent" }, { status: 400 });
  }
}

export default function Settings() {
  return (
    <div>
      <section>
        <h2>Profile</h2>
        <Form method="post">
          <input type="hidden" name="intent" value="updateProfile" />
          {/* Profile fields */}
          <button type="submit">Update Profile</button>
        </Form>
      </section>
      
      <section>
        <h2>Password</h2>
        <Form method="post">
          <input type="hidden" name="intent" value="changePassword" />
          {/* Password fields */}
          <button type="submit">Change Password</button>
        </Form>
      </section>
      
      <section>
        <h2>Notifications</h2>
        <Form method="post">
          <input type="hidden" name="intent" value="updateNotifications" />
          {/* Notification settings */}
          <button type="submit">Save Preferences</button>
        </Form>
      </section>
    </div>
  );
}
```

---

## useFetcher Patterns

### Parallel Fetchers

```typescript
// Loading multiple independent resources
export default function Dashboard() {
  const statsFetcher = useFetcher();
  const chartFetcher = useFetcher();
  const activityFetcher = useFetcher();
  
  useEffect(() => {
    statsFetcher.load("/api/stats");
    chartFetcher.load("/api/chart-data");
    activityFetcher.load("/api/activity");
  }, []);
  
  return (
    <div>
      {statsFetcher.state === "loading" ? (
        <StatsSkeleton />
      ) : (
        <StatsCard data={statsFetcher.data} />
      )}
      
      {chartFetcher.state === "loading" ? (
        <ChartSkeleton />
      ) : (
        <Chart data={chartFetcher.data} />
      )}
      
      {activityFetcher.state === "loading" ? (
        <ActivitySkeleton />
      ) : (
        <ActivityFeed data={activityFetcher.data} />
      )}
    </div>
  );
}
```

### Fetcher as Component State Manager

```typescript
// Inline editing with fetcher
function EditableTitle({ post }: { post: Post }) {
  const fetcher = useFetcher();
  const [isEditing, setIsEditing] = useState(false);
  
  const isUpdating = fetcher.state !== "idle";
  const optimisticTitle = fetcher.formData?.get("title") as string | undefined;
  const displayTitle = optimisticTitle ?? post.title;
  
  if (isEditing) {
    return (
      <fetcher.Form 
        method="post" 
        action={`/posts/${post.id}`}
        onSubmit={() => setIsEditing(false)}
      >
        <input 
          name="title" 
          defaultValue={post.title}
          autoFocus
        />
        <button type="submit" disabled={isUpdating}>
          Save
        </button>
        <button type="button" onClick={() => setIsEditing(false)}>
          Cancel
        </button>
      </fetcher.Form>
    );
  }
  
  return (
    <h1 onClick={() => setIsEditing(true)}>
      {displayTitle}
      {isUpdating && <Spinner />}
    </h1>
  );
}
```

### List with Individual Item Fetchers

```typescript
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const fetcher = useFetcher();
  
  // Optimistic state
  const isCompleting = fetcher.formData?.get("intent") === "complete";
  const isDeleting = fetcher.formData?.get("intent") === "delete";
  const isOptimisticallyComplete = isCompleting || todo.completed;
  
  // Hide immediately on delete
  if (isDeleting) return null;
  
  return (
    <li className={isOptimisticallyComplete ? "completed" : ""}>
      <span>{todo.title}</span>
      
      <fetcher.Form method="post" action={`/todos/${todo.id}`}>
        <input type="hidden" name="intent" value="complete" />
        <button type="submit" disabled={todo.completed}>
          ✓
        </button>
      </fetcher.Form>
      
      <fetcher.Form method="post" action={`/todos/${todo.id}`}>
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">×</button>
      </fetcher.Form>
    </li>
  );
}
```

---

## Error Handling Patterns

### Typed Error Responses

```typescript
// app/utils/errors.server.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "UNKNOWN_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
  
  toResponse() {
    return json(
      { error: { message: this.message, code: this.code } },
      { status: this.statusCode }
    );
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: Record<string, string>
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
  
  toResponse() {
    return json(
      { error: { message: this.message, code: this.code, errors: this.errors } },
      { status: 400 }
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}
```

### Error Handler Wrapper

```typescript
// app/utils/handlers.server.ts
type LoaderHandler = (args: LoaderFunctionArgs) => Promise<Response>;

export function withErrorHandler(handler: LoaderHandler): LoaderHandler {
  return async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof Response) {
        throw error; // Re-throw responses (redirects, etc.)
      }
      
      if (error instanceof AppError) {
        throw error.toResponse();
      }
      
      console.error("Unexpected error:", error);
      throw new Response("Internal Server Error", { status: 500 });
    }
  };
}

// Usage
export const loader = withErrorHandler(async ({ params }) => {
  const post = await getPost(params.id);
  
  if (!post) {
    throw new NotFoundError("Post");
  }
  
  return json({ post });
});
```

---

## State Management

### URL as State

```typescript
// app/routes/products.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Read all filter state from URL
  const filters = {
    search: url.searchParams.get("q") || "",
    category: url.searchParams.get("category") || "all",
    minPrice: parseInt(url.searchParams.get("minPrice") || "0"),
    maxPrice: parseInt(url.searchParams.get("maxPrice") || "10000"),
    sortBy: url.searchParams.get("sort") || "newest",
    page: parseInt(url.searchParams.get("page") || "1"),
  };
  
  const products = await getProducts(filters);
  
  return json({ products, filters });
}

export default function Products() {
  const { products, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  function updateFilter(key: string, value: string) {
    setSearchParams(prev => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.set("page", "1"); // Reset to page 1 on filter change
      return prev;
    });
  }
  
  return (
    <div>
      <Filters filters={filters} onChange={updateFilter} />
      <ProductGrid products={products} />
      <Pagination 
        currentPage={filters.page}
        onPageChange={(p) => updateFilter("page", String(p))}
      />
    </div>
  );
}
```

### Combining URL State with Form

```typescript
// Filters as Form that updates URL
function Filters({ filters }: { filters: FilterState }) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSearching = navigation.location?.search !== undefined;
  
  return (
    <Form
      method="get"
      onChange={(e) => submit(e.currentTarget)}
    >
      <input
        type="search"
        name="q"
        defaultValue={filters.search}
        placeholder="Search..."
      />
      
      <select name="category" defaultValue={filters.category}>
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      
      <input
        type="number"
        name="minPrice"
        defaultValue={filters.minPrice}
        placeholder="Min price"
      />
      
      {isSearching && <Spinner />}
    </Form>
  );
}
```

---

## Architecture Patterns

### Feature-Based Organization

```
app/
  features/
    auth/
      routes/
        login.tsx
        register.tsx
        logout.tsx
      components/
        LoginForm.tsx
        AuthProvider.tsx
      utils/
        auth.server.ts
        session.server.ts
    posts/
      routes/
        posts._index.tsx
        posts.$postId.tsx
        posts.new.tsx
      components/
        PostCard.tsx
        PostForm.tsx
      utils/
        posts.server.ts
  routes/
    _index.tsx  # Re-export from features
  utils/
    db.server.ts
```

### Repository Pattern

```typescript
// app/repositories/posts.server.ts
import { prisma } from "~/utils/db.server";

export interface PostRepository {
  findAll(options?: FindOptions): Promise<Post[]>;
  findById(id: string): Promise<Post | null>;
  create(data: CreatePostData): Promise<Post>;
  update(id: string, data: UpdatePostData): Promise<Post>;
  delete(id: string): Promise<void>;
}

export const postRepository: PostRepository = {
  async findAll({ search, limit = 20, offset = 0 } = {}) {
    return prisma.post.findMany({
      where: search ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      } : undefined,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });
  },
  
  async findById(id) {
    return prisma.post.findUnique({ where: { id } });
  },
  
  async create(data) {
    return prisma.post.create({ data });
  },
  
  async update(id, data) {
    return prisma.post.update({ where: { id }, data });
  },
  
  async delete(id) {
    await prisma.post.delete({ where: { id } });
  },
};
```

---

## Senior Interview Focus Points

1. **When to use loader vs action vs resource route?**
   - Loader: GET data for rendering
   - Action: Handle form submissions (mutations)
   - Resource: Non-HTML responses (API, files, feeds)

2. **How do you handle complex form state?**
   - Multi-step: Session storage + URL params
   - Validation: Server-side with zod, return errors
   - Optimistic: useFetcher with formData

3. **What's the trade-off of Outlet context vs loader data?**
   - Context: Avoids re-fetching, but tightly couples routes
   - Loader: Independent, but may duplicate fetches
   - Use context for user/permissions, loaders for page data

4. **How do you architect a large Remix app?**
   - Feature-based folders
   - Repository pattern for data access
   - Shared utilities in utils/
   - Type-safe with end-to-end TypeScript

5. **Explain the mental model of Remix data flow:**
   ```
   URL Change → Match Routes → Run Loaders (parallel)
            ↓
   Render with Data → User Interaction
            ↓
   Form Submit → Run Action → Revalidate Loaders
            ↓
   Re-render with Fresh Data
   ```

6. **How do you debug revalidation issues?**
   - Check shouldRevalidate if used
   - Verify action returns properly
   - Look for errors in Network tab
   - Check if loaders depend on changed data
