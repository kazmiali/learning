# Testing Next.js Applications

> "Code without tests is broken by design." — Jacob Kaplan-Moss

Testing Next.js applications requires understanding the unique aspects of the framework: Server Components, Client Components, Server Actions, and the App Router. This guide covers testing strategies from unit tests to end-to-end testing.

---

## Professional Definition

| Test Type | What It Tests | Tools | Speed |
|-----------|---------------|-------|-------|
| Unit Tests | Individual functions, utilities | Jest, Vitest | Fast |
| Component Tests | React components in isolation | React Testing Library | Fast |
| Integration Tests | Multiple components working together | RTL, MSW | Medium |
| E2E Tests | Full user flows in real browser | Playwright, Cypress | Slow |

---

## Simple Explanation (Feynman Backpack Edition)

Imagine building a car:

1. **Unit Tests** = Testing individual parts. Does the spark plug fire? Does the fuel pump work?

2. **Component Tests** = Testing assembled systems. Does the engine run when parts are connected?

3. **Integration Tests** = Testing systems together. Does the engine work with the transmission?

4. **E2E Tests** = Test driving the complete car. Does it drive from A to B?

---

## Setting Up Testing

### Install Dependencies

```bash
# Jest + React Testing Library
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# For TypeScript
npm install -D @types/jest ts-jest

# Alternatively, Vitest (faster)
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom

# Playwright for E2E
npm install -D @playwright/test
```

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
```

---

## Unit Testing

### Testing Utility Functions

```typescript
// lib/utils.ts
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
```

```typescript
// lib/utils.test.ts
import { formatPrice, slugify, truncate } from './utils';

describe('formatPrice', () => {
  it('formats cents to dollars', () => {
    expect(formatPrice(1000)).toBe('$10.00');
    expect(formatPrice(99)).toBe('$0.99');
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('handles large numbers', () => {
    expect(formatPrice(100000)).toBe('$1000.00');
  });
});

describe('slugify', () => {
  it('converts text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    expect(slugify('Special! @#$ Characters')).toBe('special-characters');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('returns original if under limit', () => {
    expect(truncate('Hi', 5)).toBe('Hi');
  });
});
```

---

## Component Testing

### Testing Client Components

```tsx
// components/Counter.tsx
'use client';

import { useState } from 'react';

export function Counter({ initialValue = 0 }: { initialValue?: number }) {
  const [count, setCount] = useState(initialValue);

  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

```tsx
// components/Counter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('renders with initial value', () => {
    render(<Counter initialValue={5} />);
    expect(screen.getByTestId('count')).toHaveTextContent('5');
  });

  it('increments count on button click', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    
    await user.click(screen.getByRole('button', { name: /increment/i }));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('decrements count on button click', async () => {
    const user = userEvent.setup();
    render(<Counter initialValue={5} />);
    
    await user.click(screen.getByRole('button', { name: /decrement/i }));
    expect(screen.getByTestId('count')).toHaveTextContent('4');
  });
});
```

### Testing Forms

```tsx
// components/LoginForm.tsx
'use client';

import { useState } from 'react';

interface Props {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit(email, password);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div role="alert">{error}</div>}
      
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

```tsx
// components/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits with email and password', async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('shows loading state during submission', async () => {
    const handleSubmit = jest.fn(() => new Promise(r => setTimeout(r, 100)));
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(screen.getByRole('button')).toHaveTextContent('Signing in...');
    expect(screen.getByRole('button')).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Sign In');
    });
  });

  it('displays error on failed submission', async () => {
    const handleSubmit = jest.fn().mockRejectedValue(new Error('Failed'));
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });
});
```

---

## Testing Server Components

Server Components can't be tested with React Testing Library directly. Test them by:
1. Testing the data fetching logic separately
2. Using E2E tests for the full render

```typescript
// lib/data/posts.ts
import prisma from '@/lib/prisma';

export async function getPosts() {
  return prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  });
}
```

```typescript
// lib/data/posts.test.ts
import { getPosts } from './posts';
import prisma from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  post: {
    findMany: jest.fn(),
  },
}));

describe('getPosts', () => {
  it('returns published posts', async () => {
    const mockPosts = [
      { id: '1', title: 'Post 1', published: true },
      { id: '2', title: 'Post 2', published: true },
    ];
    
    (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
    
    const posts = await getPosts();
    
    expect(posts).toEqual(mockPosts);
    expect(prisma.post.findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
  });
});
```

---

## Testing Server Actions

```typescript
// app/actions/posts.ts
'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PostSchema = z.object({
  title: z.string().min(1, 'Title required'),
  content: z.string().min(10, 'Content too short'),
});

