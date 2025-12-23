# JavaScript Engine & Runtime

> "Physics is like sex: sure, it may give some practical results, but that's not why we do it." - Richard Feynman

Understanding how JavaScript executes under the hood helps you write more performant code and debug mysterious issues. This knowledge separates advanced developers from beginners.

---

## JavaScript Engine Architecture

### Professional Definition

A **JavaScript engine** is a program that executes JavaScript code. Modern engines use **Just-In-Time (JIT) compilation**, combining interpretation for quick startup with compilation for optimized hot code. Major engines include **V8** (Chrome, Node.js), **SpiderMonkey** (Firefox), **JavaScriptCore** (Safari), and **Chakra** (Edge Legacy).

### V8 Engine Pipeline

```
JavaScript Source Code
        ↓
    Parser → Abstract Syntax Tree (AST)
        ↓
    Ignition (Interpreter) → Bytecode → Execution
        ↓ (hot code)
    TurboFan (Optimizing Compiler) → Optimized Machine Code
        ↓ (deoptimization if assumptions violated)
    Back to Bytecode
```

### Technical Specifications

| Component | Function |
|-----------|----------|
| **Parser** | Tokenizes and parses source into AST |
| **Ignition** | Interprets AST, generates bytecode |
| **Sparkplug** | Fast, non-optimizing compiler (V8 9.1+) |
| **TurboFan** | Optimizing compiler for hot code |
| **Orinoco** | Garbage collector |

### Limitations & Caveats

1. **Optimization requires consistent types**:
   ```javascript
   // ✅ Consistent types - can be optimized
   function add(a, b) {
       return a + b;
   }
   add(1, 2);     // Numbers
   add(3, 4);     // Numbers - optimized for number addition
   
   // ❌ Type change causes deoptimization
   add("a", "b"); // Strings - deoptimizes back to bytecode!
   ```

2. **Hidden classes (Shapes/Maps)**:
   ```javascript
   // V8 creates hidden classes for object shapes
   
   // ✅ Same shape - shares hidden class
   const obj1 = { a: 1, b: 2 };
   const obj2 = { a: 3, b: 4 };
   
   // ❌ Different order - different hidden classes!
   const obj3 = { b: 2, a: 1 };  // Different from obj1
   
   // ❌ Adding properties later creates transition
   const obj4 = { a: 1 };
   obj4.b = 2;  // Hidden class transition
   obj4.c = 3;  // Another transition
   
   // ✅ Initialize all properties in constructor
   class Point {
       constructor(x, y) {
           this.x = x;
           this.y = y;
           // All properties defined, single hidden class
       }
   }
   ```

3. **Inline caching**:
   ```javascript
   // V8 caches property lookups based on hidden class
   function getX(obj) {
       return obj.x;  // Inline cache stores offset for 'x'
   }
   
   // ✅ Fast: same shape objects
   const point1 = { x: 1, y: 2 };
   const point2 = { x: 3, y: 4 };
   getX(point1);  // Cache miss, stores offset
   getX(point2);  // Cache hit, uses stored offset
   
   // ❌ Slow: different shapes cause cache misses
   getX({ x: 1, y: 2 });
   getX({ x: 1, z: 2 });  // Different shape, cache miss
   ```

---

## Execution Context

### Professional Definition

An **execution context** is an abstract concept that holds information about the environment in which code is executed. It contains: (1) **Variable Environment** (let, const, var bindings), (2) **Lexical Environment** (scope chain), and (3) **This Binding**.

### Types of Execution Contexts

| Type | Created When |
|------|--------------|
| **Global** | Script starts |
| **Function** | Function is called |
| **Eval** | `eval()` is called |
| **Module** | Module is loaded |

### Execution Context Stack (Call Stack)

```javascript
function outer() {
    console.log('outer');
    inner();
}

function inner() {
    console.log('inner');
}

outer();

// Call Stack:
// 1. [Global]
// 2. [Global, outer]
// 3. [Global, outer, inner]
// 4. [Global, outer]       (inner returns)
// 5. [Global]              (outer returns)
```

