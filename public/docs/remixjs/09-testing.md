# Remix Testing Strategies

> "Code without tests is broken by design." — Jacob Kaplan-Moss

Testing Remix applications requires understanding its server-client architecture. Loaders and actions are pure server functions—easy to unit test. Components receive data via hooks—requiring integration testing with the Remix context.

---

## Professional Definition

| Test Type | Definition | When to Use |
|-----------|------------|-------------|
| Unit Tests | Test isolated functions | Loaders, actions, utilities |
| Component Tests | Test UI with mocked data | Individual route components |
| Integration Tests | Test full route behavior | Route → Loader → Component flow |
| E2E Tests | Test real browser behavior | Critical user journeys |

---

## Testing Setup

### Installing Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @remix-run/testing jsdom happy-dom
npm install -D msw @mswjs/data  # For API mocking
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["./app/**/*.test.{ts,tsx}", "./tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules", "tests/setup.ts"],
    },
  },
});
```

### Test Setup File

```typescript
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// MSW setup
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## Unit Testing Loaders & Actions

Loaders and actions are pure server functions—test them like any async function:

### Testing a Loader

```typescript
// app/routes/users.tsx
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  
  const users = await prisma.user.findMany({
    where: {
      name: { contains: search, mode: "insensitive" },
    },
    skip: (page - 1) * 10,
    take: 10,
    select: { id: true, name: true, email: true },
  });
  
  return json({ users, page, search });
}
```

```typescript
// app/routes/users.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader } from "./users";

// Mock Prisma
vi.mock("~/utils/db.server", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "~/utils/db.server";

describe("Users Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it("returns users with default pagination", async () => {
    const mockUsers = [
      { id: "1", name: "Alice", email: "alice@test.com" },
      { id: "2", name: "Bob", email: "bob@test.com" },
    ];
    
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);
    
    const request = new Request("http://localhost:3000/users");
    const response = await loader({ request, params: {}, context: {} });
    const data = await response.json();
    
    expect(data.users).toEqual(mockUsers);
    expect(data.page).toBe(1);
    expect(data.search).toBe("");
    
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { name: { contains: "", mode: "insensitive" } },
      skip: 0,
      take: 10,
      select: { id: true, name: true, email: true },
    });
  });
  
  it("handles search parameter", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    
    const request = new Request("http://localhost:3000/users?search=alice");
    await loader({ request, params: {}, context: {} });
    
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { contains: "alice", mode: "insensitive" } },
      })
    );
  });
  
  it("handles pagination", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    
    const request = new Request("http://localhost:3000/users?page=3");
    const response = await loader({ request, params: {}, context: {} });
    const data = await response.json();
    
    expect(data.page).toBe(3);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20 })
    );
  });
});
```

### Testing an Action

```typescript
// app/routes/posts.new.tsx
import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { requireUser } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  
  const title = formData.get("title");
  const content = formData.get("content");
  
  const errors: Record<string, string> = {};
  
  if (!title || typeof title !== "string" || title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  }
  
  if (!content || typeof content !== "string" || content.length < 10) {
    errors.content = "Content must be at least 10 characters";
  }
  
  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }
  
  const post = await prisma.post.create({
    data: {
      title: title as string,
      content: content as string,
      authorId: user.id,
    },
  });
  
  return redirect(`/posts/${post.id}`);
}
```

