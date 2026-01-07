# Remix Error Handling

> "Errors are not exceptional—they are expected." — Defensive Programming Principle

Remix provides a robust error handling system through ErrorBoundaries that catch errors in loaders, actions, and components. Unlike traditional React error boundaries, Remix's approach works on both server and client.

---

## Professional Definition

| Concept | Definition | Senior Consideration |
|---------|------------|---------------------|
| ErrorBoundary | React component that catches errors in a route | Provides isolated error recovery per route |
| Route Error Response | HTTP errors thrown from loaders/actions | Different from JavaScript errors, carries status codes |
| isRouteErrorResponse | Utility to check if error is a Response | Distinguishes between 404s and unexpected errors |
| Nested Error Boundaries | Each route can have its own boundary | Parent routes continue working when child errors |
| Global Error Boundary | Root route's ErrorBoundary | Last resort catch-all |

---

## ErrorBoundary Basics

```tsx
// app/routes/posts.$postId.tsx
import { json } from "@remix-run/node";
import { useLoaderData, useRouteError, isRouteErrorResponse } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  const post = await getPost(params.postId);
  
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  
  return json({ post });
}

export default function Post() {
  const { post } = useLoaderData<typeof loader>();
  return <PostContent post={post} />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  // Handle HTTP errors (thrown Responses)
  if (isRouteErrorResponse(error)) {
    return (
      <div className="error-container">
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  }
  
  // Handle JavaScript errors
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
  
  // Unknown error type
  return (
    <div className="error-container">
      <h1>Unknown Error</h1>
      <p>Something went wrong</p>
    </div>
  );
}
```

---

## Throwing Responses vs Errors

### Throwing Response Objects

```tsx
// For expected errors (404, 401, 403, etc.)
export async function loader({ params, request }: LoaderFunctionArgs) {
  // 404 - Resource not found
  const post = await getPost(params.postId);
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  
  // 401 - Unauthorized
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    throw new Response("Please log in", { status: 401 });
  }
  
  // 403 - Forbidden
  if (post.authorId !== session.get("userId")) {
    throw new Response("You can't edit this post", { status: 403 });
  }
  
  // 400 - Bad Request
  if (!isValidUUID(params.postId)) {
    throw new Response("Invalid post ID format", { status: 400 });
  }
  
  return json({ post });
}
```

### Throwing with JSON Data

```tsx
throw json(
  {
    message: "Post not found",
    suggestion: "Check the URL or browse all posts",
    searchLink: "/posts",
  },
  { status: 404 }
);

// In ErrorBoundary:
if (isRouteErrorResponse(error)) {
  // error.data is the parsed JSON object
  return (
    <div>
      <h1>{error.data.message}</h1>
      <p>{error.data.suggestion}</p>
      <Link to={error.data.searchLink}>Browse Posts</Link>
    </div>
  );
}
```

### Throwing JavaScript Errors

```tsx
// For unexpected errors (bugs, system failures)
export async function loader() {
  try {
    const data = await fetchExternalAPI();
    return json({ data });
  } catch (error) {
    // Log the real error for debugging
    console.error("API Error:", error);
    
    // Throw a user-friendly error
    throw new Error("Unable to connect to the service. Please try again later.");
  }
}
```

---

## Error Boundary Patterns

### Status-Specific Error Handling