### Creation Phase vs Execution Phase

```javascript
// Creation Phase:
// 1. Create Variable Environment (hoist var, function declarations)
// 2. Create Lexical Environment (let, const in TDZ)
// 3. Determine 'this' binding
// 4. Create outer environment reference (scope chain)

// Execution Phase:
// 1. Execute code line by line
// 2. Assign values to variables
// 3. Execute function calls

console.log(a);  // undefined (var hoisted, not initialized)
console.log(b);  // ReferenceError (let in TDZ)

var a = 1;
let b = 2;

foo();  // "foo" (function declaration hoisted completely)
bar();  // TypeError (var hoisted, but function not assigned yet)

function foo() { console.log('foo'); }
var bar = function() { console.log('bar'); };
```

---

## The Call Stack

### Professional Definition

The **call stack** is a LIFO (Last In, First Out) data structure that tracks the currently executing function and its callers. Each function call pushes a new **stack frame** containing the function's execution context. When a function returns, its frame is popped.

### Technical Specifications

| Property | Description |
|----------|-------------|
| Max depth | Browser-dependent (~10,000-50,000 frames) |
| Frame contains | Return address, local variables, parameters |
| Overflow | RangeError: Maximum call stack size exceeded |
| Inspection | `Error.stack`, DevTools debugger |

### Limitations & Caveats

1. **Stack overflow from deep recursion**:
   ```javascript
   function recurse() {
       recurse();  // No base case!
   }
   recurse();  // RangeError: Maximum call stack size exceeded
   
   // Stack limit varies:
   // Chrome: ~10,000-15,000 frames
   // Firefox: ~50,000 frames
   // Safari: ~36,000 frames
   ```

2. **Async functions don't block the stack**:
   ```javascript
   async function example() {
       await fetch('/api');  // Suspends, pops off stack
       // Resumes later via microtask queue
   }
   
   // The await allows other code to run
   ```

3. **Stack traces are truncated**:
   ```javascript
   // Long stack traces are cut off
   Error.stackTraceLimit = 50;  // V8: set max frames in trace
   
   // Async stack traces may be incomplete
   // Use --async-stack-traces flag in Node.js
   ```

4. **`arguments.callee` and `arguments.caller` are deprecated**:
   ```javascript
   // ❌ Deprecated, forbidden in strict mode
   function foo() {
       console.log(arguments.callee);  // Reference to foo (deprecated)
   }
   
   // ✅ Use named function expression
   const factorial = function fact(n) {
       return n <= 1 ? 1 : n * fact(n - 1);
   };
   ```

---

## Memory Heap

### Professional Definition

The **heap** is the memory region where objects, arrays, and functions are stored. Unlike the stack (structured, LIFO), the heap is unstructured and managed by the garbage collector. Variables store references (pointers) to heap objects.

### Memory Layout

```
┌─────────────────────────────────────────┐
│               Call Stack                │
│  ┌─────────────────────────────────┐   │
│  │ Function: greet                 │   │
│  │ Variables: name (reference) ────┼───┼──┐
│  └─────────────────────────────────┘   │  │
│  ┌─────────────────────────────────┐   │  │
│  │ Global                          │   │  │
│  │ Variables: user (reference) ────┼───┼──┼──┐
│  └─────────────────────────────────┘   │  │  │
└─────────────────────────────────────────┘  │  │
                                             │  │
┌─────────────────────────────────────────┐  │  │
│               Memory Heap               │  │  │
│  ┌─────────────┐   ┌─────────────┐     │  │  │
│  │ { name:     │   │ { name:     │     │  │  │
│  │   "Andrei"  │◀──┼─────────────┼─────┼──┘  │
│  │ }           │   │   "John",   │◀────┼─────┘
│  └─────────────┘   │   age: 30 } │     │
│                    └─────────────┘     │
└─────────────────────────────────────────┘
```

### Limitations & Caveats

1. **Memory limit is browser/environment dependent**:
   ```javascript
   // Chrome: ~1.4GB per tab (32-bit), ~4GB+ (64-bit)
   // Node.js: ~1.7GB (can increase with --max-old-space-size)
   
   // Check available memory (Chrome)
   console.log(performance.memory);
   // { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize }
   ```