```typescript
// app/routes/posts.new.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { action } from "./posts.new";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  prisma: {
    post: { create: vi.fn() },
  },
}));

import { requireUser } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

function createFormRequest(data: Record<string, string>) {
  const formData = new URLSearchParams(data);
  return new Request("http://localhost:3000/posts/new", {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

describe("Create Post Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test User",
      role: "USER",
    });
  });
  
  it("validates required fields", async () => {
    const request = createFormRequest({ title: "", content: "" });
    const response = await action({ request, params: {}, context: {} });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.errors.title).toBeDefined();
    expect(data.errors.content).toBeDefined();
  });
  
  it("validates minimum length", async () => {
    const request = createFormRequest({ title: "Hi", content: "Short" });
    const response = await action({ request, params: {}, context: {} });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.errors.title).toContain("at least 3 characters");
    expect(data.errors.content).toContain("at least 10 characters");
  });
  
  it("creates post and redirects on success", async () => {
    vi.mocked(prisma.post.create).mockResolvedValue({
      id: "post-123",
      title: "Test Post",
      content: "This is a test post content",
      authorId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const request = createFormRequest({
      title: "Test Post",
      content: "This is a test post content",
    });
    
    const response = await action({ request, params: {}, context: {} });
    
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/posts/post-123");
    
    expect(prisma.post.create).toHaveBeenCalledWith({
      data: {
        title: "Test Post",
        content: "This is a test post content",
        authorId: "user-1",
      },
    });
  });
  
  it("requires authentication", async () => {
    vi.mocked(requireUser).mockRejectedValue(
      new Response("Unauthorized", { status: 401 })
    );
    
    const request = createFormRequest({
      title: "Test",
      content: "Content here",
    });
    
    await expect(
      action({ request, params: {}, context: {} })
    ).rejects.toThrow();
  });
});
```

---

## Component Testing with createRemixStub

`@remix-run/testing` provides `createRemixStub` to test components within Remix context:

```typescript
// app/routes/posts._index.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import PostsIndex, { loader } from "./posts._index";

describe("Posts Index", () => {
  it("renders list of posts", async () => {
    const mockPosts = [
      { id: "1", title: "First Post", createdAt: "2024-01-01" },
      { id: "2", title: "Second Post", createdAt: "2024-01-02" },
    ];
    
    const RemixStub = createRemixStub([
      {
        path: "/posts",
        Component: PostsIndex,
        loader() {
          return { posts: mockPosts };
        },
      },
    ]);
    
    render(<RemixStub initialEntries={["/posts"]} />);
    
    await waitFor(() => {
      expect(screen.getByText("First Post")).toBeInTheDocument();
      expect(screen.getByText("Second Post")).toBeInTheDocument();
    });
  });
  
  it("shows empty state when no posts", async () => {
    const RemixStub = createRemixStub([
      {
        path: "/posts",
        Component: PostsIndex,
        loader() {
          return { posts: [] };
        },
      },
    ]);
    
    render(<RemixStub initialEntries={["/posts"]} />);
    
    await waitFor(() => {
      expect(screen.getByText("No posts found")).toBeInTheDocument();
    });
  });
  
  it("renders error boundary on loader error", async () => {
    const RemixStub = createRemixStub([
      {
        path: "/posts",
        Component: PostsIndex,
        ErrorBoundary: () => <div>Something went wrong</div>,
        loader() {
          throw new Response("Failed to load posts", { status: 500 });
        },
      },
    ]);
    
    render(<RemixStub initialEntries={["/posts"]} />);
    
    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });
});
```

### Testing Forms and Actions

```typescript
// app/routes/contact.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRemixStub } from "@remix-run/testing";
import Contact from "./contact";

describe("Contact Form", () => {
  it("submits form and shows success message", async () => {
    const user = userEvent.setup();
    let submittedData: FormData | null = null;
    
    const RemixStub = createRemixStub([
      {
        path: "/contact",
        Component: Contact,
        action: async ({ request }) => {
          submittedData = await request.formData();
          return { success: true };
        },
      },
    ]);
    
    render(<RemixStub initialEntries={["/contact"]} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });
    
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Message"), "Hello!");
    await user.click(screen.getByRole("button", { name: "Send" }));
    
    await waitFor(() => {
      expect(screen.getByText("Message sent!")).toBeInTheDocument();
    });
    
    expect(submittedData?.get("email")).toBe("test@example.com");
    expect(submittedData?.get("message")).toBe("Hello!");
  });
  
  it("displays validation errors", async () => {
    const user = userEvent.setup();
    
    const RemixStub = createRemixStub([
      {
        path: "/contact",
        Component: Contact,
        action: async () => {
          return {
            errors: { email: "Invalid email address" },
          };
        },
      },
    ]);
    
    render(<RemixStub initialEntries={["/contact"]} />);
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole("button", { name: "Send" }));
    
    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });
});
```

