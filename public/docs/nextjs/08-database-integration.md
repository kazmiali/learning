# Database Integration & ORMs

> "Data is a precious thing and will last longer than the systems themselves." — Tim Berners-Lee

Next.js with the App Router enables direct database access in Server Components, eliminating the need for separate API layers. Understanding how to properly integrate databases, manage connections, and optimize queries is essential for production applications.

---

## Professional Definition

| Concept | Definition | Why Seniors Care |
|---------|------------|------------------|
| Direct DB Access | Query databases directly in Server Components | No API middleman, simpler architecture |
| Connection Pooling | Reusing database connections | Avoid connection exhaustion in serverless |
| ORM (Object-Relational Mapping) | Map database tables to code objects | Type safety, migrations, easier queries |
| Query Builder | Programmatic SQL construction | More control than ORM, less raw SQL |
| Edge-Compatible DBs | Databases with HTTP APIs | Work in Edge runtime |

---

## Simple Explanation (Feynman Backpack Edition)

Imagine a library system:

1. **Direct DB Access** = The librarian (Server Component) walks directly to the shelves (database) instead of calling another librarian (API).

2. **Connection Pooling** = The library has 10 check-out counters. Instead of opening/closing them for each visitor, keep them ready for the next person.

3. **ORM** = A catalog system. Instead of memorizing shelf locations, look up "Book by Author" and the system finds it.

4. **Edge DB** = A network of mini-libraries. Visitors can check availability at the nearest location instead of calling headquarters.

---

## Database Options

### Comparison

| Database | Type | Edge Compatible | Best For |
|----------|------|-----------------|----------|
| PostgreSQL | Relational | Via HTTP (Neon, Supabase) | Complex queries, ACID |
| MySQL | Relational | Via HTTP (PlanetScale) | Web applications |
| MongoDB | Document | Via HTTP (Atlas) | Flexible schemas |
| SQLite | Relational | No (local file) | Development, embedded |
| Redis | Key-Value | Via HTTP (Upstash) | Caching, sessions |
| Prisma Accelerate | Any SQL | Yes | Prisma with edge |

### Serverless-Friendly Options

| Service | Database | Edge Support | Notes |
|---------|----------|--------------|-------|
| Neon | PostgreSQL | Yes | Branching, autoscaling |
| PlanetScale | MySQL | Yes | Branching, sharding |
| Supabase | PostgreSQL | Yes | Open source Firebase |
| Turso | SQLite | Yes | Distributed SQLite |
| Upstash | Redis | Yes | Pay-per-request |
| MongoDB Atlas | MongoDB | Yes | Serverless clusters |

---

## Prisma (Recommended ORM)

### Setup

```bash
npm install prisma @prisma/client
npx prisma init
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

### Singleton Pattern (Crucial for Next.js)

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### Migrations

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate client
npx prisma generate
```

---

## Using Prisma in Server Components

```tsx
// app/users/page.tsx
import prisma from '@/lib/prisma';

export default async function UsersPage() {
  // Direct database query in Server Component
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name} - {user._count.posts} posts
        </li>
      ))}
    </ul>
  );
}
```

### Dynamic Routes with Prisma

```tsx
// app/posts/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { name: true, email: true },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {post.author.name}</p>
      <div>{post.content}</div>
    </article>
  );
}

// Generate static params for SSG
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { id: true },
  });

  return posts.map((post) => ({
    id: post.id,
  }));
}
```

---

## Server Actions with Prisma

```typescript
// app/actions/posts.ts
'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const PostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
});

export async function createPost(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedFields = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, content } = validatedFields.data;

  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId: session.user.id,
    },
  });

  revalidatePath('/posts');
  redirect(`/posts/${post.id}`);
}

export async function updatePost(id: string, formData: FormData) {
  const session = await auth();
  
  // Check ownership
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post || post.authorId !== session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await prisma.post.update({
    where: { id },
    data: { title, content },
  });

  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePost(id: string) {
  const session = await auth();
  
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post || post.authorId !== session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await prisma.post.delete({
    where: { id },
  });

  revalidatePath('/posts');
  redirect('/posts');
}
```

---

## Caching Database Queries

