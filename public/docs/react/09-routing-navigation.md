# React Router & Navigation Patterns

> "The best code is the code that doesn't need to be explained." — Martin Fowler

Routing is the backbone of any React application. Understanding React Router deeply—from basic navigation to advanced patterns like protected routes, lazy loading, and data fetching—is essential for building production applications.

---

## React Router v6+ Overview

React Router v6 brought significant changes with a more declarative API and better TypeScript support:

| Feature | v5 | v6+ |
|---------|----|----|
| Route matching | Exclusive (first match) | Inclusive (best match) |
| Nested routes | Render props | Outlet component |
| Route config | `<Switch>` | `<Routes>` |
| Redirects | `<Redirect>` | `<Navigate>` |
| Hooks | Limited | Full hooks API |
| Data fetching | External | Built-in loaders/actions |

---

## Basic Setup

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:userId" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Router Types

| Router | Use Case |
|--------|----------|
| `BrowserRouter` | Standard web apps (uses HTML5 History API) |
| `HashRouter` | Legacy browsers or static hosting without server config |
| `MemoryRouter` | Testing, React Native, non-browser environments |
| `StaticRouter` | Server-side rendering |

---

## Essential Hooks

### useNavigate - Programmatic Navigation

```tsx
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const success = await login(formData);

    if (success) {
      // Navigate to dashboard after login
      navigate("/dashboard");

      // Replace current history entry (can't go back)
      navigate("/dashboard", { replace: true });

      // Pass state to destination
      navigate("/dashboard", { state: { from: "/login" } });

      // Go back
      navigate(-1);

      // Go forward
      navigate(1);
    }
  }

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### useParams - URL Parameters

```tsx
import { useParams } from "react-router-dom";

// Route: /users/:userId/posts/:postId
function PostDetail() {
  const { userId, postId } = useParams<{
    userId: string;
    postId: string;
  }>();

  // Both params are strings - parse if needed
  const userIdNum = Number(userId);
  const postIdNum = Number(postId);

  return (
    <div>
      User: {userId}, Post: {postId}
    </div>
  );
}
```

### useSearchParams - Query String Management

```tsx
import { useSearchParams } from "react-router-dom";

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read params
  const page = searchParams.get("page") ?? "1";
  const sort = searchParams.get("sort") ?? "newest";
  const category = searchParams.get("category");

  // Update single param (preserves others)
  function handlePageChange(newPage: number) {
    setSearchParams((prev) => {
      prev.set("page", String(newPage));
      return prev;
    });
  }

  // Update multiple params
  function handleFiltersChange(filters: Record<string, string>) {
    setSearchParams(filters);
  }

  // Delete param
  function clearCategory() {
    setSearchParams((prev) => {
      prev.delete("category");
      return prev;
    });
  }

  return (
    <div>
      <Filters
        sort={sort}
        category={category}
        onFiltersChange={handleFiltersChange}
      />
      <Products page={Number(page)} sort={sort} category={category} />
      <Pagination page={Number(page)} onPageChange={handlePageChange} />
    </div>
  );
}
```

### useLocation - Current Location Info

```tsx
import { useLocation } from "react-router-dom";

function CurrentRoute() {
  const location = useLocation();

  // location object shape:
  // {
  //   pathname: "/users/123",
  //   search: "?tab=posts",
  //   hash: "#comments",
  //   state: { from: "/login" },
  //   key: "default"
  // }

  // Track page views
  useEffect(() => {
    analytics.pageView(location.pathname + location.search);
  }, [location]);

  // Read state passed from navigate()
  const { from } = (location.state as { from?: string }) || {};

  return (
    <div>
      Current path: {location.pathname}
      {from && <p>Navigated from: {from}</p>}
    </div>
  );
}
```

### useMatch - Route Matching

```tsx
import { useMatch } from "react-router-dom";

function Navigation() {
  // Returns match object if current URL matches pattern
  const dashboardMatch = useMatch("/dashboard/*");
  const settingsMatch = useMatch("/settings");

  return (
    <nav>
      <Link
        to="/dashboard"
        className={dashboardMatch ? "active" : ""}
      >
        Dashboard
      </Link>
      <Link
        to="/settings"
        className={settingsMatch ? "active" : ""}
      >
        Settings
      </Link>
    </nav>
  );
}
```

---

## Nested Routes & Layouts

### Parent Layout with Outlet

```tsx
import { Outlet, NavLink } from "react-router-dom";

// Route config
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

