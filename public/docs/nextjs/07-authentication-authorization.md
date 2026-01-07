# Authentication & Authorization

> "Security is not a product, but a process." — Bruce Schneier

Authentication and authorization in Next.js require careful consideration of where code runs (server vs. client, Node.js vs. Edge) and how to protect both pages and API routes. This guide covers production-ready patterns for securing your Next.js application.

---

## Professional Definition

| Concept | Definition | Why Seniors Care |
|---------|------------|------------------|
| Authentication (AuthN) | Verifying user identity (who you are) | Gate access to protected resources |
| Authorization (AuthZ) | Verifying user permissions (what you can do) | Fine-grained access control |
| Session Management | Maintaining auth state across requests | Secure cookie handling, token refresh |
| OAuth/OIDC | Delegated auth via third-party providers | Google, GitHub, Microsoft login |

---

## Simple Explanation (Feynman Backpack Edition)

Think of a high-security building:

1. **Authentication** = Showing your ID at the entrance. "Are you who you claim to be?"

2. **Authorization** = The areas your keycard can access. A visitor badge vs. employee badge vs. executive badge.

3. **Session** = Your temporary visitor pass. Valid for the day, contains your photo and access level.

4. **OAuth** = Using your driver's license instead of building ID. The building trusts the DMV (Google/GitHub) to verify your identity.

---

## Authentication Strategies

### Strategy Comparison

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| Session Cookies | Simple, secure, httpOnly | Requires session storage | Traditional web apps |
| JWT Tokens | Stateless, scalable | Can't revoke easily, size | APIs, microservices |
| OAuth Providers | No password management | Dependency on third-party | Consumer apps |
| Magic Links | No password, very secure | Email dependency | Low-friction signup |
| Passkeys/WebAuthn | Most secure, phishing-resistant | Browser support varies | High-security apps |

---

## Auth.js (NextAuth.js v5)

The most popular authentication library for Next.js:

### Installation & Setup

```bash
npm install next-auth@beta
```

```typescript
// auth.ts (root level)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    // OAuth providers
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    
    // Email/password
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        
        if (!user) return null;
        
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        
        if (!passwordMatch) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  
  callbacks: {
    // Add custom data to JWT
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    
    // Add custom data to session
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
    
    // Control who can sign in
    signIn({ user, account, profile }) {
      // Block users without verified email
      if (!profile?.email_verified) {
        return false;
      }
      return true;
    },
    
    // Control redirects
    redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  
  session: {
    strategy: 'jwt', // or 'database'
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
```

### Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

### Middleware Protection

```typescript
// middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');
  
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Server Component Usage

```tsx
// app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Client Component Usage

```tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (session) {
    return (
      <div>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }
  
  return (
    <div>
      <button onClick={() => signIn('github')}>Sign in with GitHub</button>
      <button onClick={() => signIn('google')}>Sign in with Google</button>
    </div>
  );
}
```

### Session Provider

```tsx
// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Custom JWT Authentication

For more control, implement custom JWT authentication:

### Token Utilities

```typescript
// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
const alg = 'HS256';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp?: number;
}

export async function createToken(payload: Omit<TokenPayload, 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}
```

### Login Route Handler

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth/jwt';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  // Validate input
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password required' },
      { status: 400 }
    );
  }
  
  // Find user
  const user = await db.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
  
  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!passwordMatch) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
  
  // Create token
  const token = await createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  // Set cookie
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
  
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  return response;
}
```

### Protected Server Action

```typescript
// app/actions/user.ts
'use server';

import { getSession } from '@/lib/auth/jwt';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  const name = formData.get('name') as string;
  
  await db.user.update({
    where: { id: session.userId },
    data: { name },
  });
  
  return { success: true };
}
```

---

## Role-Based Access Control (RBAC)

### Role Definitions

