# Performance & Best Practices

> "For a successful technology, reality must take precedence over public relations, for nature cannot be fooled." - Richard Feynman

Performance optimization is about measurement, not guesswork. This guide covers practical techniques for writing performant, secure, and maintainable JavaScript, with emphasis on understanding **when** and **why** to apply each technique.

---

## Memory Management

### Professional Definition

JavaScript uses automatic memory management via **garbage collection (GC)**. Memory is allocated when objects are created and automatically freed when they become **unreachable**. Memory leaks occur when references to unused objects are accidentally maintained, preventing garbage collection.

### Memory Lifecycle

```
1. Allocation    → Memory is reserved when you create values
2. Usage         → Reading/writing to the allocated memory
3. Release       → Memory is freed when no longer reachable
```

### Common Memory Leaks

| Leak Type | Cause | Solution |
|-----------|-------|----------|
| Global variables | Accidental global assignment | Use strict mode, lint rules |
| Forgotten timers | setInterval without clearInterval | Always clear timers |
| Detached DOM | References to removed elements | Null out references |
| Closures | Capturing large objects | Extract only needed values |
| Event listeners | Not removing listeners | Remove on cleanup |
| Caches | Unbounded growth | Use LRU cache or WeakMap |

### Code Examples

```javascript
// ❌ Memory Leak: Forgotten timer
const data = loadHugeData();
setInterval(() => processData(data), 1000);  // 'data' never released

// ✅ Fix: Store and clear timer
const data = loadHugeData();
const timerId = setInterval(() => processData(data), 1000);
// When done:
clearInterval(timerId);

// ❌ Memory Leak: Event listener not removed
class Component {
    constructor() {
        window.addEventListener('resize', this.handleResize);
    }
    
    handleResize = () => {
        // ...
    };
    
    // No cleanup!
}

// ✅ Fix: Remove listener on destroy
class Component {
    constructor() {
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }
    
    handleResize() { /* ... */ }
    
    destroy() {
        window.removeEventListener('resize', this.handleResize);
    }
}

// ❌ Memory Leak: Closure capturing large data
function createHandler() {
    const hugeData = new Array(1000000).fill('x');
    
    return function handler() {
        return 'clicked';  // hugeData still in closure scope!
    };
}

// ✅ Fix: Extract only needed values
function createHandler() {
    const hugeData = new Array(1000000).fill('x');
    const dataLength = hugeData.length;  // Extract what's needed
    
    return function handler() {
        return `clicked, had ${dataLength} items`;
    };
}

// ❌ Memory Leak: Detached DOM nodes
const elements = [];
function addElement() {
    const el = document.createElement('div');
    document.body.appendChild(el);
    elements.push(el);  // Reference stored
}

function removeElement() {
    const el = elements.pop();
    el.parentNode.removeChild(el);
    // 'elements' still has reference to removed el!
}

// ✅ Fix: Use WeakRef or clear references
function removeElement() {
    const el = elements.pop();
    el.parentNode?.removeChild(el);
    // Reference removed from array
}
```

### WeakMap and WeakSet for Cache

```javascript
// ✅ Automatic cleanup when keys are garbage collected
const cache = new WeakMap();

function expensiveOperation(obj) {
    if (cache.has(obj)) {
        return cache.get(obj);
    }
    
    const result = /* expensive computation */;
    cache.set(obj, result);
    return result;
}

// When 'obj' is no longer referenced elsewhere,
// both 'obj' and its cached value are garbage collected
```

---

## Code Optimization

### Avoiding Common Performance Pitfalls

#### 1. Consistent Object Shapes

```javascript
// ✅ Initialize all properties in constructor
class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z ?? 0;
    }
}

// ❌ Adding properties later breaks hidden class optimization
const p = new Point(1, 2);
p.color = 'red';  // Hidden class transition

// ❌ Different property orders create different hidden classes
const obj1 = { a: 1, b: 2 };
const obj2 = { b: 2, a: 1 };  // Different hidden class!
```