2. **Large arrays/objects can cause performance issues**:
   ```javascript
   // ❌ Large contiguous allocations
   const hugeArray = new Array(100_000_000);  // May fail or be slow
   
   // ✅ Consider chunking or streaming
   function* generateData(n) {
       for (let i = 0; i < n; i++) {
           yield computeItem(i);
       }
   }
   ```

3. **ArrayBuffer for binary data**:
   ```javascript
   // More efficient for binary data than regular arrays
   const buffer = new ArrayBuffer(1024);  // 1KB of raw memory
   const view = new Uint8Array(buffer);   // Typed view
   ```

---

## Garbage Collection

### Professional Definition

**Garbage collection (GC)** is automatic memory management that reclaims memory occupied by objects that are no longer reachable. V8 uses a **generational garbage collector** with a young generation (Scavenger/Minor GC) and an old generation (Mark-Sweep-Compact/Major GC).

### V8 Garbage Collection

| Generation | GC Type | Description |
|------------|---------|-------------|
| Young | Scavenger | Frequent, fast, stop-the-world |
| Old | Mark-Sweep | Less frequent, slower |
| Old | Mark-Compact | Compacts memory to reduce fragmentation |

### Mark-and-Sweep Algorithm

```
1. Start from "roots" (global object, stack variables)
2. Traverse all reachable objects, "mark" them as alive
3. "Sweep" through heap, free unmarked objects
4. Optionally "compact" to reduce fragmentation
```

### Limitations & Caveats

1. **GC pauses can cause jank**:
   ```javascript
   // Large GC pauses can cause visible stuttering in animations
   // V8's Orinoco GC uses incremental and concurrent techniques
   // to minimize pause times
   
   // Avoid creating many short-lived objects in animation loops
   // ❌ Bad
   function animate() {
       const position = { x: 0, y: 0 };  // New object every frame!
       requestAnimationFrame(animate);
   }
   
   // ✅ Better: reuse object
   const position = { x: 0, y: 0 };
   function animate() {
       position.x = calculateX();
       position.y = calculateY();
       requestAnimationFrame(animate);
   }
   ```

2. **Memory leaks prevent GC**:
   ```javascript
   // Leaks occur when unneeded objects remain reachable
   
   // ❌ Forgotten timer
   const data = loadHugeData();
   setInterval(() => console.log(data), 1000);  // data never GC'd
   
   // ❌ Forgotten event listener
   window.addEventListener('resize', handler);
   // handler (and its closure) never GC'd
   
   // ❌ Detached DOM nodes
   const container = document.getElementById('container');
   const elements = [];
   elements.push(container.firstChild);  // Reference to DOM node
   container.removeChild(container.firstChild);  // Removed from DOM
   // But elements array still references it - memory leak!
   ```

3. **WeakMap/WeakSet don't prevent GC**:
   ```javascript
   const cache = new WeakMap();
   
   let obj = { data: 'important' };
   cache.set(obj, 'metadata');
   
   obj = null;  // Object can be garbage collected
   // cache entry is automatically removed!
   
   // Use case: Associate data with objects without preventing GC
   ```

4. **Closures can cause unexpected retention**:
   ```javascript
   function outer() {
       const hugeData = new Array(1000000);
       const smallValue = hugeData.length;
       
       // ❌ Entire closure scope retained
       return function inner() {
           // Even if inner doesn't use hugeData,
           // it might be retained (engine-dependent)
           return smallValue;
       };
   }
   
   // ✅ Null out large variables explicitly
   function outerBetter() {
       let hugeData = new Array(1000000);
       const smallValue = hugeData.length;
       hugeData = null;  // Allow GC
       
       return function inner() {
           return smallValue;
       };
   }
   ```

---

## The Event Loop

### Professional Definition

The **event loop** is the concurrency model that allows JavaScript to perform non-blocking I/O despite being single-threaded. It continuously checks if the call stack is empty, then moves callbacks from the task queues to the stack for execution.