### Using unstable_cache

```typescript
// lib/data/posts.ts
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

export const getPublishedPosts = unstable_cache(
  async () => {
    return prisma.post.findMany({
      where: { published: true },
      include: {
        author: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['published-posts'], // Cache key
  {
    revalidate: 3600, // 1 hour
    tags: ['posts'], // For on-demand revalidation
  }
);

export const getPostById = unstable_cache(
  async (id: string) => {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { name: true, email: true } },
      },
    });
  },
  ['post-by-id'],
  {
    revalidate: 3600,
    tags: ['posts'],
  }
);

// Usage in Server Component
export default async function PostsPage() {
  const posts = await getPublishedPosts();
  return <PostList posts={posts} />;
}
```

### Revalidating Cached Data

```typescript
// app/actions/posts.ts
'use server';

import { revalidateTag } from 'next/cache';

export async function createPost(formData: FormData) {
  // ... create post

  // Revalidate all cached posts
  revalidateTag('posts');
}
```

---

## Drizzle ORM (Type-Safe Alternative)

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

### Schema Definition

```typescript
// db/schema.ts
import { pgTable, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  role: roleEnum('role').default('USER'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false),
  authorId: text('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### Database Client

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

### Usage

```typescript
// app/users/page.tsx
import { db } from '@/db';
import { users, posts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function UsersPage() {
  const allUsers = await db.query.users.findMany({
    with: {
      posts: true,
    },
    orderBy: [desc(users.createdAt)],
    limit: 10,
  });

  // Or with raw SQL-like syntax
  const activeUsers = await db
    .select()
    .from(users)
    .where(eq(users.role, 'USER'))
    .limit(10);

  return (
    <ul>
      {allUsers.map((user) => (
        <li key={user.id}>
          {user.name} - {user.posts.length} posts
        </li>
      ))}
    </ul>
  );
}
```

---

## Edge-Compatible Databases

### Neon (Serverless PostgreSQL)

```typescript
// lib/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Works in Edge runtime!
export const runtime = 'edge';

export async function getUsers() {
  return db.select().from(users);
}
```

### PlanetScale (Serverless MySQL)

```typescript
// lib/db.ts
import { connect } from '@planetscale/database';
import { drizzle } from 'drizzle-orm/planetscale-serverless';

const connection = connect({
  url: process.env.DATABASE_URL,
});

export const db = drizzle(connection);
```

### Prisma with Accelerate (Edge)

```bash
npm install @prisma/extension-accelerate
```

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

export const prisma = new PrismaClient().$extends(withAccelerate());

// Enable caching
const posts = await prisma.post.findMany({
  cacheStrategy: {
    ttl: 60, // 60 seconds
  },
});
```

---

## Transaction Patterns

### Prisma Transactions

```typescript
// Create user with initial post atomically
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      email: 'john@example.com',
      name: 'John',
      password: hashedPassword,
    },
  });

  const post = await tx.post.create({
    data: {
      title: 'Welcome Post',
      content: 'This is my first post!',
      authorId: user.id,
    },
  });

  return { user, post };
});
```

### Interactive Transactions with Retry

```typescript
import prisma from '@/lib/prisma';

async function transferCredits(fromId: string, toId: string, amount: number) {
  return prisma.$transaction(
    async (tx) => {
      // Get sender with lock
      const sender = await tx.user.findUnique({
        where: { id: fromId },
      });

      if (!sender || sender.credits < amount) {
        throw new Error('Insufficient credits');
      }

      // Deduct from sender
      await tx.user.update({
        where: { id: fromId },
        data: { credits: { decrement: amount } },
      });

      // Add to receiver
      await tx.user.update({
        where: { id: toId },
        data: { credits: { increment: amount } },
      });

      return { success: true };
    },
    {
      maxWait: 5000, // Wait max 5s for transaction slot
      timeout: 10000, // Transaction timeout 10s
      isolationLevel: 'Serializable', // Strongest isolation
    }
  );
}
```

---

## Optimistic Updates Pattern

```tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { togglePostLike } from '@/app/actions/posts';

interface Post {
  id: string;
  title: string;
  likes: number;
  isLiked: boolean;
}

export function PostCard({ post }: { post: Post }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticPost, setOptimisticPost] = useOptimistic(post);

  function handleLike() {
    startTransition(async () => {
      // Optimistic update
      setOptimisticPost({
        ...optimisticPost,
        likes: optimisticPost.isLiked
          ? optimisticPost.likes - 1
          : optimisticPost.likes + 1,
        isLiked: !optimisticPost.isLiked,
      });

      // Actual mutation
      await togglePostLike(post.id);
    });
  }

  return (
    <div>
      <h2>{optimisticPost.title}</h2>
      <button onClick={handleLike} disabled={isPending}>
        {optimisticPost.isLiked ? '❤️' : '🤍'} {optimisticPost.likes}
      </button>
    </div>
  );
}
```

---

## Pagination Patterns

### Offset-Based Pagination

```typescript
// lib/data/posts.ts
import prisma from '@/lib/prisma';

export async function getPaginatedPosts(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    }),
    prisma.post.count({ where: { published: true } }),
  ]);

  return {
    posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: skip + posts.length < total,
    },
  };
}
```

### Cursor-Based Pagination (Better for Large Datasets)

```typescript
// lib/data/posts.ts
export async function getPostsCursor(cursor?: string, limit: number = 10) {
  const posts = await prisma.post.findMany({
    where: { published: true },
    take: limit + 1, // Fetch one extra to check if more exist
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0, // Skip the cursor itself
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true } } },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}
```

### Usage in Server Component

```tsx
// app/posts/page.tsx
import { getPaginatedPosts } from '@/lib/data/posts';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PostsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1');
  const { posts, pagination } = await getPaginatedPosts(page);

  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>

      <nav>
        {page > 1 && (
          <Link href={`/posts?page=${page - 1}`}>Previous</Link>
        )}
        <span>Page {page} of {pagination.totalPages}</span>
        {pagination.hasMore && (
          <Link href={`/posts?page=${page + 1}`}>Next</Link>
        )}
      </nav>
    </div>
  );
}
```

---

## Senior-Level Interview Prompts & Answers

### 1. "How do you handle database connections in serverless Next.js?"

**Answer:** Serverless creates new instances per request, risking connection exhaustion. Solutions:
1. **Connection pooling**: Use PgBouncer, Prisma Accelerate, or managed services
2. **Singleton pattern**: Store client on globalThis to reuse across hot reloads
3. **Edge-compatible DBs**: Neon, PlanetScale use HTTP APIs, avoiding connection limits
4. **Connection limits**: Configure `connection_limit` in Prisma

### 2. "When would you use Prisma vs Drizzle?"

**Answer:**
- **Prisma**: Best DX, declarative schema, migrations, studio GUI. Larger bundle, some performance overhead.
- **Drizzle**: SQL-like syntax, smaller bundle, faster queries, better for edge. More manual setup.

Choose Prisma for rapid development, Drizzle for performance-critical or edge-first apps.

### 3. "How do you handle database queries in Server Components vs Route Handlers?"

**Answer:**
- **Server Components**: Direct queries for page data. Cached automatically, use `unstable_cache` for control.
- **Route Handlers**: For external API consumers, webhooks, or when you need HTTP semantics.
- **Server Actions**: For mutations triggered by UI.

I prefer Server Components when possible—simpler architecture, better caching.

### 4. "How do you optimize database queries in Next.js?"

**Answer:**
1. **Select only needed fields**: Reduce payload
2. **Include relations wisely**: Avoid N+1 with `include`
3. **Cache results**: `unstable_cache` with tags
4. **Parallel queries**: `Promise.all()` for independent data
5. **Cursor pagination**: For large datasets
6. **Database indexes**: On filtered/sorted columns

---

## Common Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| No singleton pattern | Connection pool exhaustion | Use globalThis pattern |
| N+1 queries | Slow page loads | Use `include` or batch loading |
| Querying in client components | Security risk, extra round trip | Query in Server Components |
| No input validation | SQL injection risk | Use Zod, Prisma parameterizes |
| No caching | Unnecessary DB load | Use `unstable_cache` with tags |
| Forgetting revalidation | Stale data after mutations | Call `revalidatePath/Tag` in actions |