#### 2. Consistent Types

```javascript
// ✅ Functions with consistent argument types optimize better
function add(a, b) {
    return a + b;
}
add(1, 2);   // Numbers
add(3, 4);   // Numbers - optimized

// ❌ Type changes cause deoptimization
add('a', 'b');  // Strings - deoptimizes!
```

#### 3. Avoid delete Operator

```javascript
// ❌ delete causes hidden class transition
const obj = { a: 1, b: 2 };
delete obj.a;  // Slow, breaks optimization

// ✅ Set to undefined or use Map
obj.a = undefined;

// ✅ Use Map for dynamic keys
const map = new Map();
map.set('a', 1);
map.delete('a');  // Fast
```

#### 4. Use Appropriate Data Structures

```javascript
// ❌ Array for lookups - O(n)
const users = [{ id: 1 }, { id: 2 }, /* ... */];
const user = users.find(u => u.id === 5);

// ✅ Map for lookups - O(1)
const userMap = new Map(users.map(u => [u.id, u]));
const user = userMap.get(5);

// ❌ Array for uniqueness check
const arr = [1, 2, 3];
const hasTwo = arr.includes(2);  // O(n)

// ✅ Set for uniqueness - O(1)
const set = new Set(arr);
const hasTwo = set.has(2);
```

### Efficient Loops

```javascript
// ❌ Recalculating length each iteration
for (let i = 0; i < array.length; i++) {
    // ...
}

// ✅ Cache length
const len = array.length;
for (let i = 0; i < len; i++) {
    // ...
}

// ✅ Or use for...of (similar performance, cleaner)
for (const item of array) {
    // ...
}

// Performance comparison (varies by engine):
// for (classic) ≈ for...of > forEach > map/filter/reduce
// But difference is usually negligible for non-hot-path code
```

### String Operations

```javascript
// ❌ String concatenation in loop
let result = '';
for (let i = 0; i < 10000; i++) {
    result += 'item' + i;  // Creates new string each iteration
}

// ✅ Use array and join
const parts = [];
for (let i = 0; i < 10000; i++) {
    parts.push(`item${i}`);
}
const result = parts.join('');

// ✅ Template literals for fixed strings
const message = `Hello ${name}, welcome!`;
```

---

## DOM Performance

### Professional Definition

DOM operations are expensive because they may trigger **reflow** (layout recalculation) and **repaint** (visual rendering). Minimizing DOM access, batching operations, and using efficient techniques is crucial for smooth UI.

### Reflow vs Repaint

| Operation | Triggers |
|-----------|----------|
| **Reflow** | Layout changes (size, position, visibility) |
| **Repaint** | Visual changes (color, background, shadow) |

Reflow is more expensive than repaint and may trigger repaint of affected areas.

### Reading vs Writing

```javascript
// ❌ Layout thrashing - interleaved reads and writes
elements.forEach(el => {
    const height = el.offsetHeight;  // READ - forces layout
    el.style.height = height * 2 + 'px';  // WRITE - invalidates layout
    // Next READ forces recalculation!
});

// ✅ Batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight);  // All READs
elements.forEach((el, i) => {
    el.style.height = heights[i] * 2 + 'px';  // All WRITEs
});
```

### Properties That Trigger Reflow

```javascript
// Reading these properties forces layout calculation:
element.offsetWidth, element.offsetHeight
element.offsetTop, element.offsetLeft
element.clientWidth, element.clientHeight
element.scrollWidth, element.scrollHeight
element.scrollTop, element.scrollLeft
getComputedStyle(element)
element.getBoundingClientRect()

// Cache values if reading multiple times
const rect = element.getBoundingClientRect();  // One reflow
const { width, height, top, left } = rect;
```

### Efficient DOM Updates