// Main layout with persistent header/sidebar
function MainLayout() {
  return (
    <div className="layout">
      <Header />
      <div className="content">
        <Sidebar />
        <main>
          {/* Child routes render here */}
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}

// Nested layout for dashboard section
function DashboardLayout() {
  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Overview
        </NavLink>
        <NavLink
          to="/dashboard/analytics"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Analytics
        </NavLink>
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Settings
        </NavLink>
      </nav>
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
}
```

### Index Routes

```tsx
<Routes>
  <Route path="users" element={<UsersLayout />}>
    {/* Renders when path is exactly /users */}
    <Route index element={<UsersList />} />
    {/* Renders when path is /users/:id */}
    <Route path=":id" element={<UserDetail />} />
  </Route>
</Routes>
```

---

## Protected Routes

### Auth Guard Pattern

```tsx
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "./auth-context";

// Wrapper component for protected routes
function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Authenticated - render children or Outlet
  return children ? <>{children}</> : <Outlet />;
}

// Usage with route config
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
```

### Role-Based Access

```tsx
type Role = "admin" | "editor" | "viewer";

interface RequireRoleProps {
  allowedRoles: Role[];
  children?: React.ReactNode;
}

function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

// Usage
<Routes>
  <Route element={<RequireRole allowedRoles={["admin"]} />}>
    <Route path="/admin/*" element={<AdminPanel />} />
  </Route>

  <Route element={<RequireRole allowedRoles={["admin", "editor"]} />}>
    <Route path="/content/*" element={<ContentEditor />} />
  </Route>
</Routes>
```

---

## Code Splitting & Lazy Loading

```tsx
import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Lazy load route components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Analytics = lazy(() =>
  import("./pages/Analytics").then((module) => ({
    default: module.AnalyticsPage,
  }))
);

// With named exports
const UserProfile = lazy(() =>
  import("./pages/Users").then((module) => ({
    default: module.UserProfile,
  }))
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/users/:id" element={<UserProfile />} />
      </Routes>
    </Suspense>
  );
}

// Better: Per-route suspense for granular loading
function AppWithGranularLoading() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
          </Suspense>
        }
      />
      <Route
        path="/analytics"
        element={
          <Suspense fallback={<AnalyticsSkeleton />}>
            <Analytics />
          </Suspense>
        }
      />
    </Routes>
  );
}
```

---

## Data Loading Patterns

### React Router v6.4+ Loaders (Remix-style)

```tsx
import {
  createBrowserRouter,
  RouterProvider,
  useLoaderData,
  defer,
  Await,
} from "react-router-dom";

// Define loader function
async function userLoader({ params }: { params: { userId: string } }) {
  const user = await fetchUser(params.userId);
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  return { user };
}

// Deferred loading for non-critical data
async function dashboardLoader() {
  // Critical data - blocks render
  const user = await fetchUser();

  // Non-critical - can load after initial render
  const analyticsPromise = fetchAnalytics();
  const notificationsPromise = fetchNotifications();

  return defer({
    user,
    analytics: analyticsPromise,
    notifications: notificationsPromise,
  });
}

// Route config with loaders
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "users/:userId",
        element: <UserProfile />,
        loader: userLoader,
        errorElement: <UserError />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        loader: dashboardLoader,
      },
    ],
  },
]);

// Component using loader data
function UserProfile() {
  const { user } = useLoaderData() as { user: User };

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Component with deferred data
function Dashboard() {
  const { user, analytics, notifications } = useLoaderData() as {
    user: User;
    analytics: Promise<Analytics>;
    notifications: Promise<Notification[]>;
  };

  return (
    <div>
      <h1>Welcome, {user.name}</h1>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <Await resolve={analytics}>
          {(data) => <AnalyticsPanel data={data} />}
        </Await>
      </Suspense>

      <Suspense fallback={<NotificationsSkeleton />}>
        <Await resolve={notifications}>
          {(items) => <NotificationsList items={items} />}
        </Await>
      </Suspense>
    </div>
  );
}

// Render app
function App() {
  return <RouterProvider router={router} />;
}
```

### Traditional Pattern (useEffect)

```tsx
function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchUser(userId!, {
          signal: controller.signal,
        });
        setUser(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    return () => controller.abort();
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return <ProfileCard user={user} />;
}
```

---

## Form Actions (React Router v6.4+)

```tsx
import { Form, useActionData, useNavigation } from "react-router-dom";

// Action function
async function createPostAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Validation
  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required";
  if (!content) errors.content = "Content is required";

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Create post
  try {
    const post = await createPost({ title, content });
    return redirect(`/posts/${post.id}`);
  } catch (err) {
    return { errors: { form: "Failed to create post" } };
  }
}