```typescript
// lib/auth/roles.ts
export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Posts
  'posts:read': [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN],
  'posts:create': [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN],
  'posts:update': [ROLES.MODERATOR, ROLES.ADMIN],
  'posts:delete': [ROLES.ADMIN],
  
  // Users
  'users:read': [ROLES.MODERATOR, ROLES.ADMIN],
  'users:update': [ROLES.ADMIN],
  'users:delete': [ROLES.ADMIN],
  
  // Settings
  'settings:read': [ROLES.ADMIN],
  'settings:update': [ROLES.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(role);
}

export function requireRole(...allowedRoles: Role[]) {
  return async function checkRole() {
    const session = await getSession();
    
    if (!session) {
      redirect('/login');
    }
    
    if (!allowedRoles.includes(session.role as Role)) {
      redirect('/unauthorized');
    }
    
    return session;
  };
}
```

### Protected Pages

```tsx
// app/admin/page.tsx
import { requireRole, ROLES } from '@/lib/auth/roles';

export default async function AdminPage() {
  const session = await requireRole(ROLES.ADMIN)();
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session.email}</p>
    </div>
  );
}
```

### Authorization Component

```tsx
// components/Authorize.tsx
import { getSession } from '@/lib/auth/jwt';
import { hasPermission, Permission, Role } from '@/lib/auth/roles';

interface AuthorizeProps {
  permission?: Permission;
  roles?: Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export async function Authorize({
  permission,
  roles,
  fallback = null,
  children,
}: AuthorizeProps) {
  const session = await getSession();
  
  if (!session) return fallback;
  
  // Check role
  if (roles && !roles.includes(session.role as Role)) {
    return fallback;
  }
  
  // Check permission
  if (permission && !hasPermission(session.role as Role, permission)) {
    return fallback;
  }
  
  return <>{children}</>;
}

// Usage
export default function PostsPage() {
  return (
    <div>
      <h1>Posts</h1>
      
      <Authorize permission="posts:create">
        <button>Create Post</button>
      </Authorize>
      
      <Authorize roles={['admin', 'moderator']}>
        <button>Moderate Posts</button>
      </Authorize>
    </div>
  );
}
```

---

## Protecting Routes

### Layout-Level Protection

```tsx
// app/(protected)/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div>
      <nav>
        <span>Welcome, {session.user.name}</span>
        {/* Protected nav */}
      </nav>
      {children}
    </div>
  );
}
```

### Higher-Order Component Pattern

```tsx
// lib/auth/withAuth.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ComponentType } from 'react';

interface WithAuthOptions {
  roles?: string[];
  redirectTo?: string;
}

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return async function AuthenticatedComponent(props: P) {
    const session = await auth();
    
    if (!session) {
      redirect(options.redirectTo || '/login');
    }
    
    if (options.roles && !options.roles.includes(session.user.role)) {
      redirect('/unauthorized');
    }
    
    return <Component {...props} session={session} />;
  };
}

// Usage
async function DashboardPage({ session }: { session: Session }) {
  return <div>Hello, {session.user.name}</div>;
}

export default withAuth(DashboardPage);
```

---

## Login/Signup Forms

### Login Page

```tsx
// app/login/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const session = await auth();
  
  if (session) {
    redirect('/dashboard');
  }
  
  return (
    <div className="login-container">
      <h1>Sign In</h1>
      <LoginForm />
    </div>
  );
}
```

```tsx
// app/login/LoginForm.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn } from 'next-auth/react';
import { login } from '@/app/actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign In'}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, { error: null });
  
  return (
    <div>
      <form action={formAction}>
        {state.error && <p className="error">{state.error}</p>}
        
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        
        <SubmitButton />
      </form>
      
      <div className="divider">or</div>
      
      <button onClick={() => signIn('github')}>
        Continue with GitHub
      </button>
      
      <button onClick={() => signIn('google')}>
        Continue with Google
      </button>
    </div>
  );
}
```

### Login Server Action

