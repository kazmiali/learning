# Asynchronous JavaScript

> "Nature uses only the longest threads to weave her patterns, so that each small piece of her fabric reveals the organization of the entire tapestry." - Richard Feynman

Asynchronous programming is fundamental to JavaScript's non-blocking nature. Understanding the event loop, promises, and async/await is essential for writing efficient, responsive applications.

---

## Synchronous vs Asynchronous

### Professional Definition

**Synchronous** execution means each operation must complete before the next begins, blocking the call stack. **Asynchronous** execution allows operations to be initiated and their completion handled later via callbacks, promises, or async/await, without blocking the main thread.

JavaScript is **single-threaded** with a **non-blocking** I/O model. Long-running operations (network requests, file I/O, timers) are delegated to the runtime environment (browser Web APIs or Node.js libuv) and their callbacks are queued for later execution.

### Simple Explanation

Synchronous is like waiting in line at a single-counter bank - everyone waits their turn. Asynchronous is like taking a number and sitting down - you're called back when it's your turn, and meanwhile others can be served.

---

## Callbacks

### Professional Definition

A **callback** is a function passed as an argument to another function, to be executed at a later time. In asynchronous operations, callbacks are invoked when the operation completes (success or failure). The **callback pattern** was the original mechanism for handling asynchronous operations in JavaScript.

### Technical Specifications

| Pattern | Description |
|---------|-------------|
| Error-first callback | `callback(error, result)` - Node.js convention |
| Success callback | `callback(result)` - Simple pattern |
| Event-based | `emitter.on('event', callback)` |
| Continuation-passing | Pass callback to be called with result |

### Error-First Callback Convention

```javascript
// Node.js convention: error is always the first parameter
fs.readFile('/path/to/file', 'utf8', function(err, data) {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    console.log('File contents:', data);
});
```

### Limitations & Caveats

1. **Callback Hell (Pyramid of Doom)**:
   ```javascript
   // ❌ Deeply nested callbacks are hard to read and maintain
   getUser(userId, function(err, user) {
       if (err) return handleError(err);
       getOrders(user.id, function(err, orders) {
           if (err) return handleError(err);
           getOrderDetails(orders[0].id, function(err, details) {
               if (err) return handleError(err);
               getShipping(details.shippingId, function(err, shipping) {
                   if (err) return handleError(err);
                   displayShipping(shipping);
               });
           });
       });
   });
   ```

2. **Inversion of Control**:
   ```javascript
   // You're trusting third-party code to:
   // - Call your callback
   // - Call it only once
   // - Call it with correct arguments
   // - Handle errors properly
   thirdPartyLib.doSomething(myCallback);
   ```

3. **Error handling is manual and error-prone**:
   ```javascript
   // Must check error in every callback
   // Easy to forget or mishandle
   fs.readFile('file.txt', function(err, data) {
       if (err) {
           // What if we forget this?
           return;
       }
       // Code continues even if error occurred
   });
   ```

4. **Hard to return values**:
   ```javascript
   // ❌ Cannot return from async callback
   function getData() {
       let result;
       asyncOperation(function(data) {
           result = data;
       });
       return result;  // undefined! Callback hasn't run yet
   }
   ```

5. **Zalgo: Inconsistent async behavior**:
   ```javascript
   // ❌ Sometimes sync, sometimes async - unpredictable!
   function maybeAsync(callback) {
       if (cached) {
           callback(cached);  // Sync
       } else {
           fetchData(callback);  // Async
       }
   }
   
   // ✅ Always be async
   function alwaysAsync(callback) {
       if (cached) {
           setImmediate(() => callback(cached));
       } else {
           fetchData(callback);
       }
   }
   ```

---

## Promises

### Professional Definition

A **Promise** is an object representing the eventual completion or failure of an asynchronous operation. It provides a standard interface for handling async results and errors, enabling chaining and composition. A Promise is in one of three states:

| State | Description | Transitions To |
|-------|-------------|----------------|
| **pending** | Initial state, operation in progress | fulfilled or rejected |
| **fulfilled** | Operation completed successfully | (terminal state) |
| **rejected** | Operation failed | (terminal state) |

Once settled (fulfilled or rejected), a Promise is **immutable** - its state and value cannot change.

### Simple Explanation

A Promise is like a receipt from a restaurant. It's a guarantee that you'll get something in the future - either your food (fulfilled) or a refund (rejected). While waiting, you can do other things.

### Promise Constructor

