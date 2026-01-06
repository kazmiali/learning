# Performance Engineering & Testing React Apps

> “Make it work, make it right, make it fast — in that order.” — Kent Beck

React performance isn’t about micro-optimizations; it’s about making intelligent trade-offs between render cost, network cost, and perceived latency. Pair that with trustworthy tests and you can ship features confidently.

---

## Profiling Mindset

1. **Measure before optimizing.**
2. **Optimize the highest leverage bottleneck (network, CPU, memory).**
3. **Verify the fix with the same tooling.**

### Essential Tools

| Tool | When to Use |
|------|-------------|
| React DevTools Profiler | Diagnose wasted renders, expensive components, lane priority. |
| Browser Performance tab | Measure scripting/layout/paint times, long tasks. |
| Lighthouse / WebPageTest | Lab metrics (LCP, CLS, TBT). |
| Custom metrics via Web Vitals | Real user monitoring (RUM). |

---

## Rendering Performance Patterns

1. **Split Components Strategically**
   - Move expensive subtrees behind `React.memo`.
   - Combine with `useMemo`/`useCallback` so child props remain stable.

```jsx
const Chart = React.memo(function Chart({ data }) {
  // heavy SVG work
});
```

2. **Virtualize Long Lists**
   - Use `react-window`/`react-virtualized` to render only visible rows.

3. **Avoid Unnecessary Context Updates**
   - Split providers or adopt selectors to limit re-renders.

4. **Lazy Load Routes and Heavy Widgets**
   - `const Settings = React.lazy(() => import("./Settings"));`
   - Wrap with `<Suspense fallback={<Spinner />}>`.

---

## Network & Asset Optimization

1. **Code Splitting:** Use dynamic imports per route or feature.
2. **Tree Shaking:** Keep libraries ES modules; prefer named imports.
3. **Image Strategy:** Serve responsive images (`srcset`, `sizes`), WebP/AVIF formats.
4. **HTTP Caching:** Leverage `Cache-Control`, ETags, service workers.
5. **Prefetching:** `rel="prefetch"` or frameworks’ router prefetch to warm caches.

---

## React 19 Compiler & Memoization

The upcoming React Compiler (currently opt-in) analyzes components to **auto-memoize**. Until it’s mainstream:

- Use `React.memo` for pure components receiving stable props.
- Combine with `useMemo`/`useCallback` only when prop identity affects child rendering.

Would-be pitfalls:

1. Memoizing everything leads to stale caches and harder debugging.
2. Memoization costs memory; only use where benchmarks show benefit.

---

## DevTools Workflow (Step-by-Step)

1. Open React DevTools Profiler.
2. Record interaction (typing, navigation).
3. Inspect “Commit” durations and flamegraph.
4. Identify components with large render times or frequent re-renders.
5. Apply targeted fixes (memoization, splitting, moving state).
6. Re-profile to confirm improvements.

---

## Testing Strategies

### 1. Unit Tests (Logic & Hooks)

- Prefer testing **pure functions** and custom hooks in isolation.
- Example (Vitest + RTL):

```tsx
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

test("increments count", () => {
  const { result } = renderHook(() => useCounter());
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

### 2. Component Tests

- Use React Testing Library to test components the way users interact.

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBox } from "./SearchBox";

test("calls onSearch", () => {
  const onSearch = vi.fn();
  render(<SearchBox onSearch={onSearch} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "react" } });
  expect(onSearch).toHaveBeenCalledWith("react");
});
```

### 3. Integration / End-to-End

- Cypress, Playwright, or Selenium to test full workflows.
- Keep them focused on critical user journeys (auth, checkout, settings).

---

## Testing Concurrent Features

1. **Suspense:** Use `await screen.findByText("Loaded")` to wait for async UI.
2. **Transitions:** Assert `isPending` indicators show/hide correctly.
3. **Server Actions:** Mock fetch/DB layer or use MSW to simulate network latency.

```tsx
await act(async () => {
  await startTransition(async () => {
    await submitAction();
  });
});
```

---

## Performance Anti-Patterns

1. **Over-fetching data** in multiple components without caching.
2. **Global state for everything** → causes global re-renders.
3. **Blocking synchronous loops** inside render (sorting/filtering huge arrays inline).
4. **Inline object literals** as props causing child re-renders.
5. **Untamed effects** that subscribe without cleanup → memory leaks.

---

## Observability & Monitoring

1. **Web Vitals instrumentation** (CLS, LCP, INP) using `web-vitals` package.
2. **Error boundary logging** (Sentry, LogRocket, Datadog) to capture component stack traces.
3. **Custom performance marks**: `performance.mark("after-render");`.
4. **User timing API** to correlate React commits with backend traces.

---

## Accessibility & UX Perf

Performance includes inclusive design:

- Focus management after Suspense fallbacks complete.
- Reduce motion or respect `prefers-reduced-motion`.
- Announce loading states via ARIA live regions.
- Ensure keyboard navigation still works under transitions.

---

## Interview Talking Points

| Question | High-Signal Answer |
|----------|--------------------|
| “How do you track React performance regressions?” | Baseline with DevTools & Web Vitals, automate thresholds (Lighthouse CI), alert on RUM metrics. |
| “What causes unnecessary re-renders?” | Changing props identity (inline functions/objects), context updates, lack of memoization on pure components, state stored too high. |
| “How do you test Suspense boundaries?” | Render with fallback, await resolved state via async utilities, assert fallback presence and final UI. |
| “When do you use `React.memo`?” | For pure components with expensive renders or when child re-renders dominate; pair with stable props (memoized callbacks/values). |

---

## Checklist

- [ ] Performance measured before/after optimizations using the same tool.
- [ ] Critical components profiled and heavy paths memoized or virtualized.
- [ ] Data fetching centralized to avoid duplicate requests (React Query/Relay).
- [ ] Tests cover logic, rendering, and high-level flows; concurrent features validated.
- [ ] Observability hooks (Web Vitals, error boundaries) in place for production monitoring.

Performance + testing discipline = reliable, delightful user experiences that scale with your team.
