# Remix Authentication & Sessions

> "Security is not a feature—it's a requirement." — Security Engineering Principle

Authentication in Remix leverages web standards: cookies, sessions, and HTTP headers. The server-first model means sensitive logic stays on the server, making Remix apps inherently more secure than client-heavy SPAs.

---

## Professional Definition

| Concept | Definition | Senior Consideration |
|---------|------------|---------------------|
| Sessions | Server-side state linked to a cookie | Stores user identity, flash messages, CSRF tokens |
| Cookie Session | Session data stored in the cookie itself | Simple, no backend storage, limited to 4KB |
| Database Session | Cookie holds ID, data in database | Scalable, secure, revocable |
| Authentication | Verifying user identity | Happens in loaders/actions, before rendering |
| Authorization | Verifying user permissions | Route-level guards, resource-level checks |

---

## Session Storage Options

Remix provides multiple session storage implementations:

```typescript
// app/sessions.server.ts
import { createCookieSessionStorage } from "@remix-run/node";

// 1. Cookie Session (data in cookie)
const cookieSession = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET!],
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = cookieSession;
```

### Database Session Storage

```typescript
// app/sessions.server.ts
import { createSessionStorage } from "@remix-run/node";
import { prisma } from "~/utils/db.server";

function createDatabaseSessionStorage() {
  return createSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [process.env.SESSION_SECRET!],
      secure: process.env.NODE_ENV === "production",
    },
    async createData(data, expires) {
      const session = await prisma.session.create({
        data: {
          data: JSON.stringify(data),
          expiresAt: expires ?? new Date(Date.now() + 60 * 60 * 24 * 7 * 1000),
        },
      });
      return session.id;
    },
    async readData(id) {
      const session = await prisma.session.findUnique({ where: { id } });
      if (!session) return null;
      if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id } });
        return null;
      }
      return JSON.parse(session.data);
    },
    async updateData(id, data, expires) {
      await prisma.session.update({
        where: { id },
        data: {
          data: JSON.stringify(data),
          expiresAt: expires,
        },
      });
    },
    async deleteData(id) {
      await prisma.session.delete({ where: { id } });
    },
  });
}

export const { getSession, commitSession, destroySession } = 
  createDatabaseSessionStorage();
```

---

## User Authentication Flow

### Login Implementation

```typescript
// app/routes/login.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import bcrypt from "bcryptjs";

import { getSession, commitSession } from "~/sessions.server";
import { prisma } from "~/utils/db.server";

// Redirect if already logged in
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("userId")) {
    return redirect("/dashboard");
  }
  
  // Return flash message if any
  const error = session.get("error");
  return json({ error }, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string || "/dashboard";
  
  // Validate inputs
  if (!email || !password) {
    return json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }
  
  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }
  
  // Set session
  session.set("userId", user.id);
  
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <div className="login-container">
      <h1>Login</h1>
      
      {actionData?.error && (
        <div className="error-message">{actionData.error}</div>
      )}
      
      <Form method="post">
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
          />
        </div>
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
      </Form>
    </div>
  );
}
```

### Logout Implementation

```typescript
// app/routes/logout.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";

import { getSession, destroySession } from "~/sessions.server";

// Only allow POST for logout (CSRF protection)
export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

// Optional: Show confirmation page
export default function Logout() {
  return (
    <div>
      <h1>Logout</h1>
      <p>Are you sure you want to log out?</p>
      <Form method="post">
        <button type="submit">Log Out</button>
      </Form>
    </div>
  );
}
```

---

## Protected Routes

### Authentication Guard Utility

```typescript
// app/utils/auth.server.ts
import { redirect } from "@remix-run/node";
import { getSession } from "~/sessions.server";
import { prisma } from "~/utils/db.server";

export async function requireUser(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  if (!userId) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams([["redirectTo", url.pathname]]);
    throw redirect(`/login?${searchParams}`);
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  
  if (!user) {
    throw redirect("/login");
  }
  
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  
  if (user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }
  
  return user;
}

export async function getOptionalUser(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  if (!userId) return null;
  
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
}
```

### Using Guards in Routes

```typescript
// app/routes/dashboard.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request); // Redirects if not authenticated
  
  const dashboardData = await getDashboardData(user.id);
  
  return json({ user, dashboardData });
}

export default function Dashboard() {
  const { user, dashboardData } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

---

## OAuth Integration

### OAuth with remix-auth

```typescript
// app/services/auth.server.ts
import { Authenticator } from "remix-auth";
import { GitHubStrategy } from "remix-auth-github";
import { sessionStorage } from "~/sessions.server";
import { prisma } from "~/utils/db.server";

export const authenticator = new Authenticator(sessionStorage);

authenticator.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.APP_URL}/auth/github/callback`,
    },
    async ({ profile }) => {
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { githubId: profile.id },
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            githubId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
          },
        });
      }
      
      return user;
    }
  ),
  "github"
);
```

```typescript
// app/routes/auth.github.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return authenticator.authenticate("github", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
}
```

```typescript
// app/routes/auth.github.callback.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return authenticator.authenticate("github", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
}
```

---

## Flash Messages