```javascript
const promise = new Promise((resolve, reject) => {
    // Executor function runs immediately
    
    if (success) {
        resolve(value);  // Fulfill with value
    } else {
        reject(error);   // Reject with reason
    }
});
```

### Technical Specifications

| Method | Description | Returns |
|--------|-------------|---------|
| `.then(onFulfilled, onRejected)` | Handle fulfillment/rejection | New Promise |
| `.catch(onRejected)` | Handle rejection only | New Promise |
| `.finally(onFinally)` | Run regardless of outcome | New Promise |

### Promise Chaining

```javascript
fetchUser(id)
    .then(user => fetchOrders(user.id))
    .then(orders => fetchOrderDetails(orders[0].id))
    .then(details => displayDetails(details))
    .catch(error => handleError(error))
    .finally(() => hideLoadingSpinner());
```

### Limitations & Caveats

1. **Cannot cancel a Promise**:
   ```javascript
   // Once started, Promise will run to completion
   const promise = fetch('/api/data');  // Cannot cancel!
   
   // ✅ Use AbortController for fetch
   const controller = new AbortController();
   const promise = fetch('/api/data', { signal: controller.signal });
   controller.abort();  // Cancels the request
   ```

2. **Unhandled rejections**:
   ```javascript
   // ❌ Unhandled rejection - silent failure!
   Promise.reject(new Error('Oops'));
   
   // ✅ Always handle rejections
   promise.catch(err => console.error(err));
   
   // ✅ Global handler (last resort)
   window.addEventListener('unhandledrejection', event => {
       console.error('Unhandled:', event.reason);
   });
   ```

3. **`.then()` always returns a Promise**:
   ```javascript
   promise.then(value => {
       return 42;  // Wrapped in Promise.resolve(42)
   });
   
   promise.then(value => {
       return Promise.resolve(42);  // Already a Promise
   });
   
   promise.then(value => {
       throw new Error('Oops');  // Becomes rejected Promise
   });
   ```

4. **Order of chained `.catch()`**:
   ```javascript
   promise
       .then(step1)  // If this throws...
       .then(step2)  // ...this is skipped
       .then(step3)  // ...this is skipped
       .catch(err => {
           // Catches errors from any above .then()
           return 'recovered';  // Can recover
       })
       .then(step4);  // Continues with 'recovered'
   ```

5. **`.finally()` doesn't receive value**:
   ```javascript
   promise
       .then(value => value * 2)
       .finally(() => {
           // No access to value or error
           // Cannot modify the chain value
           cleanup();
       })
       .then(value => console.log(value));  // Original doubled value
   ```

6. **Promise executor runs synchronously**:
   ```javascript
   console.log('1');
   
   new Promise(resolve => {
       console.log('2');  // Runs immediately!
       resolve();
   }).then(() => {
       console.log('4');  // Runs in microtask queue
   });
   
   console.log('3');
   
   // Output: 1, 2, 3, 4
   ```

### Static Promise Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `Promise.resolve(value)` | Create fulfilled Promise | Wrap sync value |
| `Promise.reject(reason)` | Create rejected Promise | Wrap error |
| `Promise.all(promises)` | Wait for all, fail fast | Parallel, all required |
| `Promise.allSettled(promises)` | Wait for all, never fails | Parallel, handle each |
| `Promise.race(promises)` | First to settle wins | Timeout patterns |
| `Promise.any(promises)` | First success wins | Fallback patterns |

### Promise.all vs Promise.allSettled vs Promise.race vs Promise.any

```javascript
const promises = [
    Promise.resolve(1),
    Promise.reject(new Error('fail')),
    Promise.resolve(3)
];

// Promise.all - FAILS if ANY fails
Promise.all(promises)
    .then(values => console.log(values))
    .catch(err => console.log('Failed:', err.message));
// Output: Failed: fail

// Promise.allSettled - Always resolves with status of each
Promise.allSettled(promises)
    .then(results => console.log(results));
// Output: [
//   { status: 'fulfilled', value: 1 },
//   { status: 'rejected', reason: Error: fail },
//   { status: 'fulfilled', value: 3 }
// ]

// Promise.race - First to settle (fulfilled or rejected)
Promise.race([
    new Promise(r => setTimeout(() => r('slow'), 100)),
    new Promise(r => setTimeout(() => r('fast'), 50))
]).then(value => console.log(value));
// Output: fast

// Promise.any - First to FULFILL (ignores rejections)
Promise.any([
    Promise.reject('error1'),
    Promise.resolve('success'),
    Promise.reject('error2')
]).then(value => console.log(value));
// Output: success
```