```typescript
// app/actions/auth.ts
'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export async function login(
  prevState: { error: string | null },
  formData: FormData
) {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password' };
        default:
          return { error: 'Something went wrong' };
      }
    }
    throw error;
  }
  
  redirect('/dashboard');
}

export async function signup(
  prevState: { error: string | null },
  formData: FormData
) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  
  // Validate
  if (!email || !password || !name) {
    return { error: 'All fields are required' };
  }
  
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }
  
  // Check if user exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    return { error: 'Email already registered' };
  }
  
  // Create user
  const passwordHash = await bcrypt.hash(password, 12);
  
  await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'user',
    },
  });
  
  // Sign in
  await signIn('credentials', {
    email,
    password,
    redirect: false,
  });
  
  redirect('/dashboard');
}

export async function logout() {
  await signOut({ redirect: false });
  redirect('/');
}
```

---

## Protecting API Routes

```typescript
// app/api/protected/route.ts
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Optionally check role
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  const data = await fetchProtectedData(session.user.id);
  
  return NextResponse.json(data);
}
```

### Reusable Auth Wrapper

```typescript
// lib/auth/api-auth.ts
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (
  request: NextRequest,
  context: { params: any },
  session: Session
) => Promise<NextResponse>;

export function withApiAuth(handler: ApiHandler, options?: { roles?: string[] }) {
  return async function (request: NextRequest, context: { params: any }) {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (options?.roles && !options.roles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return handler(request, context, session);
  };
}

// Usage
export const GET = withApiAuth(
  async (request, context, session) => {
    const data = await fetchUserData(session.user.id);
    return NextResponse.json(data);
  },
  { roles: ['admin', 'moderator'] }
);
```

---

## Session Refresh & Token Rotation

```typescript
// auth.ts
import NextAuth from 'next-auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ...providers
  
  callbacks: {
    jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + account.expires_in * 1000,
          refreshToken: account.refresh_token,
        };
      }
      
      // Return previous token if not expired
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }
      
      // Refresh the token
      return refreshAccessToken(token);
    },
    
    session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
});

async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch('https://oauth.provider.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID!,
        client_secret: process.env.CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });
    
    const refreshedTokens = await response.json();
    
    if (!response.ok) throw refreshedTokens;
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
```

---

## Senior-Level Interview Prompts & Answers

### 1. "How do you handle authentication in Next.js App Router?"

**Answer:** Multiple layers:
1. **Middleware** for fast Edge-level route protection
2. **Server Components** check session via `auth()` for page-level protection
3. **Server Actions** verify session before mutations
4. **Route Handlers** check auth for API endpoints

I prefer Auth.js for OAuth/JWT handling, with httpOnly cookies for security. Critical: never trust client-side auth checks alone.

### 2. "JWT vs Session cookies - when to use which?"

**Answer:**
- **JWTs**: Stateless (good for microservices, mobile apps), self-contained user data, but can't be revoked easily. Store in httpOnly cookies, not localStorage.
- **Sessions**: Server-side storage (Redis), easy to invalidate, smaller cookie size. Better for traditional web apps.

I typically use JWT with short expiry + refresh token rotation for the best balance.

### 3. "How do you implement role-based access control?"

**Answer:**
1. Store role in JWT/session during login
2. Define permissions per role centrally
3. Check in middleware for route-level protection
4. Use `<Authorize>` component for UI-level control
5. Always verify server-side before mutations

Never trust client-side role checks for authorization decisions.

### 4. "How do you handle OAuth token refresh?"

**Answer:** In Auth.js callbacks:
1. Store access/refresh tokens and expiry in JWT
2. Check expiry in `jwt` callback on each request
3. If expired, call provider's refresh endpoint
4. Update tokens in JWT
5. Handle refresh failures by forcing re-auth

---

## Common Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| Storing tokens in localStorage | XSS vulnerable | Use httpOnly cookies |
| Client-only auth checks | Easily bypassed | Always verify server-side |
| Not validating on every request | Stale/invalid sessions | Check middleware + routes |
| Hardcoded secrets | Security breach | Use environment variables |
| No CSRF protection | CSRF attacks | Use SameSite cookies, tokens |
| Long-lived tokens | Extended breach window | Short expiry + refresh rotation |