Session flash messages for one-time notifications:

```typescript
// app/utils/flash.server.ts
import { getSession, commitSession } from "~/sessions.server";

type FlashType = "success" | "error" | "info" | "warning";

interface FlashMessage {
  type: FlashType;
  message: string;
}

export async function setFlash(
  request: Request,
  flash: FlashMessage
): Promise<string> {
  const session = await getSession(request.headers.get("Cookie"));
  session.flash("flash", flash);
  return commitSession(session);
}

export async function getFlash(request: Request): Promise<{
  flash: FlashMessage | null;
  headers: HeadersInit;
}> {
  const session = await getSession(request.headers.get("Cookie"));
  const flash = session.get("flash") as FlashMessage | undefined;
  
  return {
    flash: flash || null,
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  };
}
```

### Using Flash Messages

```typescript
// In an action
export async function action({ request }: ActionFunctionArgs) {
  await deleteItem(request);
  
  return redirect("/items", {
    headers: {
      "Set-Cookie": await setFlash(request, {
        type: "success",
        message: "Item deleted successfully",
      }),
    },
  });
}

// In a loader
export async function loader({ request }: LoaderFunctionArgs) {
  const { flash, headers } = await getFlash(request);
  const items = await getItems();
  
  return json({ items, flash }, { headers });
}

// In component
export default function Items() {
  const { items, flash } = useLoaderData<typeof loader>();
  
  return (
    <div>
      {flash && (
        <div className={`flash flash-${flash.type}`}>
          {flash.message}
        </div>
      )}
      {/* Rest of component */}
    </div>
  );
}
```

---

## CSRF Protection

```typescript
// app/utils/csrf.server.ts
import { createCookie } from "@remix-run/node";
import { randomBytes } from "crypto";

const csrfCookie = createCookie("csrf", {
  httpOnly: true,
  path: "/",
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
});

export async function createCsrfToken(request: Request): Promise<{
  token: string;
  cookie: string;
}> {
  const token = randomBytes(32).toString("hex");
  const cookie = await csrfCookie.serialize(token);
  return { token, cookie };
}

export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("Cookie");
  const cookieToken = await csrfCookie.parse(cookieHeader);
  
  const formData = await request.formData();
  const formToken = formData.get("csrf");
  
  if (!cookieToken || !formToken) return false;
  return cookieToken === formToken;
}
```

### Using CSRF in Forms

```typescript
// In loader
export async function loader({ request }: LoaderFunctionArgs) {
  const { token, cookie } = await createCsrfToken(request);
  
  return json({ csrfToken: token }, {
    headers: { "Set-Cookie": cookie },
  });
}

// In component
export default function SecureForm() {
  const { csrfToken } = useLoaderData<typeof loader>();
  
  return (
    <Form method="post">
      <input type="hidden" name="csrf" value={csrfToken} />
      {/* Form fields */}
      <button type="submit">Submit</button>
    </Form>
  );
}

// In action
export async function action({ request }: ActionFunctionArgs) {
  const isValid = await validateCsrfToken(request.clone());
  if (!isValid) {
    throw new Response("Invalid CSRF token", { status: 403 });
  }
  
  // Process form...
}
```

---

## Role-Based Access Control

```typescript
// app/utils/permissions.server.ts
type Role = "USER" | "EDITOR" | "ADMIN";
type Permission = "read" | "write" | "delete" | "admin";

const rolePermissions: Record<Role, Permission[]> = {
  USER: ["read"],
  EDITOR: ["read", "write"],
  ADMIN: ["read", "write", "delete", "admin"],
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false;
}

export async function requirePermission(
  request: Request,
  permission: Permission
) {
  const user = await requireUser(request);
  
  if (!hasPermission(user.role as Role, permission)) {
    throw new Response("Forbidden", { status: 403 });
  }
  
  return user;
}
```

### Resource-Level Authorization

```typescript
// app/routes/posts.$postId.edit.tsx
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const post = await getPost(params.postId);
  
  if (!post) {
    throw new Response("Not found", { status: 404 });
  }
  
  // Check ownership or admin role
  if (post.authorId !== user.id && user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }
  
  return json({ post });
}
```

---

## Senior Interview Focus Points

1. **Cookie vs Database Sessions:**
   - Cookie: Simple, no backend, limited size (4KB)
   - Database: Scalable, revocable, stores unlimited data
   - Hybrid: ID in cookie, data in Redis for performance

2. **Why is logout a POST action?**
   - Prevents CSRF attacks via image tags or links
   - `<img src="/logout">` could log out users
   - POST requires form submission

3. **Session security best practices:**
   ```typescript
   cookie: {
     httpOnly: true,      // No JS access
     secure: true,        // HTTPS only
     sameSite: "lax",     // CSRF protection
     maxAge: 60 * 60 * 24 // Limit lifetime
   }
   ```

4. **How do you handle token refresh?**
   - Check token expiry in loaders
   - Refresh silently if close to expiry
   - Redirect to login if refresh fails

5. **OAuth security considerations:**
   - Validate state parameter
   - Use PKCE for public clients
   - Store tokens server-side only
   - Implement token revocation