---

## Async/Await

### Professional Definition

`async/await` is syntactic sugar over Promises, introduced in ES2017. An `async` function always returns a Promise. The `await` operator pauses execution until a Promise settles, returning the fulfilled value or throwing the rejected reason. This enables writing asynchronous code that reads like synchronous code.

### Technical Specifications

| Feature | Behavior |
|---------|----------|
| `async function` | Always returns a Promise |
| `await expression` | Pauses until Promise settles |
| `await` on non-Promise | Wraps in `Promise.resolve()` |
| Error handling | Use `try/catch` |
| Top-level await | Supported in ES modules (ES2022) |

### How It Works

```javascript
async function example() {
    console.log('1');
    const result = await Promise.resolve('2');
    console.log(result);
    console.log('3');
}

example();
console.log('4');

// Output: 1, 4, 2, 3
// 'await' pauses the function, but not the caller
```

### Desugaring async/await

```javascript
// async/await version
async function fetchData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

// Equivalent Promise version
function fetchData() {
    return fetch('/api/data')
        .then(response => response.json())
        .then(data => data)
        .catch(error => {
            throw error;
        });
}
```

### Limitations & Caveats

1. **`await` only valid inside `async` functions**:
   ```javascript
   // ❌ SyntaxError
   function regular() {
       const data = await fetch('/api');  // Error!
   }
   
   // ✅ Must be async
   async function valid() {
       const data = await fetch('/api');  // OK
   }
   
   // ✅ Top-level await in ES modules
   // file.mjs
   const data = await fetch('/api');  // OK in modules
   ```

2. **Sequential vs Parallel execution**:
   ```javascript
   // ❌ Sequential - SLOW (one after another)
   async function slow() {
       const a = await fetch('/api/a');  // Wait...
       const b = await fetch('/api/b');  // Then wait...
       const c = await fetch('/api/c');  // Then wait...
       // Total time: a + b + c
   }
   
   // ✅ Parallel - FAST (all at once)
   async function fast() {
       const [a, b, c] = await Promise.all([
           fetch('/api/a'),
           fetch('/api/b'),
           fetch('/api/c')
       ]);
       // Total time: max(a, b, c)
   }
   ```

3. **`forEach` doesn't work with async/await**:
   ```javascript
   // ❌ Doesn't wait! All run in parallel, no awaiting
   [1, 2, 3].forEach(async (n) => {
       await processItem(n);
   });
   console.log('Done');  // Logs immediately!
   
   // ✅ Use for...of for sequential
   for (const n of [1, 2, 3]) {
       await processItem(n);
   }
   console.log('Done');  // Logs after all complete
   
   // ✅ Use Promise.all for parallel
   await Promise.all([1, 2, 3].map(async (n) => {
       await processItem(n);
   }));
   console.log('Done');
   ```

4. **Error handling differences**:
   ```javascript
   // With try/catch - catches all errors in block
   async function withTryCatch() {
       try {
           const a = await mightFail();
           const b = await mightAlsoFail();
       } catch (err) {
           // Catches error from either
       }
   }
   
   // Individual handling
   async function individual() {
       const a = await mightFail().catch(e => defaultA);
       const b = await mightAlsoFail().catch(e => defaultB);
   }
   ```

5. **`await` on non-Promise values**:
   ```javascript
   async function example() {
       const a = await 42;  // Becomes Promise.resolve(42)
       console.log(a);  // 42
       
       const b = await { then(r) { r(100); } };  // Thenable
       console.log(b);  // 100
   }
   ```

6. **Async function always returns Promise**:
   ```javascript
   async function getValue() {
       return 42;  // Wrapped in Promise.resolve(42)
   }
   
   getValue().then(v => console.log(v));  // 42
   
   async function throwsError() {
       throw new Error('Oops');  // Wrapped in Promise.reject
   }
   
   throwsError().catch(e => console.log(e.message));  // "Oops"
   ```

7. **Cannot use `await` in regular callbacks**:
   ```javascript
   async function example() {
       // ❌ await inside regular callback
       [1, 2, 3].map(function(n) {
           return await process(n);  // SyntaxError
       });
       
       // ✅ await inside async callback
       const results = await Promise.all(
           [1, 2, 3].map(async (n) => {
               return await process(n);  // OK
           })
       );
   }
   ```