```tsx
export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 400:
        return (
          <ErrorPage
            title="Bad Request"
            message="The request was invalid."
            action={<Link to="/">Go Home</Link>}
          />
        );
        
      case 401:
        return (
          <ErrorPage
            title="Unauthorized"
            message="You need to log in to access this page."
            action={<Link to="/login">Log In</Link>}
          />
        );
        
      case 403:
        return (
          <ErrorPage
            title="Forbidden"
            message="You don't have permission to access this resource."
            action={<Link to="/dashboard">Go to Dashboard</Link>}
          />
        );
        
      case 404:
        return (
          <ErrorPage
            title="Not Found"
            message={error.data || "The page you're looking for doesn't exist."}
            action={<Link to="/">Go Home</Link>}
          />
        );
        
      case 500:
        return (
          <ErrorPage
            title="Server Error"
            message="Something went wrong on our end."
            action={<button onClick={() => window.location.reload()}>Try Again</button>}
          />
        );
        
      default:
        return (
          <ErrorPage
            title={`${error.status} ${error.statusText}`}
            message={error.data || "An error occurred."}
          />
        );
    }
  }
  
  // Handle unexpected errors
  return (
    <ErrorPage
      title="Unexpected Error"
      message={error instanceof Error ? error.message : "Something went wrong"}
    />
  );
}
```

### Reusable Error Page Component

```tsx
// app/components/ErrorPage.tsx
interface ErrorPageProps {
  title: string;
  message: string;
  action?: React.ReactNode;
  showHomeLink?: boolean;
}

export function ErrorPage({ 
  title, 
  message, 
  action, 
  showHomeLink = true 
}: ErrorPageProps) {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1>{title}</h1>
        <p>{message}</p>
        
        <div className="error-actions">
          {action}
          {showHomeLink && <Link to="/">Return Home</Link>}
        </div>
      </div>
    </div>
  );
}
```

---

## Nested Error Boundaries

Error boundaries are scoped to routes. Parent routes continue working when children error:

```
URL: /dashboard/analytics

Route Hierarchy:
├── root.tsx (has ErrorBoundary)
├── routes/dashboard.tsx (has ErrorBoundary)
└── routes/dashboard.analytics.tsx (has ErrorBoundary)

If analytics loader throws:
- analytics ErrorBoundary renders
- dashboard layout still works (sidebar, nav)
- root layout still works (header, footer)

If analytics doesn't have ErrorBoundary:
- Error bubbles to dashboard ErrorBoundary
```

### Layout Preservation Example

```tsx
// app/routes/dashboard.tsx
export default function DashboardLayout() {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>
        <Outlet /> {/* Child routes or their ErrorBoundary */}
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  // This preserves the dashboard layout!
  return (
    <div className="dashboard">
      <Sidebar />
      <main>
        <div className="error-content">
          <h1>Dashboard Error</h1>
          <p>Something went wrong loading this section.</p>
          <Link to="/dashboard">Go to Dashboard Home</Link>
        </div>
      </main>
    </div>
  );
}
```

---

## Root Error Boundary

The root route's ErrorBoundary is the last resort. It must render a complete HTML document:

```tsx
// app/root.tsx
export function ErrorBoundary() {
  const error = useRouteError();
  
  let title = "Error";
  let message = "Something went wrong";
  
  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data;
  } else if (error instanceof Error) {
    message = error.message;
  }
  
  // Must return complete HTML document
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles/error.css" />
      </head>
      <body>
        <div className="root-error">
          <h1>{title}</h1>
          <p>{message}</p>
          <a href="/">Return to Home</a>
        </div>
      </body>
    </html>
  );
}
```

---

## Utility Functions for Errors

### Creating Error Utilities

```tsx
// app/utils/errors.server.ts
import { json } from "@remix-run/node";

export function notFound(message = "Not found") {
  throw new Response(message, { status: 404 });
}

export function badRequest(message = "Bad request") {
  throw new Response(message, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  throw new Response(message, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  throw new Response(message, { status: 403 });
}

export function serverError(message = "Internal server error") {
  throw new Response(message, { status: 500 });
}

// With structured data
export function notFoundWithData(data: Record<string, unknown>) {
  throw json(data, { status: 404 });
}

// Usage in loaders
export async function loader({ params }: LoaderFunctionArgs) {
  const post = await getPost(params.id);
  if (!post) notFound("Post not found");
  
  return json({ post });
}
```

### Invariant Pattern

