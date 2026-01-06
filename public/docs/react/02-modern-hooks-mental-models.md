# Modern Hooks & Mental Models

> “If you can’t explain it simply, you don’t understand it well enough.” — Albert Einstein

Hooks are not magic. They’re deterministic state machines keyed by **call order** inside a component. Treat them like Lego bricks: predictable coupling, sharp edges when misused, and endless composition once you respect the rules.

---

## Hooks Rules Refresher

1. **Call hooks unconditionally at the top level of React functions.**
2. **Never call hooks inside loops, conditions, or nested functions.**
3. **Only call hooks from React function components or custom hooks.**

React’s internal dispatcher uses a pointer (`currentHook`) that walks the hook list during render. Break the order, and React reads stale state slots.

---

## useState vs useReducer

| Aspect | `useState` | `useReducer` |
|--------|------------|--------------|
| Ideal for | Local, scalar values | Complex transitions, multiple fields |
| Updates | Replace value | Dispatch action processed by reducer |
| Debugging | Simple but scattered | Centralized state graph |

```jsx
// useState
const [count, setCount] = useState(0);

// useReducer
const [state, dispatch] = useReducer((state, action) => {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
}, { count: 0 });
```

**Senior tip:** Prefer `useReducer` once you need *transactional updates* (update A then B based on the same event). It guarantees referential stability for dispatch, simplifying prop drilling.

---

## useEffect: Sync vs Async Mental Model

```jsx
useEffect(() => {
  const subscription = api.subscribe(id);
  return () => subscription.unsubscribe();
}, [id]);
```

1. React renders → compares dependency array.
2. If array changed, previous effect cleanup runs *after* commit.
3. React then schedules the new effect.

### Common Pitfalls

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Infinite loop | Effect updates state that’s in its own deps. | Move state derivation into reducer or conditionally set. |
| Stale closure | Effect reads stale props/state because dependencies missing. | Include all referenced values; use refs for mutable escape hatches. |
| Double execution (StrictMode) | Intentional dev-only double-invoke to flush unsafe effects. | Make effects idempotent; avoid relying on mount counts. |

---

## useLayoutEffect vs useInsertionEffect

| Hook | When It Runs | Use Cases |
|------|--------------|-----------|
| `useLayoutEffect` | After DOM mutations, before the browser paints. | Measuring layout, synchronizing scroll. |
| `useInsertionEffect` (React 18) | Before DOM mutations, safe for injecting styles. | CSS-in-JS libraries (Emotion, styled-components) to avoid flicker. |

**Rule:** If you can do it in `useEffect`, do it there. Reserve layout/insertion hooks for unavoidable layout coupling.

---

## Memoization Hooks (useMemo, useCallback)

These cache values between renders. They are not performance silver bullets; they prevent referential churn.

```jsx
const expensiveValue = useMemo(() => compute(items), [items]);
const onSelect = useCallback((id) => setActive(id), []);
```

**Guidelines:**

1. Use them when a child component depends on referential equality (`React.memo`, dependency arrays).
2. Don’t memoize primitives or cheap calculations.
3. Always include dependencies; React 19 Compiler leverages them to skip renders.

---

## useRef: Mutable Cells Without Re-Renders

```jsx
const latestValue = useRef();
useEffect(() => {
  latestValue.current = props.value;
});
```

- Updating `.current` does NOT trigger a render.
- Stable identity across renders, ideal for storing DOM nodes or in-flight state (e.g., abort controllers).

**Interview nugget:** `useRef` ≈ `{ current: initialValue }`, but React ensures the object persists. Use it for *imperative escape hatches*, not as a data store.

---

## Custom Hooks (Feynman Recipe)

1. Extract all hook logic into `useSomething`.
2. Return values (data, setters, refs) explicitly.
3. Compose like Lego; each custom hook is just a function that obeys the rules.

```jsx
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handle = () => setOnline(navigator.onLine);
    window.addEventListener("online", handle);
    window.addEventListener("offline", handle);
    return () => {
      window.removeEventListener("online", handle);
      window.removeEventListener("offline", handle);
    };
  }, []);
  return online;
}
```

---

## useContext & Selectors

Context re-renders every consumer on change. To scale:

```jsx
const ThemeContext = React.createContext();

function useTheme(selector) {
  const value = useContext(ThemeContext);
  return selector(value);
}

const color = useTheme((theme) => theme.primary);
```

Libraries like `use-context-selector` (React 18+) patch React to subscribe to slices, reducing work. React is experimenting with built-in context selectors, but for now, custom hooks are your best tool.

---

## useTransition & useDeferredValue (Concurrent Hooks)

```jsx
const [isPending, startTransition] = useTransition();

function handleInput(event) {
  const nextValue = event.target.value;
  setInput(nextValue); // urgent
  startTransition(() => {
    // non-urgent (e.g., filtering large list)
    setQuery(nextValue);
  });
}
```

- **useTransition**: Mark updates as interruptible. React keeps the UI responsive while rendering expensive views.
- **useDeferredValue**: Accepts a value and returns a deferred version, syncing lazily.

React 19 enables async transitions: `startTransition(async () => { const data = await action(); setResult(data); });`

---

## Suspense Hooks

| Hook | Description |
|------|-------------|
| `use` (React 19+) | Await promises or read context directly inside components (client + RSC). |
| `use` with promises | `const data = use(promise);` Suspends until resolved, then returns the value. |
| `use` with context | `const theme = use(ThemeContext);` Reads context, can be called conditionally. |

When a component suspends, React shows the nearest `<Suspense fallback>` UI while continuing work. Combine with `useTransition` for buttery interactions.

---

## Senior-Level Scenarios

1. **“Why did the effect run twice in development?”**
   - Explain StrictMode double-invoke for mounts, how to design idempotent effects, and why production won’t double-run.
2. **“How do you prevent stale closures?”**
   - Include all dependencies; if dependency is intentionally stable (e.g., event callbacks), wrap it in `useCallback` or store in refs.
3. **“When to use refs over state?”**
   - When you need mutable values that don’t trigger renders (scroll positions, websocket instances, stable timers).
4. **“How do you cancel async work inside useEffect?”**
   - Guard with abort controllers or a `let active = true` flag; clean up in the effect cleanup.

---

## Checklist

- [ ] Hooks always executed in the same order.
- [ ] Effects declare every used value; refs for mutable escapes.
- [ ] Memoization used only where referential stability matters.
- [ ] Context updates scoped via selectors or split providers.
- [ ] Concurrent hooks (`useTransition`, `useDeferredValue`) used for expensive UI branches.

Once these become muscle memory, you can diagnose any hook bug in minutes, not hours.