---

## The Event Loop

### Professional Definition

The **Event Loop** is the mechanism that allows JavaScript to perform non-blocking operations despite being single-threaded. It continuously monitors the call stack and callback queues, moving callbacks to the stack when it's empty. The event loop follows a specific order: (1) execute all synchronous code, (2) execute all microtasks, (3) execute one macrotask, (4) repeat.

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Call Stack                          │
│                    (Synchronous code)                       │
└─────────────────────────────────────────────────────────────┘
                              ↑
                        Event Loop
              (Checks: is call stack empty?)
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                     Microtask Queue                         │
│    (Promise callbacks, queueMicrotask, MutationObserver)    │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                   Macrotask Queue(s)                        │
│        (setTimeout, setInterval, I/O, UI rendering)         │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                        Web APIs                             │
│    (setTimeout, fetch, DOM events, file I/O, etc.)          │
└─────────────────────────────────────────────────────────────┘
```

### Microtasks vs Macrotasks

| Type | Queue Priority | Examples |
|------|---------------|----------|
| **Microtasks** | Higher (run first) | Promise.then/catch/finally, queueMicrotask, MutationObserver |
| **Macrotasks** | Lower (run after all microtasks) | setTimeout, setInterval, setImmediate (Node), I/O, UI rendering |

### Event Loop Algorithm

```
1. Execute all synchronous code in call stack
2. Call stack empty?
   └─ NO → Continue executing
   └─ YES → Continue to step 3
3. Execute ALL microtasks (until queue is empty)
4. Render UI (if needed, browser only)
5. Execute ONE macrotask
6. Go to step 2
```

### Execution Order Examples

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

queueMicrotask(() => console.log('4'));

console.log('5');

// Output: 1, 5, 3, 4, 2
// Sync: 1, 5
// Microtasks: 3, 4
// Macrotask: 2
```

### Limitations & Caveats

1. **`setTimeout(fn, 0)` is NOT immediate**:
   ```javascript
   setTimeout(() => console.log('timeout'), 0);
   Promise.resolve().then(() => console.log('promise'));
   console.log('sync');
   
   // Output: sync, promise, timeout
   // Microtasks run before macrotasks!
   ```

2. **Minimum timeout delay**:
   ```javascript
   // Browsers have minimum delay (4ms after nested timeouts)
   // setTimeout(fn, 0) may actually be setTimeout(fn, 4)
   ```

3. **Microtask queue can block**:
   ```javascript
   // ❌ Infinite microtask loop blocks everything
   function infiniteMicrotasks() {
       Promise.resolve().then(infiniteMicrotasks);
   }
   infiniteMicrotasks();  // UI freezes, macrotasks never run
   ```

4. **Node.js has additional queues**:
   ```javascript
   // Node.js event loop has more phases:
   // timers → pending callbacks → idle → poll → check → close
   
   setImmediate(() => console.log('immediate'));
   setTimeout(() => console.log('timeout'), 0);
   // Order is not guaranteed in Node.js!
   
   process.nextTick(() => console.log('nextTick'));
   // nextTick runs before other microtasks
   ```

5. **Long-running tasks block the event loop**:
   ```javascript
   // ❌ Blocks for 5 seconds
   const end = Date.now() + 5000;
   while (Date.now() < end) {}  // Sync loop
   
   // ✅ Break into chunks
   function processChunk(items, index = 0) {
       const chunk = items.slice(index, index + 100);
       // Process chunk...
       
       if (index + 100 < items.length) {
           setTimeout(() => processChunk(items, index + 100), 0);
       }
   }
   ```

---

## Fetch API

### Professional Definition

The **Fetch API** provides a modern interface for making HTTP requests. It returns a Promise that resolves to a `Response` object. Unlike `XMLHttpRequest`, Fetch uses Promises and provides a cleaner API. Fetch does **not** reject on HTTP error status codes (4xx, 5xx).

### Technical Specifications

| Feature | Description |
|---------|-------------|
| Return value | `Promise<Response>` |
| Rejects on | Network errors only |
| HTTP errors | Must check `response.ok` |
| Body methods | `.json()`, `.text()`, `.blob()`, `.arrayBuffer()`, `.formData()` |
| Body readable | Once only (stream) |

### Basic Usage

```javascript
// GET request
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// POST request
const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Andrei' })
});
```

### Limitations & Caveats