export async function createPost(prevState: any, formData: FormData) {
  const session = await auth();
  
  if (!session) {
    return { error: 'Unauthorized' };
  }
  
  const validated = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });
  
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }
  
  await prisma.post.create({
    data: {
      ...validated.data,
      authorId: session.user.id,
    },
  });
  
  revalidatePath('/posts');
  return { success: true };
}
```

```typescript
// app/actions/posts.test.ts
import { createPost } from './posts';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  post: { create: jest.fn() },
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

describe('createPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    
    const formData = new FormData();
    formData.set('title', 'Test');
    formData.set('content', 'Test content');
    
    const result = await createPost({}, formData);
    
    expect(result).toEqual({ error: 'Unauthorized' });
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it('validates input and returns errors', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } });
    
    const formData = new FormData();
    formData.set('title', '');
    formData.set('content', 'short');
    
    const result = await createPost({}, formData);
    
    expect(result.error).toBeDefined();
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it('creates post and revalidates', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } });
    (prisma.post.create as jest.Mock).mockResolvedValue({ id: 'new-post' });
    
    const formData = new FormData();
    formData.set('title', 'Valid Title');
    formData.set('content', 'Valid content that is long enough');
    
    const result = await createPost({}, formData);
    
    expect(result).toEqual({ success: true });
    expect(prisma.post.create).toHaveBeenCalledWith({
      data: {
        title: 'Valid Title',
        content: 'Valid content that is long enough',
        authorId: '1',
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/posts');
  });
});
```

---

## Mocking API Requests with MSW

```bash
npm install -D msw
```

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: '3', ...body },
      { status: 201 }
    );
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    
    if (id === 'not-found') {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ id, name: 'John' });
  }),
];
```

```typescript
// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// jest.setup.js
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// components/UserList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { UserList } from './UserList';

describe('UserList', () => {
  it('displays users from API', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    // Override handler for this test
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json(
          { error: 'Server error' },
          { status: 500 }
        );
      })
    );
    
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## E2E Testing with Playwright

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('displays welcome message', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');
  });

  test('navigates to about page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=About');
    await expect(page).toHaveURL('/about');
  });
});
```

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logs in successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.getByRole('alert')).toContainText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });
});
```

### Testing with Authentication State

```typescript
// e2e/fixtures/auth.ts
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ page, context }, use) => {
    // Set auth cookie
    await context.addCookies([
      {
        name: 'session',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await use(page);
  },
});

// e2e/dashboard.spec.ts
import { test } from './fixtures/auth';
import { expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('shows user data when authenticated', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.getByText('Dashboard')).toBeVisible();
  });
});
```

---

## Testing API Routes

```typescript
// app/api/users/route.test.ts
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('Users API', () => {
  describe('GET /api/users', () => {
    it('returns list of users', async () => {
      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    it('creates a new user', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.name).toBe('John');
    });

    it('returns 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });
  });
});
```

---

## Testing Best Practices

### Test Organization

```
├── __tests__/          # or tests/
│   ├── unit/
│   │   └── utils.test.ts
│   ├── components/
│   │   └── Button.test.tsx
│   └── integration/
│       └── checkout.test.tsx
├── e2e/
│   ├── auth.spec.ts
│   └── checkout.spec.ts
└── mocks/
    ├── handlers.ts
    └── server.ts
```

### Testing Patterns

| Pattern | Description |
|---------|-------------|
| AAA | Arrange, Act, Assert |
| Given-When-Then | BDD style |
| Test one thing | Each test has one assertion focus |
| Descriptive names | `it('should create user when valid data provided')` |
| Mock at boundaries | Mock external APIs, not internal logic |

---

## Senior-Level Interview Prompts & Answers

### 1. "How do you test Server Components in Next.js?"

**Answer:** Server Components can't be tested with RTL directly. Strategies:
1. Test data fetching functions in isolation
2. Mock the database/API layer
3. Use E2E tests for full render verification
4. Test the component's logic, not the async rendering

### 2. "What's your testing strategy for a Next.js app?"

**Answer:** Pyramid approach:
1. **Unit tests** (many): Utilities, hooks, pure functions
2. **Component tests** (medium): Isolated component behavior
3. **Integration tests** (few): Component interactions
4. **E2E tests** (minimal): Critical user flows

Focus on testing behavior, not implementation. Mock at boundaries (APIs, DB).

### 3. "How do you handle authentication in tests?"

**Answer:**
- **Unit/Component tests**: Mock the auth module (`jest.mock('@/auth')`)
- **E2E tests**: Use test accounts, set cookies via fixtures
- **API tests**: Include auth headers, mock session

Never use production credentials in tests.

---

## Common Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| Testing implementation | Brittle tests | Test behavior instead |
| No mocks for external services | Slow, flaky tests | Use MSW for API mocks |
| E2E for everything | Slow CI, hard to maintain | Use testing pyramid |
| No error case testing | Missing edge cases | Test error paths |
| Snapshot overuse | Tests pass without meaning | Use sparingly |
| Shared test state | Flaky tests | Reset state between tests |