### Event Loop Components

```
┌─────────────────────────────────────────────────────────┐
│                      Call Stack                         │
│                (Synchronous execution)                  │
└────────────────────────────┬────────────────────────────┘
                             │
                       Event Loop
                    (Is stack empty?)
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│   Microtask Queue   │               │   Macrotask Queue   │
│  (Higher priority)  │               │  (Lower priority)   │
│                     │               │                     │
│ • Promise callbacks │               │ • setTimeout        │
│ • queueMicrotask    │               │ • setInterval       │
│ • MutationObserver  │               │ • I/O callbacks     │
│ • process.nextTick  │               │ • UI rendering      │
│   (Node.js only)    │               │ • setImmediate      │
└─────────────────────┘               │   (Node.js only)    │
                                      └─────────────────────┘
```

### Event Loop Algorithm

```
1. Execute all synchronous code in the call stack
2. Is call stack empty?
   └─ No → Continue executing
   └─ Yes → Go to step 3
3. Execute ALL microtasks (until queue is empty)
   - Including microtasks added during this phase!
4. Is there a pending macrotask?
   └─ No → Go to step 3 (check for new microtasks)
   └─ Yes → Execute ONE macrotask, go to step 3
5. Render updates (if needed, browser only)
6. Repeat from step 2
```

### Technical Specifications

| Queue | Priority | Examples |
|-------|----------|----------|
| Microtasks | Highest (run between every macrotask) | Promise.then/catch/finally, queueMicrotask, MutationObserver |
| Animation | Next (browser) | requestAnimationFrame |
| Macrotasks | Lowest | setTimeout, setInterval, I/O, UI events |

### Limitations & Caveats

1. **Microtasks can starve macrotasks**:
   ```javascript
   // ❌ Infinite microtask loop
   function infiniteMicrotasks() {
       Promise.resolve().then(infiniteMicrotasks);
   }
   infiniteMicrotasks();
   // setTimeout callbacks never run!
   // UI freezes!
   ```

2. **`setTimeout(fn, 0)` is not immediate**:
   ```javascript
   console.log('1');
   setTimeout(() => console.log('2'), 0);
   Promise.resolve().then(() => console.log('3'));
   console.log('4');
   
   // Output: 1, 4, 3, 2
   // Microtask (3) runs before macrotask (2)
   
   // Also: minimum timeout in browsers is clamped to ~4ms
   // after nested depth of 5
   ```

3. **Node.js has additional queues**:
   ```javascript
   // Node.js event loop phases:
   // timers → pending → idle/prepare → poll → check → close
   
   process.nextTick(() => console.log('nextTick'));
   Promise.resolve().then(() => console.log('promise'));
   setImmediate(() => console.log('immediate'));
   setTimeout(() => console.log('timeout'), 0);
   
   // Output (typical):
   // nextTick (before all microtasks)
   // promise
   // timeout (or immediate - order not guaranteed)
   // immediate (or timeout)
   ```

4. **Long tasks block the event loop**:
   ```javascript
   // ❌ Blocks for 5 seconds - UI unresponsive
   function longTask() {
       const end = Date.now() + 5000;
       while (Date.now() < end) {}
   }
   
   // ✅ Break into chunks
   function processInChunks(items, callback) {
       let index = 0;
       
       function doChunk() {
           const end = Math.min(index + 100, items.length);
           while (index < end) {
               callback(items[index++]);
           }
           
           if (index < items.length) {
               setTimeout(doChunk, 0);  // Yield to event loop
           }
       }
       
       doChunk();
   }
   ```

5. **`requestAnimationFrame` timing**:
   ```javascript
   // rAF runs before next repaint, usually ~16ms (60fps)
   // Runs after microtasks, before render
   
   Promise.resolve().then(() => console.log('microtask'));
   requestAnimationFrame(() => console.log('rAF'));
   console.log('sync');
   
   // Output: sync, microtask, rAF
   ```

---

## Web APIs (Browser) vs Node.js APIs

### Browser Runtime