```javascript
// ❌ Multiple DOM operations
for (let i = 0; i < 100; i++) {
    const div = document.createElement('div');
    div.textContent = `Item ${i}`;
    container.appendChild(div);  // 100 insertions
}

// ✅ Use DocumentFragment
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
    const div = document.createElement('div');
    div.textContent = `Item ${i}`;
    fragment.appendChild(div);
}
container.appendChild(fragment);  // 1 insertion

// ✅ Or build HTML string
const html = Array.from({ length: 100 }, (_, i) => 
    `<div>Item ${i}</div>`
).join('');
container.innerHTML = html;  // 1 operation

// ✅ Use textContent over innerHTML for text
element.textContent = 'Hello';  // Safe, fast
element.innerHTML = 'Hello';    // Parses HTML, slower
```

### Debouncing and Throttling

```javascript
// Debounce - wait until user stops (e.g., search input)
function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

const handleSearch = debounce((query) => {
    fetchResults(query);
}, 300);

input.addEventListener('input', e => handleSearch(e.target.value));

// Throttle - limit rate (e.g., scroll, resize)
function throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

const handleScroll = throttle(() => {
    updateScrollIndicator();
}, 100);

window.addEventListener('scroll', handleScroll);
```

### requestAnimationFrame

```javascript
// ❌ setTimeout for animations - not synced with display
function animateBad() {
    element.style.left = position++ + 'px';
    setTimeout(animateBad, 16);  // ~60fps but not exact
}

// ✅ requestAnimationFrame - synced with display refresh
function animateGood(timestamp) {
    element.style.left = position++ + 'px';
    requestAnimationFrame(animateGood);
}
requestAnimationFrame(animateGood);

// ✅ With proper timing for frame-rate independence
let lastTime = 0;
function animate(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    
    // Move based on time, not frames
    position += speed * (delta / 1000);  // pixels per second
    element.style.left = position + 'px';
    
    requestAnimationFrame(animate);
}
```

---

## Security Best Practices

### XSS (Cross-Site Scripting) Prevention

```javascript
// ❌ Dangerous: Inserting unsanitized HTML
const userInput = '<script>alert("XSS")</script>';
element.innerHTML = userInput;  // Script executes!

// ✅ Use textContent for text
element.textContent = userInput;  // Displayed as text

// ✅ Sanitize HTML if needed
// Using DOMPurify library
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// ✅ Manual escaping (basic)
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
element.innerHTML = escapeHTML(userInput);

// ✅ Template literals are NOT automatically safe
const html = `<div>${userInput}</div>`;  // Still dangerous!
```

### Avoiding Dangerous Functions

```javascript
// ❌ eval() executes arbitrary code
eval(userInput);  // NEVER do this

// ❌ new Function() is similar
new Function(userInput)();  // Also dangerous

// ❌ setTimeout/setInterval with strings
setTimeout(userInput, 0);  // Evaluates string as code

// ✅ Always use functions, not strings
setTimeout(() => safeFunction(), 0);

// ❌ innerHTML with user data
element.innerHTML = userInput;

// ✅ Use DOM methods or sanitization
element.textContent = userInput;
```

### Content Security Policy (CSP)

```html
<!-- Restrict where scripts can come from -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' https://trusted-cdn.com">

<!-- Disable inline scripts (prevents XSS) -->
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self'; style-src 'self'">
```

### Secure Data Handling

```javascript
// ❌ Sensitive data in URL parameters (visible in history, logs)
fetch(`/api/login?password=${password}`);

// ✅ Use POST with body
fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
});

// ❌ Storing sensitive data in localStorage (accessible to JS)
localStorage.setItem('token', authToken);

// ✅ Use httpOnly cookies (set by server, not accessible to JS)
// Server: Set-Cookie: token=xyz; HttpOnly; Secure; SameSite=Strict

// ✅ Validate inputs
function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

// ✅ Limit input length
function sanitizeInput(input, maxLength = 1000) {
    return String(input).slice(0, maxLength);
}
```

---

## Clean Code Principles

### Meaningful Names