---

## Integration Testing with MSW

Mock Service Worker (MSW) intercepts real network requests:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);
  }),
  
  http.post("/api/users", async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      id: "3",
      ...data,
    }, { status: 201 });
  }),
  
  http.get("/api/posts/:id", ({ params }) => {
    if (params.id === "not-found") {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      id: params.id,
      title: `Post ${params.id}`,
    });
  }),
];
```

```typescript
// tests/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

### Using MSW in Tests

```typescript
// app/routes/api-test.test.ts
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../tests/mocks/server";

describe("API Integration", () => {
  it("handles successful response", async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Alice");
  });
  
  it("handles custom response for specific test", async () => {
    // Override handler for this test only
    server.use(
      http.get("/api/users", () => {
        return HttpResponse.json([
          { id: "1", name: "Custom User" },
        ]);
      })
    );
    
    const response = await fetch("/api/users");
    const data = await response.json();
    
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Custom User");
  });
  
  it("handles error responses", async () => {
    server.use(
      http.get("/api/users", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    
    const response = await fetch("/api/users");
    expect(response.status).toBe(500);
  });
});
```

---

## E2E Testing with Playwright

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("user can login", async ({ page }) => {
    await page.goto("/login");
    
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome");
  });
  
  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL("/login");
    await expect(page.locator(".error-message")).toContainText(
      "Invalid email or password"
    );
  });
  
  test("redirects to login when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard");
    
    await expect(page).toHaveURL(/\/login\?redirectTo/);
  });
});

test.describe("Form Submission", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });
  
  test("creates a new post", async ({ page }) => {
    await page.goto("/posts/new");
    
    await page.fill('input[name="title"]', "My New Post");
    await page.fill('textarea[name="content"]', "This is the content");
    await page.click('button[type="submit"]');
    
    // Should redirect to post detail page
    await expect(page).toHaveURL(/\/posts\/[\w-]+$/);
    await expect(page.locator("h1")).toContainText("My New Post");
  });
  
  test("shows validation errors", async ({ page }) => {
    await page.goto("/posts/new");
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator(".error")).toBeVisible();
  });
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Testing Utilities

### Custom Render with Context

```typescript
// tests/utils.tsx
import { createRemixStub } from "@remix-run/testing";
import { render } from "@testing-library/react";

export function renderWithRemix(
  Component: React.ComponentType,
  {
    path = "/",
    loader,
    action,
    initialEntries = ["/"],
    ...options
  }: {
    path?: string;
    loader?: () => unknown;
    action?: ({ request }: { request: Request }) => unknown;
    initialEntries?: string[];
  } = {}
) {
  const RemixStub = createRemixStub([
    {
      path,
      Component,
      loader,
      action,
    },
  ]);
  
  return render(<RemixStub initialEntries={initialEntries} />, options);
}
```

### Factory Functions for Test Data

```typescript
// tests/factories.ts
import { faker } from "@faker-js/faker";

export function createUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: "USER" as const,
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createPost(overrides = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    authorId: faker.string.uuid(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}
```

---

## Senior Interview Focus Points

1. **Why unit test loaders/actions separately from components?**
   - Loaders/actions are pure functions—easy to test in isolation
   - Faster tests, no DOM rendering
   - Clear separation of data logic from UI
   - Easier to mock dependencies

2. **What's the testing pyramid for Remix?**
   ```
         E2E (few)
        /        \
       Integration
      /            \
     Unit Tests (many)
   ```
   - Many unit tests for loaders/actions/utils
   - Integration tests for route behavior
   - Few E2E tests for critical paths

3. **How do you test authentication?**
   - Mock `requireUser` to return test users
   - Test redirect behavior for unauthenticated
   - E2E tests for full login flow

4. **MSW vs mocking modules?**
   - MSW: Tests real fetch behavior, catches integration issues
   - Module mocks: Faster, simpler, but less realistic
   - Use MSW for integration, mocks for unit tests

5. **Testing progressive enhancement?**
   - Test form works without JavaScript (E2E with JS disabled)
   - Test enhanced experience with JavaScript
   - Verify same outcome in both cases