// Component with Form
function CreatePost() {
  const actionData = useActionData() as { errors?: Record<string, string> };
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          disabled={isSubmitting}
        />
        {actionData?.errors?.title && (
          <p className="error">{actionData.errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          disabled={isSubmitting}
        />
        {actionData?.errors?.content && (
          <p className="error">{actionData.errors.content}</p>
        )}
      </div>

      {actionData?.errors?.form && (
        <p className="error">{actionData.errors.form}</p>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Post"}
      </button>
    </Form>
  );
}

// Route config
const router = createBrowserRouter([
  {
    path: "/posts/new",
    element: <CreatePost />,
    action: createPostAction,
  },
]);
```

---

## Navigation Guards & Blocking

### Prevent Navigation with Unsaved Changes

```tsx
import { useBlocker } from "react-router-dom";

function EditForm() {
  const [isDirty, setIsDirty] = useState(false);

  // Block navigation when form is dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  return (
    <div>
      <form onChange={() => setIsDirty(true)}>
        <input name="title" />
        <textarea name="content" />
        <button type="submit">Save</button>
      </form>

      {blocker.state === "blocked" && (
        <dialog open>
          <p>You have unsaved changes. Are you sure you want to leave?</p>
          <button onClick={() => blocker.proceed()}>Leave</button>
          <button onClick={() => blocker.reset()}>Stay</button>
        </dialog>
      )}
    </div>
  );
}
```

---

## Error Handling

```tsx
import { useRouteError, isRouteErrorResponse } from "react-router-dom";

function ErrorPage() {
  const error = useRouteError();

  // Handle different error types
  if (isRouteErrorResponse(error)) {
    // Response thrown from loader/action
    if (error.status === 404) {
      return (
        <div className="error-page">
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <Link to="/">Go Home</Link>
        </div>
      );
    }

    if (error.status === 401) {
      return (
        <div className="error-page">
          <h1>Unauthorized</h1>
          <p>You need to log in to access this page.</p>
          <Link to="/login">Log In</Link>
        </div>
      );
    }

    return (
      <div className="error-page">
        <h1>Error {error.status}</h1>
        <p>{error.statusText}</p>
      </div>
    );
  }

  // Runtime errors
  if (error instanceof Error) {
    return (
      <div className="error-page">
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }

  return (
    <div className="error-page">
      <h1>Unknown Error</h1>
    </div>
  );
}
```

---

## Scroll Restoration

```tsx
import { ScrollRestoration } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>{/* routes */}</Routes>
      {/* Automatically restores scroll position */}
      <ScrollRestoration />
    </>
  );
}

// Custom scroll behavior
<ScrollRestoration
  getKey={(location) => {
    // Group by pathname - same scroll for same page
    return location.pathname;
  }}
/>
```

---

## Best Practices

### 1. URL as Source of Truth

```tsx
// ❌ Storing filter state only in component
const [filters, setFilters] = useState({ category: "all", sort: "newest" });

// ✅ URL reflects state - shareable, bookmarkable
const [searchParams, setSearchParams] = useSearchParams();
const category = searchParams.get("category") ?? "all";
const sort = searchParams.get("sort") ?? "newest";
```

### 2. Centralized Route Config

```tsx
// routes.tsx - Single source of truth
export const routes = {
  home: "/",
  dashboard: "/dashboard",
  userProfile: (id: string) => `/users/${id}`,
  userSettings: (id: string) => `/users/${id}/settings`,
  posts: "/posts",
  post: (id: string) => `/posts/${id}`,
} as const;

// Usage
<Link to={routes.userProfile(user.id)}>View Profile</Link>
navigate(routes.dashboard);
```

### 3. Type-Safe Params

```tsx
// Define param types
interface UserParams {
  userId: string;
}

// Typed useParams
function UserProfile() {
  const { userId } = useParams() as UserParams;
  // or with type assertion
  const params = useParams<UserParams>();
}
```

---

## Interview Questions

### Q1: How does React Router v6 differ from v5?
**A:** Key differences:
- `<Switch>` → `<Routes>` with inclusive matching
- `<Redirect>` → `<Navigate>`
- Route children are now `element` prop
- Nested routes use `<Outlet>`
- Built-in data loading with loaders/actions (v6.4+)
- Better TypeScript support

### Q2: How do you handle authentication in routes?
**A:** Create a `RequireAuth` wrapper component that checks auth state, shows loading during verification, and redirects to login if unauthenticated. Use `location.state` to remember where the user was trying to go for post-login redirect.

### Q3: What's the benefit of React Router's data loaders?
**A:** Loaders decouple data fetching from component rendering. Data loads before the component renders, eliminating loading spinners in components. Errors are handled at the route level. It mirrors Remix's approach for better UX.

### Q4: How do you prevent data loss on navigation?
**A:** Use `useBlocker` hook to intercept navigation when form is dirty. Show a confirmation dialog and let user choose to proceed or stay.

### Q5: How do you optimize route loading?
**A:** Use `React.lazy()` for code splitting per route, wrap with `Suspense` for loading UI, use route-specific skeletons, and consider prefetching on link hover.
