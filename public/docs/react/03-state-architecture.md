# State Architecture & Data Graphs

> "If you can't describe your architecture on a napkin, it's too complicated." — (Probably) Andrei Neagoie

React gives you many ways to hold state. Senior engineers treat state as a **graph**:

- **Local UI State** (component-level)
- **Shared UI State** (context, prop drilling)
- **Server Cache / Data Layer** (React Query, Relay, custom fetch + cache)
- **URL State** (router, search params)

Map each piece of information to exactly one source of truth. Everything else is derived.

---

## Types of State

| Type | Examples | Storage |
|------|----------|---------|
| Local | Form inputs, toggles | `useState`, `useReducer` |
| Derived | Filtered lists, totals | `useMemo`, selectors |
| Remote cache | API responses | SWR/React Query/Relay |
| Session | Auth token, feature flags | Context, cookies, secure storage |
| URL-driven | Pagination page, filters | `useSearchParams`, router state |

**Rule:** If data can be derived, do not duplicate it. Derived state drifts out of sync and causes ghost bugs.

---

## Lifting State Intelligently

```jsx
function Parent() {
  const [activeId, setActiveId] = useState(null);
  return (
    <>
      <Sidebar activeId={activeId} onSelect={setActiveId} />
      <Content activeId={activeId} />
    </>
  );
}
```

Guidelines:

1. Lift state to the closest common ancestor that needs to coordinate it.
2. If multiple trees far apart need access, consider shared context or an external store.
3. Avoid lifting if state is truly local (e.g., tooltip open state). Over-sharing kills encapsulation.

---

## Context Strategies

### 1. Split Contexts

```jsx
const ThemeValueContext = createContext();
const ThemeActionsContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeValueContext.Provider value={theme}>
      <ThemeActionsContext.Provider value={{ setTheme }}>
        {children}
      </ThemeActionsContext.Provider>
    </ThemeValueContext.Provider>
  );
}
```

Readers only subscribe to what they need.

### 2. Selector Pattern

Use `use-context-selector` or a custom hook to subscribe to slices.

```jsx
function useTheme(selector) {
  const context = useContext(ThemeContext);
  return selector(context);
}
```

---

## Server State vs Client State

| Aspect | Server State | Client State |
|--------|--------------|--------------|
| Ownership | Source of truth on server | Browser memory |
| Staleness | Needs revalidation | Always current |
| Lifespan | Cache policies, TTL | Controlled manually |
| Tools | React Query, Relay, RTK Query | `useState`, `useReducer`, Zustand |

**Senior mindset:** Never `setState` with server responses blindly. Use a data-fetching layer that tracks freshness, dedupes requests, and normalizes errors.

---

## React Query Example (Data Layer)

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then((res) => res.json()),
    staleTime: 60_000,
  });
}

function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
```

React Query handles caching, retries, background refetching, and deduplication—things `useEffect` + `fetch` can’t do elegantly.

---

## Derived State & Selectors

```jsx
const subtotal = useMemo(() => {
  return cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}, [cart.items]);
```

- Derive everything possible instead of duplicating.
- If derivation is expensive, memoize or precompute in reducers.
- In large stores (Redux/Zustand), use selectors with shallow equality to prevent unnecessary renders.

---

## State Normalization

Normalized state prevents diamond dependency problems.

```ts
type Entities = {
  users: Record<string, User>;
  posts: Record<string, Post>;
};
```

Libraries like Redux Toolkit and TanStack Query encourage normalized caches automatically.

---

## Forms & Validation Strategy

1. **Uncontrolled forms** for simple inputs, submit with `FormData`.
2. **Controlled fields** when:
   - Real-time validation
   - Dependent fields (currency conversions)
   - Autosave or analytics events per keystroke
3. Pair with schema validators (Zod, Valibot) for type-safe hydration.

```tsx
const schema = z.object({
  email: z.string().email(),
});

function ContactForm() {
  const [form, setForm] = useState({ email: "" });
  const parsed = schema.safeParse(form);
  return (
    <form>
      <input
        value={form.email}
        onChange={(e) => setForm({ email: e.target.value })}
      />
      {parsed.success ? null : <p>{parsed.error.issues[0].message}</p>}
    </form>
  );
}
```

---

## URL as a Data Source

Use the router to reflect state in the URL for shareable views.

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const sort = searchParams.get("sort") ?? "recent";

function handleSortChange(value) {
  setSearchParams({ sort: value });
}
```

Benefits:

1. Deep-linking and shareable state.
2. Back/forward navigation “just works”.
3. Server loaders (Remix/Next.js) can read params directly.

---

## External Stores (Zustand, Jotai)

When you need state shared outside React or across large subtrees, external stores provide escape hatches.

```ts
import { create } from "zustand";

const useBearStore = create((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}));

function Controls() {
  const increase = useBearStore((state) => state.increase);
  return <button onClick={increase}>One up</button>;
}
```

Zustand subscribes components to slices, minimizing re-renders without context gymnastics.

---

## Cross-Cutting Concerns

1. **Error boundaries**: Wrap stateful regions so failures don’t cascade.
2. **Suspense boundaries**: Place around async state to show fallbacks without freezing the whole tree.
3. **State persistence**: Use `useSyncExternalStore` or providers to hydrate from localStorage/IndexedDB carefully (watch hydration mismatches).

---

## Senior-Level Interview Topics

| Question | Exemplary Answer Outline |
|----------|-------------------------|
| “How do you avoid prop drilling hell?” | Lift state cautiously, use contexts split by concern, or adopt external stores with selectors. |
| “Explain server state vs client state.” | Server state has a canonical source on the server; needs cache invalidation, hydration strategies, deduping. Client state is managed locally and immediately consistent. |
| “When do you choose Redux/Zustand over Context?” | When you need time-travel debugging, predictable reducers, middlewares, or subscription granularity outside React’s render tree. |
| “How do you sync URL params with React state?” | Use router hooks to derive state from URL; updates push to history, enabling SSR preloading and shareable links. |

---

## Checklist

- [ ] Each piece of data mapped to a single authoritative store.
- [ ] Derived state computed via selectors/hooks, not duplicated.
- [ ] Context providers scoped and split to avoid unnecessary renders.
- [ ] Server data handled by a caching layer with invalidation rules.
- [ ] URL reflects navigation-critical state.

Organize state like a senior architect, and your team will stop firefighting phantom bugs caused by inconsistent data.