1. **Does NOT reject on HTTP errors**:
   ```javascript
   // ❌ No error thrown for 404, 500, etc.
   const response = await fetch('/not-found');
   console.log(response.status);  // 404
   console.log(response.ok);      // false
   
   // ✅ Check response.ok
   if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
   }
   ```

2. **Response body can only be read once**:
   ```javascript
   const response = await fetch('/api/data');
   const data1 = await response.json();
   const data2 = await response.json();  // Error! Body already consumed
   
   // ✅ Clone response if needed
   const response = await fetch('/api/data');
   const clone = response.clone();
   const data1 = await response.json();
   const data2 = await clone.json();  // OK
   ```

3. **Credentials not sent by default**:
   ```javascript
   // Cookies not sent to different origin by default
   fetch('https://other-origin.com/api', {
       credentials: 'include'  // Send cookies
   });
   
   // credentials options: 'omit', 'same-origin' (default), 'include'
   ```

4. **Cannot track upload progress**:
   ```javascript
   // ❌ fetch doesn't support upload progress
   // ✅ Use XMLHttpRequest for upload progress
   const xhr = new XMLHttpRequest();
   xhr.upload.addEventListener('progress', e => {
       const percent = (e.loaded / e.total) * 100;
   });
   ```

5. **Timeout not built-in**:
   ```javascript
   // ✅ Use AbortController for timeout
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 5000);
   
   try {
       const response = await fetch('/api/data', {
           signal: controller.signal
       });
       clearTimeout(timeout);
   } catch (err) {
       if (err.name === 'AbortError') {
           console.log('Request timed out');
       }
   }
   ```

---

## Error Handling Patterns

### With Promises

```javascript
fetchData()
    .then(processData)
    .then(saveData)
    .catch(error => {
        // Catches errors from any step above
        console.error('Error:', error);
    })
    .finally(() => {
        cleanup();
    });
```

### With async/await

```javascript
async function handleData() {
    try {
        const data = await fetchData();
        const processed = await processData(data);
        await saveData(processed);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        cleanup();
    }
}
```

### Combining Patterns

```javascript
async function fetchWithFallback(urls) {
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) return await response.json();
        } catch (err) {
            console.log(`${url} failed, trying next...`);
        }
    }
    throw new Error('All URLs failed');
}
```

---

## Common Patterns

### Retry with Exponential Backoff

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return await response.json();
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            const delay = Math.pow(2, i) * 1000;  // 1s, 2s, 4s
            console.log(`Retry ${i + 1} in ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}
```

### Timeout Wrapper

```javascript
function withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), ms);
    });
    return Promise.race([promise, timeout]);
}

// Usage
try {
    const data = await withTimeout(fetch('/api/slow'), 5000);
} catch (err) {
    if (err.message === 'Timeout') {
        console.log('Request timed out');
    }
}
```

### Sequential Async Processing

```javascript
// Process items one at a time
async function processSequentially(items) {
    const results = [];
    for (const item of items) {
        const result = await processItem(item);
        results.push(result);
    }
    return results;
}
```

### Parallel with Limit

```javascript
async function parallelWithLimit(items, limit, fn) {
    const results = [];
    const executing = new Set();
    
    for (const item of items) {
        const promise = fn(item).then(result => {
            executing.delete(promise);
            return result;
        });
        
        executing.add(promise);
        results.push(promise);
        
        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }
    
    return Promise.all(results);
}

// Usage: max 3 concurrent requests
await parallelWithLimit(urls, 3, url => fetch(url));
```

---

## Key Takeaways

| Concept | Key Points |
|---------|------------|
| **Callbacks** | Original pattern, error-first convention, leads to callback hell |
| **Promises** | Standard async interface, chainable, cannot cancel |
| **async/await** | Syntactic sugar, use try/catch, watch for sequential vs parallel |
| **Event Loop** | Microtasks before macrotasks, single-threaded |
| **Fetch** | Does NOT reject on HTTP errors, body reads once |

### Best Practices

1. **Always handle Promise rejections**
2. **Use async/await for cleaner code**
3. **Use `Promise.all` for parallel operations**
4. **Check `response.ok` with fetch**
5. **Use AbortController for cancellation/timeout**
6. **Avoid blocking the event loop with long sync operations**

---

> 💡 **Professional Tip**: Use browser DevTools Network tab to inspect async requests. The Performance tab can help visualize event loop behavior. In Node.js, use `--inspect` flag with Chrome DevTools for similar debugging capabilities.