```javascript
// ❌ Cryptic names
const d = new Date();
const y = d.getFullYear();
const fn = u => u.a > 18;

// ✅ Descriptive names
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const isAdult = user => user.age > 18;

// ❌ Misleading names
const userList = { name: 'Andrei' };  // Not a list!

// ✅ Accurate names
const user = { name: 'Andrei' };
const users = [user1, user2, user3];
```

### Small, Focused Functions

```javascript
// ❌ Large function doing too much
function processOrder(order) {
    // Validate order (20 lines)
    // Calculate prices (30 lines)
    // Apply discounts (25 lines)
    // Update inventory (15 lines)
    // Send confirmation (20 lines)
}

// ✅ Single responsibility
function processOrder(order) {
    const validatedOrder = validateOrder(order);
    const pricedOrder = calculatePrices(validatedOrder);
    const discountedOrder = applyDiscounts(pricedOrder);
    updateInventory(discountedOrder);
    sendConfirmation(discountedOrder);
    return discountedOrder;
}

function validateOrder(order) { /* ... */ }
function calculatePrices(order) { /* ... */ }
function applyDiscounts(order) { /* ... */ }
function updateInventory(order) { /* ... */ }
function sendConfirmation(order) { /* ... */ }
```

### DRY (Don't Repeat Yourself)

```javascript
// ❌ Repeated logic
function validateEmail(email) {
    if (!email) return { valid: false, error: 'Required' };
    if (!email.includes('@')) return { valid: false, error: 'Invalid format' };
    return { valid: true };
}

function validateName(name) {
    if (!name) return { valid: false, error: 'Required' };
    if (name.length < 2) return { valid: false, error: 'Too short' };
    return { valid: true };
}

// ✅ Extract common patterns
const required = value => value ? null : 'Required';
const minLength = min => value => 
    value.length >= min ? null : `Must be at least ${min} characters`;
const pattern = (regex, msg) => value =>
    regex.test(value) ? null : msg;

const validate = (value, ...validators) => {
    for (const validator of validators) {
        const error = validator(value);
        if (error) return { valid: false, error };
    }
    return { valid: true };
};

// Usage
validate(email, required, pattern(/@/, 'Must contain @'));
validate(name, required, minLength(2));
```

### Early Returns

```javascript
// ❌ Deeply nested conditions
function getDiscount(user) {
    if (user) {
        if (user.isPremium) {
            if (user.yearsActive > 5) {
                return 0.3;
            } else {
                return 0.2;
            }
        } else {
            return 0.1;
        }
    } else {
        return 0;
    }
}

// ✅ Early returns - flat and readable
function getDiscount(user) {
    if (!user) return 0;
    if (!user.isPremium) return 0.1;
    if (user.yearsActive > 5) return 0.3;
    return 0.2;
}
```

### Avoid Magic Numbers/Strings

```javascript
// ❌ Magic numbers
if (user.role === 1) { /* ... */ }
if (items.length > 10) { /* ... */ }

// ✅ Named constants
const ROLES = {
    ADMIN: 1,
    USER: 2,
    GUEST: 3
};

const MAX_ITEMS_PER_PAGE = 10;

if (user.role === ROLES.ADMIN) { /* ... */ }
if (items.length > MAX_ITEMS_PER_PAGE) { /* ... */ }
```

---

## Code Quality Tools

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended'
    ],
    rules: {
        'no-unused-vars': 'error',
        'no-console': 'warn',
        'eqeqeq': ['error', 'always'],
        'no-var': 'error',
        'prefer-const': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error'
    }
};
```

### Prettier Configuration

```javascript
// .prettierrc
{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 4,
    "trailingComma": "es5",
    "printWidth": 100,
    "arrowParens": "avoid"
}
```

### TypeScript for Type Safety

```typescript
// Catch errors at compile time, not runtime

// Without TypeScript - runtime error
function greet(user) {
    return `Hello, ${user.name}`;
}
greet(null);  // Runtime error