```javascript
// Browser-specific globals
window           // Global object
document         // DOM access
localStorage     // Persistent storage
sessionStorage   // Session storage
fetch            // HTTP requests
XMLHttpRequest   // Legacy HTTP
WebSocket        // Real-time communication
Worker           // Web Workers (threads)
navigator        // Browser info
location         // URL info
history          // Navigation history
```

### Node.js Runtime

```javascript
// Node.js-specific globals
global           // Global object (globalThis in both)
process          // Process info and control
Buffer           // Binary data handling
__dirname        // Current directory
__filename       // Current file
require          // CommonJS module loading
module           // Module info
exports          // Module exports
setImmediate     // Run after I/O
```

### Differences

| Feature | Browser | Node.js |
|---------|---------|---------|
| Global object | `window` | `global` |
| Modules | ES Modules, `<script>` | CommonJS, ES Modules |
| Threads | Web Workers | Worker Threads, child_process |
| File I/O | Limited (File API) | Full (fs module) |
| Network | fetch, WebSocket | http, net, fetch (18+) |
| Process control | Limited | Full (signals, stdin/out) |

---

## Performance Optimization

### Avoiding Deoptimization

```javascript
// ✅ Use consistent types
function process(items) {
    // All items should be same type
}

// ✅ Initialize all object properties in constructor
class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z ?? 0;  // Don't add properties later
    }
}

// ✅ Use typed arrays for numeric data
const data = new Float64Array(1000);  // Much faster than regular array

// ✅ Avoid delete operator
const obj = { a: 1, b: 2 };
delete obj.a;  // Causes hidden class transition
// Better: set to undefined or use Map

// ✅ Avoid try-catch in hot paths
function hotFunction() {
    // V8 doesn't optimize functions with try-catch as well
    // (improved in recent versions)
}
```

### Memory-Efficient Patterns

```javascript
// ✅ Object pools for frequently created objects
const pool = [];
function getVector() {
    return pool.length > 0 ? pool.pop() : { x: 0, y: 0 };
}
function releaseVector(v) {
    v.x = 0;
    v.y = 0;
    pool.push(v);
}

// ✅ Avoid closures in hot paths if not needed
// ❌ Creates new function each call
items.map(item => transform(item, config));
// ✅ Reuse function
const transformWithConfig = item => transform(item, config);
items.map(transformWithConfig);
```

---

## Debugging Engine Behavior

### Chrome DevTools

```javascript
// Performance tab: Record to see GC pauses, long tasks
// Memory tab: Heap snapshots, allocation timeline
// Sources tab: Breakpoints, step through code

// Console API
console.time('operation');
// ... code ...
console.timeEnd('operation');

console.profile('MyProfile');
// ... code ...
console.profileEnd('MyProfile');
```

### V8 Flags (Node.js)

```bash
# See optimizations/deoptimizations
node --trace-opt --trace-deopt script.js

# Heap statistics
node --expose-gc --trace-gc script.js

# Increase heap size
node --max-old-space-size=4096 script.js
```

---

## Key Takeaways

| Concept | Key Points |
|---------|------------|
| **JIT Compilation** | Ignition interprets, TurboFan optimizes hot code |
| **Hidden Classes** | Consistent object shapes enable optimizations |
| **Call Stack** | LIFO, limited depth, stack overflow possible |
| **Heap** | Unstructured memory for objects, GC managed |
| **Garbage Collection** | Generational, can cause pauses, avoid leaks |
| **Event Loop** | Microtasks before macrotasks, one macrotask per loop |
| **Optimization** | Consistent types, avoid delete, use object pools |

### Best Practices

1. **Use consistent types** for function arguments
2. **Initialize all object properties** upfront
3. **Break long tasks** into chunks to avoid blocking
4. **Clear references** to enable garbage collection
5. **Use WeakMap/WeakSet** for caches tied to object lifetime
6. **Profile before optimizing** - don't guess bottlenecks

---

> 💡 **Professional Tip**: Understanding the engine helps, but profile first. Use Chrome DevTools Performance/Memory tabs or Node.js `--prof` flag. Premature optimization based on engine internals can lead to unreadable code without measurable benefits.