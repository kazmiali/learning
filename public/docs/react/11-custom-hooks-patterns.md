# Custom Hooks: Patterns & Best Practices

> "The key to good software design is recognizing when to stop." — John Ousterhout

Custom hooks are React's answer to code reuse. They let you extract component logic into reusable functions while maintaining the full power of React's hook system.

---

## What Are Custom Hooks?

Custom hooks are JavaScript functions that:
1. Start with the word `use`
2. Can call other hooks
3. Extract reusable stateful logic

```tsx
// Custom hook - extracts logic
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// Usage - clean components
function ResponsiveLayout() {
  const { width } = useWindowSize();
  return width > 768 ? <DesktopLayout /> : <MobileLayout />;
}
```

---

## Naming Conventions

| Pattern | Example | Use Case |
|---------|---------|----------|
| `use[Resource]` | `useUser`, `usePosts` | Data fetching |
| `use[Action]` | `useToggle`, `useCounter` | State actions |
| `use[Feature]` | `useAuth`, `useTheme` | Feature logic |
| `use[Event]` | `useOnClickOutside`, `useKeyPress` | Event handling |
| `use[Measurement]` | `useWindowSize`, `useIntersection` | DOM measurements |
| `use[State]` | `useLocalStorage`, `useSessionStorage` | Persistent state |

---

## Essential Custom Hooks

### 1. useToggle

```tsx
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse, setValue };
}

// Usage
function Modal() {
  const { value: isOpen, toggle, setFalse: close } = useToggle();

  return (
    <>
      <button onClick={toggle}>Toggle Modal</button>
      {isOpen && (
        <div className="modal">
          <button onClick={close}>Close</button>
        </div>
      )}
    </>
  );
}
```

### 2. useLocalStorage

```tsx
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Sync with other tabs/windows
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue));
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// Usage
function Settings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const [fontSize, setFontSize] = useLocalStorage("fontSize", 16);

  return (
    <div>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Current: {theme}
      </button>
      <input
        type="range"
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
      />
    </div>
  );
}
```

### 3. useFetch

```tsx
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseFetchOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

function useFetch<T>(url: string, options: UseFetchOptions = {}) {
  const { immediate = true, onSuccess, onError } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const fetchData = useCallback(async () => {
    const controller = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
      onSuccess?.(data);

      return data;
    } catch (error) {
      if ((error as Error).name === "AbortError") return;

      const err = error instanceof Error ? error : new Error("Unknown error");
      setState({ data: null, loading: false, error: err });
      onError?.(err);
    }

    return () => controller.abort();
  }, [url, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, refetch } = useFetch<User>(
    `/api/users/${userId}`
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (!user) return null;

  return <ProfileCard user={user} />;
}
```

### 4. useDebounce

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Debounced callback version
function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args) => {
      const timer = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
      return () => clearTimeout(timer);
    }) as T,
    [delay]
  );
}

// Usage
function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### 5. useOnClickOutside

```tsx
function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    }

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// Usage
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <ul className="dropdown-menu">
          <li>Option 1</li>
          <li>Option 2</li>
        </ul>
      )}
    </div>
  );
}
```

### 6. useIntersectionObserver

```tsx
interface UseIntersectionOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

function useIntersectionObserver(
  ref: RefObject<Element>,
  options: UseIntersectionOptions = {}
) {
  const { threshold = 0, root = null, rootMargin = "0px", triggerOnce = false } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (triggerOnce && hasTriggered.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && triggerOnce) {
          hasTriggered.current = true;
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [ref, threshold, root, rootMargin, triggerOnce]);

  return { entry, isIntersecting };
}

// Usage - Lazy loading images
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const { isIntersecting } = useIntersectionObserver(imgRef, {
    triggerOnce: true,
    rootMargin: "100px",
  });

  return (
    <img
      ref={imgRef}
      src={isIntersecting ? src : "/placeholder.jpg"}
      alt={alt}
    />
  );
}

// Usage - Infinite scroll
function InfiniteList() {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(loadMoreRef);

  useEffect(() => {
    if (isIntersecting) {
      loadMoreItems();
    }
  }, [isIntersecting]);

  return (
    <div>
      {items.map((item) => (
        <Item key={item.id} data={item} />
      ))}
      <div ref={loadMoreRef}>Loading more...</div>
    </div>
  );
}
```

### 7. useKeyPress

```tsx
function useKeyPress(targetKey: string) {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === targetKey) {
        setKeyPressed(true);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [targetKey]);

  return keyPressed;
}

// Advanced version with modifiers
interface KeyCombo {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

function useHotkey(combo: KeyCombo, callback: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const matchesKey = event.key.toLowerCase() === combo.key.toLowerCase();
      const matchesCtrl = combo.ctrl ? event.ctrlKey : true;
      const matchesShift = combo.shift ? event.shiftKey : true;
      const matchesAlt = combo.alt ? event.altKey : true;
      const matchesMeta = combo.meta ? event.metaKey : true;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
        event.preventDefault();
        callback();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [combo, callback]);
}

// Usage
function App() {
  useHotkey({ key: "s", ctrl: true }, () => {
    saveDocument();
  });

  useHotkey({ key: "k", ctrl: true }, () => {
    openCommandPalette();
  });

  return <div>Press Ctrl+S to save</div>;
}
```