// With TypeScript - compile error
interface User {
    name: string;
}

function greet(user: User): string {
    return `Hello, ${user.name}`;
}
greet(null);  // Error: Argument of type 'null' is not assignable
```

---

## Performance Monitoring

### Performance API

```javascript
// Measure code execution time
const start = performance.now();
expensiveOperation();
const duration = performance.now() - start;
console.log(`Took ${duration.toFixed(2)}ms`);

// Mark and measure
performance.mark('start-fetch');
await fetchData();
performance.mark('end-fetch');

performance.mark('start-render');
renderData();
performance.mark('end-render');

performance.measure('fetch-time', 'start-fetch', 'end-fetch');
performance.measure('render-time', 'start-render', 'end-render');

// Get measurements
performance.getEntriesByType('measure').forEach(m => {
    console.log(`${m.name}: ${m.duration.toFixed(2)}ms`);
});

// Memory usage (Chrome)
if (performance.memory) {
    console.log({
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    });
}
```

### Web Vitals

```javascript
// Core Web Vitals - key UX metrics
// LCP (Largest Contentful Paint) - loading performance
// FID (First Input Delay) - interactivity
// CLS (Cumulative Layout Shift) - visual stability

// Using web-vitals library
import { getLCP, getFID, getCLS } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

### Chrome DevTools

```javascript
// Performance tab: Record to see:
// - CPU usage
// - Frames per second
// - Main thread activity
// - Long tasks (>50ms)

// Memory tab:
// - Heap snapshots
// - Allocation timeline
// - Memory leak detection

// Lighthouse:
// - Performance score
// - Accessibility
// - Best practices
// - SEO
```

---

## Quick Reference

### Performance Checklist

- [ ] Use `const`/`let`, not `var`
- [ ] Cache DOM references
- [ ] Batch DOM reads and writes
- [ ] Debounce/throttle event handlers
- [ ] Use `requestAnimationFrame` for animations
- [ ] Avoid layout thrashing
- [ ] Lazy load non-critical resources
- [ ] Use appropriate data structures (Map/Set)
- [ ] Remove event listeners on cleanup
- [ ] Clear timers and intervals

### Security Checklist

- [ ] Sanitize all user inputs
- [ ] Use `textContent` instead of `innerHTML`
- [ ] Never use `eval()` or `new Function()`
- [ ] Use HTTPS
- [ ] Implement CSP headers
- [ ] Validate on both client and server
- [ ] Don't store sensitive data in localStorage
- [ ] Use httpOnly cookies for tokens

### Code Quality Checklist

- [ ] Meaningful variable/function names
- [ ] Small, focused functions (single responsibility)
- [ ] No code duplication (DRY)
- [ ] Early returns for readability
- [ ] Named constants, no magic numbers
- [ ] Consistent formatting (Prettier)
- [ ] Linting enabled (ESLint)
- [ ] TypeScript for type safety

---

## Key Takeaways

| Area | Key Points |
|------|------------|
| **Memory** | Clean up listeners/timers, use WeakMap, avoid closure leaks |
| **DOM** | Batch operations, avoid layout thrashing, use fragments |
| **Data Structures** | Map for lookups, Set for uniqueness |
| **Security** | Never trust user input, avoid eval, use CSP |
| **Clean Code** | Small functions, early returns, meaningful names |
| **Monitoring** | Measure before optimizing, use DevTools |

### Golden Rules

1. **Measure first** - Profile before optimizing
2. **Optimize hot paths** - Focus on frequently executed code
3. **Keep it simple** - Readable code is maintainable code
4. **Fail fast** - Validate early, provide clear errors
5. **Clean up** - Remove listeners, clear timers, null references

---

> 💡 **Professional Tip**: The best optimization is often not doing something at all. Before optimizing code, ask: "Do we need this feature?" or "Can we cache this result?" or "Can we do this lazily?" The fastest code is code that doesn't run.