```tsx
// app/utils/invariant.ts
export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function invariantResponse(
  condition: unknown,
  message: string,
  status = 400
): asserts condition {
  if (!condition) {
    throw new Response(message, { status });
  }
}

// Usage
export async function loader({ params }: LoaderFunctionArgs) {
  invariantResponse(params.id, "ID is required", 400);
  
  const post = await getPost(params.id);
  invariantResponse(post, "Post not found", 404);
  
  return json({ post });
}
```

---

## Error Logging

```tsx
// app/utils/logger.server.ts
export function logError(error: unknown, context?: Record<string, unknown>) {
  const errorInfo = {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", errorInfo);
    return;
  }
  
  // In production, send to logging service
  // Example: Sentry, LogRocket, DataDog, etc.
  sendToLoggingService(errorInfo);
}

// In loaders/actions
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    return json(await fetchData());
  } catch (error) {
    logError(error, {
      url: request.url,
      method: request.method,
    });
    throw error; // Re-throw to trigger ErrorBoundary
  }
}
```

---

## Action Errors

Handling errors in actions with proper validation feedback:

```tsx
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  // Validation errors - return, don't throw
  const result = ContactSchema.safeParse(data);
  if (!result.success) {
    return json(
      {
        errors: result.error.flatten().fieldErrors,
        values: data,
      },
      { status: 400 }
    );
  }
  
  try {
    await sendMessage(result.data);
    return redirect("/thank-you");
  } catch (error) {
    // Unexpected errors - throw to ErrorBoundary
    throw new Error("Failed to send message");
  }
}

export default function Contact() {
  const actionData = useActionData<typeof action>();
  
  return (
    <Form method="post">
      <input
        name="name"
        defaultValue={actionData?.values?.name}
      />
      {actionData?.errors?.name && (
        <span className="error">{actionData.errors.name}</span>
      )}
      
      {/* ... more fields */}
    </Form>
  );
}

export function ErrorBoundary() {
  // This catches thrown errors, not validation errors
  return (
    <div>
      <h1>Error Sending Message</h1>
      <p>Please try again later.</p>
      <Link to="/contact">Try Again</Link>
    </div>
  );
}
```

---

## Error Recovery

### Retry Mechanism

```tsx
export function ErrorBoundary() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  
  const handleRetry = () => {
    revalidator.revalidate();
  };
  
  return (
    <div className="error-container">
      <h1>Error Loading Data</h1>
      <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      
      <button 
        onClick={handleRetry}
        disabled={revalidator.state === "loading"}
      >
        {revalidator.state === "loading" ? "Retrying..." : "Try Again"}
      </button>
    </div>
  );
}
```

### Offline Fallback

```tsx
export function ErrorBoundary() {
  const error = useRouteError();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  if (!isOnline) {
    return (
      <div className="offline-message">
        <h1>You're Offline</h1>
        <p>Please check your internet connection.</p>
      </div>
    );
  }
  
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>{error instanceof Error ? error.message : "Something went wrong"}</p>
    </div>
  );
}
```

---

## Senior Interview Focus Points

1. **Difference between throwing Response and Error:**
   - Response: Expected errors (404, 401) with HTTP semantics
   - Error: Unexpected bugs, system failures
   - Use `isRouteErrorResponse()` to distinguish them

2. **How do nested error boundaries work?**
   - Each route can have its own ErrorBoundary
   - Errors bubble up to nearest parent boundary
   - Parent layouts stay rendered when child errors
   - Root boundary is the last resort

3. **When to return vs throw errors in actions:**
   ```tsx
   // Return: Validation errors (user should fix input)
   return json({ errors }, { status: 400 });
   
   // Throw: System errors (something broken)
   throw new Error("Database connection failed");
   ```

4. **Best practices for error handling:**
   - Use utility functions for common error patterns
   - Log errors server-side for debugging
   - Show user-friendly messages in production
   - Provide recovery actions (retry, go home)
   - Preserve layout context when possible

5. **Testing error boundaries:**
   - Test with thrown Responses (different status codes)
   - Test with thrown Errors
   - Test error recovery flows
   - Test offline scenarios