### 8. usePrevious

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Usage
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCount}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
```

### 9. useMediaQuery

```tsx
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    function handleChange(event: MediaQueryListEvent) {
      setMatches(event.matches);
    }

    // Modern browsers
    mediaQuery.addEventListener("change", handleChange);

    // Set initial value
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

// Predefined breakpoints
function useBreakpoints() {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return { isMobile, isTablet, isDesktop };
}

// Usage
function ResponsiveNav() {
  const { isMobile } = useBreakpoints();

  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

### 10. useAsync

```tsx
type AsyncState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "pending"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: Error };

function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  const run = useCallback(async (promise: Promise<T>) => {
    setState({ status: "pending", data: null, error: null });

    try {
      const data = await promise;
      setState({ status: "success", data, error: null });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      setState({ status: "error", data: null, error: err });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", data: null, error: null });
  }, []);

  return {
    ...state,
    isIdle: state.status === "idle",
    isPending: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    run,
    reset,
  };
}

// Usage
function CreateUser() {
  const { run, isPending, isError, error, data } = useAsync<User>();

  async function handleSubmit(formData: FormData) {
    try {
      await run(createUser(formData));
      // Navigate or show success
    } catch {
      // Error is already in state
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isPending}>
        {isPending ? "Creating..." : "Create User"}
      </button>
      {isError && <p className="error">{error?.message}</p>}
    </form>
  );
}
```

---

## Composing Hooks

Combine simple hooks to create powerful abstractions:

```tsx
// Combine multiple hooks
function useUser(userId: string) {
  const { data: user, loading, error, refetch } = useFetch<User>(
    `/api/users/${userId}`
  );

  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    `user-${userId}-prefs`,
    defaultPreferences
  );

  const prevUser = usePrevious(user);

  // Track when user changes
  useEffect(() => {
    if (user && prevUser && user.id !== prevUser.id) {
      analytics.track("user_switched", { from: prevUser.id, to: user.id });
    }
  }, [user, prevUser]);

  return {
    user,
    loading,
    error,
    refetch,
    preferences,
    updatePreferences: setPreferences,
  };
}
```

---

## Testing Custom Hooks

```tsx
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("should initialize with default value", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("should initialize with provided value", () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it("should increment", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("should decrement", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it("should reset to initial value", () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});

// Testing async hooks
describe("useFetch", () => {
  it("should fetch data", async () => {
    const mockData = { id: 1, name: "Test" };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useFetch("/api/test"));

    // Initial loading state
    expect(result.current.loading).toBe(true);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });
});
```

---

## Best Practices

### 1. Single Responsibility

```tsx
// ❌ Too many responsibilities
function useEverything() {
  const user = useUser();
  const theme = useTheme();
  const notifications = useNotifications();
  const analytics = useAnalytics();
  // ...mixing unrelated concerns
}

// ✅ Single responsibility
function useAuth() { /* auth logic only */ }
function useTheme() { /* theme logic only */ }
function useNotifications() { /* notifications only */ }
```

### 2. Return Stable References

```tsx
// ❌ Creates new function every render
function useCounter() {
  const [count, setCount] = useState(0);
  return {
    count,
    increment: () => setCount((c) => c + 1), // New reference each render!
  };
}

// ✅ Stable references with useCallback
function useCounter() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  return { count, increment };
}
```

### 3. Handle Cleanup

```tsx
// ❌ No cleanup - memory leak
function useEventListener(event: string, handler: () => void) {
  useEffect(() => {
    window.addEventListener(event, handler);
    // Missing cleanup!
  }, [event, handler]);
}

// ✅ Proper cleanup
function useEventListener(event: string, handler: () => void) {
  useEffect(() => {
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, handler]);
}
```

### 4. Accept Options Object for Flexibility

```tsx
// ❌ Many positional parameters
function useFetch(url, method, headers, cache, timeout) { }

// ✅ Options object with defaults
interface UseFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  cache?: RequestCache;
  timeout?: number;
}

function useFetch(url: string, options: UseFetchOptions = {}) {
  const { method = "GET", headers = {}, cache = "default", timeout = 5000 } = options;
  // ...
}
```

---

## Interview Questions

### Q1: What makes a function a custom hook?
**A:** A custom hook is a function that starts with `use` and can call other hooks. The `use` prefix tells React's linter to check for hooks rules violations.

### Q2: When should you extract logic into a custom hook?
**A:** When the same stateful logic is used in multiple components, when a component has complex logic that can be isolated, or when you want to test logic separately from UI.

### Q3: How do you test custom hooks?
**A:** Use `renderHook` from `@testing-library/react`. Wrap state updates in `act()`. For async hooks, use `waitFor` to wait for state changes.

### Q4: How do you share state between components using hooks?
**A:** Custom hooks don't share state—each call creates independent state. To share state, lift it to a common parent, use Context, or use external state management (Zustand, Redux).

### Q5: What's the difference between a custom hook and a regular function?
**A:** Custom hooks can call other hooks (useState, useEffect, etc.), regular functions cannot. Custom hooks follow the rules of hooks (call order, top level only).
