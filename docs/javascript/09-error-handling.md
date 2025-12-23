# Error Handling & Debugging

> "The first principle is that you must not fool yourself — and you are the easiest person to fool." - Richard Feynman

Robust error handling is what separates production-ready code from hobby projects. Understanding JavaScript's error system, debugging techniques, and best practices is essential for professional development.

---

## JavaScript Error Types

### Professional Definition

JavaScript has a hierarchy of built-in error types, all extending from the `Error` constructor. Each error type signals a specific category of problem. Custom errors can extend `Error` to create domain-specific error types.

### Built-in Error Types

| Error Type | Description | Common Cause |
|------------|-------------|--------------|
| `Error` | Generic error | `throw new Error(msg)` |
| `SyntaxError` | Invalid code syntax | Parse-time errors |
| `ReferenceError` | Invalid reference | Undeclared variable |
| `TypeError` | Invalid type operation | `null.method()`, wrong type |
| `RangeError` | Value out of range | Invalid array length |
| `URIError` | Invalid URI | `decodeURI('%')` |
| `EvalError` | Error in `eval()` | Rarely used |
| `AggregateError` | Multiple errors | `Promise.any()` failure |

### Error Object Properties

```javascript
try {
    throw new Error('Something went wrong');
} catch (error) {
    error.name;       // "Error"
    error.message;    // "Something went wrong"
    error.stack;      // Stack trace (non-standard but universal)
    
    // Some browsers add:
    error.fileName;   // File where error occurred
    error.lineNumber; // Line number
    error.columnNumber; // Column number
}
```

### Limitations & Caveats

1. **`SyntaxError` cannot be caught at runtime**:
   ```javascript
   // ❌ Parse error - happens before execution
   try {
       const x = ;  // SyntaxError
   } catch (e) {
       // Never reached - script doesn't run at all
   }
   
   // ✅ Dynamic code syntax errors CAN be caught
   try {
       eval('const x = ;');
   } catch (e) {
       console.log(e.name);  // "SyntaxError"
   }
   ```

2. **Stack traces are not standardized**:
   ```javascript
   // Stack trace format varies by browser/engine
   // V8 (Chrome, Node.js)
   Error: message
       at functionName (file.js:10:5)
       at otherFunction (file.js:20:3)
   
   // SpiderMonkey (Firefox)
   functionName@file.js:10:5
   otherFunction@file.js:20:3
   
   // Stack trace limit
   Error.stackTraceLimit = 50;  // V8: set max frames
   ```

3. **Error.cause (ES2022)**:
   ```javascript
   try {
       await fetchData();
   } catch (error) {
       throw new Error('Failed to fetch data', { cause: error });
   }
   
   // Later:
   catch (error) {
       console.log(error.cause);  // Original error
   }
   ```

---

## try/catch/finally

### Professional Definition

`try/catch/finally` is the standard mechanism for handling runtime exceptions. Code in the `try` block is executed; if an exception is thrown, control transfers to `catch`. The `finally` block always executes, regardless of whether an exception occurred.

### Technical Specifications

| Clause | Execution | Optional |
|--------|-----------|----------|
| `try` | Always | No |
| `catch` | Only if exception thrown | Yes (if finally present) |
| `finally` | Always | Yes (if catch present) |

### Behavior Details

```javascript
function example() {
    try {
        console.log('try');
        throw new Error('oops');
        console.log('after throw');  // Never reached
    } catch (error) {
        console.log('catch:', error.message);
        return 'catch return';  // Queued, finally runs first
    } finally {
        console.log('finally');
        // return 'finally return';  // Would override catch return!
    }
}

console.log(example());
// Output:
// try
// catch: oops
// finally
// catch return
```

### Limitations & Caveats

1. **`finally` return overrides `try`/`catch` return**:
   ```javascript
   function dangerous() {
       try {
           return 'try';
       } finally {
           return 'finally';  // Overrides!
       }
   }
   dangerous();  // 'finally' (not 'try')
   
   function alsoDangerous() {
       try {
           throw new Error('oops');
       } catch (e) {
           return 'catch';
       } finally {
           return 'finally';  // Swallows the error!
       }
   }
   alsoDangerous();  // 'finally' (error not re-thrown)
   ```

2. **Cannot catch asynchronous errors**:
   ```javascript
   // ❌ try/catch doesn't catch async errors
   try {
       setTimeout(() => {
           throw new Error('async error');  // Not caught!
       }, 0);
   } catch (e) {
       console.log('caught');  // Never runs
   }
   
   // ✅ Handle errors inside the callback
   setTimeout(() => {
       try {
           throw new Error('async error');
       } catch (e) {
           console.log('caught inside');
       }
   }, 0);
   ```

3. **Optional catch binding (ES2019)**:
   ```javascript
   // Old syntax - must name the error
   try {
       JSON.parse(invalid);
   } catch (e) {  // 'e' required
       console.log('Parse failed');
   }
   
   // New syntax - can omit error variable
   try {
       JSON.parse(invalid);
   } catch {  // No variable needed
       console.log('Parse failed');
   }
   ```

4. **Performance impact**:
   ```javascript
   // try/catch in hot paths may prevent some optimizations
   // (Less of an issue in modern engines)
   
   // ✅ Better: validate before rather than catch after
   if (typeof value === 'string') {
       value.toUpperCase();
   }
   
   // Rather than:
   try {
       value.toUpperCase();
   } catch (e) {}
   ```

---

## Throwing Errors

### Professional Definition

The `throw` statement raises an exception, transferring control to the nearest enclosing `catch` block. Any value can be thrown, but throwing `Error` instances (or subclasses) is the convention, as they include stack traces.

### Best Practices

```javascript
// ✅ Throw Error instances
throw new Error('Something went wrong');
throw new TypeError('Expected string');
throw new RangeError('Value must be between 0 and 100');

// ❌ Avoid throwing primitives (no stack trace)
throw 'error';  // Works but bad practice
throw 404;      // Works but bad practice
throw { message: 'error' };  // No stack trace!
```

### When to Throw

```javascript
// ✅ Throw for programmer errors (bugs)
function divide(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new TypeError('Arguments must be numbers');
    }
    if (b === 0) {
        throw new RangeError('Cannot divide by zero');
    }
    return a / b;
}

// ✅ Throw for exceptional conditions
async function fetchUser(id) {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
}

// ❌ Don't use exceptions for normal control flow
// Instead of throwing for "not found", return null or use Maybe pattern
function findUser(users, id) {
    return users.find(u => u.id === id) ?? null;  // Return null, don't throw
}
```

---

## Custom Error Classes

### Professional Definition

Custom error classes extend the built-in `Error` class to create domain-specific error types. They enable precise error handling through `instanceof` checks and can carry additional context.

### Implementation

```javascript
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        
        // Maintains proper stack trace (V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ValidationError);
        }
    }
}

class NetworkError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
        this.response = response;
    }
    
    get isClientError() {
        return this.statusCode >= 400 && this.statusCode < 500;
    }
    
    get isServerError() {
        return this.statusCode >= 500;
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
```

### Usage

```javascript
async function processForm(data) {
    try {
        if (!data.email) {
            throw new ValidationError('Email is required', 'email');
        }
        
        const response = await submitForm(data);
        return response;
        
    } catch (error) {
        if (error instanceof ValidationError) {
            highlightField(error.field);
            showMessage(error.message);
        } else if (error instanceof NetworkError) {
            if (error.isServerError) {
                showMessage('Server error, please try later');
            } else {
                showMessage('Please check your input');
            }
        } else if (error instanceof AuthenticationError) {
            redirectToLogin();
        } else {
            // Unexpected error - log and re-throw
            console.error('Unexpected error:', error);
            throw error;
        }
    }
}
```

### Limitations & Caveats

1. **`instanceof` may fail across realms**:
   ```javascript
   // Errors from iframes or different contexts may not pass instanceof
   const iframeError = iframe.contentWindow.eval('new Error()');
   iframeError instanceof Error;  // false!
   
   // ✅ Check by name instead
   error.name === 'ValidationError';
   ```

2. **Must call `super()` first in constructor**:
   ```javascript
   class MyError extends Error {
       constructor(message) {
           // ❌ Cannot use 'this' before super()
           this.custom = 'value';  // ReferenceError
           super(message);
       }
   }
   
   // ✅ Correct order
   class MyError extends Error {
       constructor(message) {
           super(message);
           this.custom = 'value';  // OK after super()
       }
   }
   ```

3. **`Error.captureStackTrace` is V8-specific**:
   ```javascript
   class CustomError extends Error {
       constructor(message) {
           super(message);
           this.name = 'CustomError';
           
           // Only available in V8 (Chrome, Node.js)
           if (Error.captureStackTrace) {
               Error.captureStackTrace(this, CustomError);
           }
       }
   }
   ```

---

## Async Error Handling

### Promises

```javascript
// .catch() for promise errors
fetchData()
    .then(processData)
    .then(saveData)
    .catch(error => {
        // Catches rejection from any step above
        console.error('Pipeline failed:', error);
    })
    .finally(() => {
        hideSpinner();
    });

// Error in .then() propagates to .catch()
Promise.resolve('data')
    .then(data => {
        throw new Error('Processing failed');
    })
    .catch(error => {
        console.error('Caught:', error.message);
    });
```

### Async/Await

```javascript
async function processData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return transform(data);
    } catch (error) {
        // Catches: network errors, HTTP errors, JSON parse errors
        console.error('Failed:', error);
        throw error;  // Re-throw if can't handle
    }
}
```

### Limitations & Caveats

1. **Unhandled Promise rejections**:
   ```javascript
   // ❌ Unhandled - causes warning/error in Node.js
   Promise.reject(new Error('Unhandled'));
   
   async function leaky() {
       throw new Error('Also unhandled');
   }
   leaky();  // No await, no .catch() - unhandled!
   
   // ✅ Always handle Promise rejections
   promise.catch(handleError);
   await promise;  // Or use try/catch
   
   // ✅ Global handler (safety net, not solution)
   window.addEventListener('unhandledrejection', event => {
       console.error('Unhandled rejection:', event.reason);
       event.preventDefault();
   });
   
   // Node.js
   process.on('unhandledRejection', (reason, promise) => {
       console.error('Unhandled rejection:', reason);
   });
   ```

2. **`forEach` with async doesn't work as expected**:
   ```javascript
   // ❌ Errors in async forEach callbacks are unhandled
   [1, 2, 3].forEach(async (n) => {
       await mightFail(n);  // Rejection not caught!
   });
   
   // ✅ Use for...of or Promise.all
   for (const n of [1, 2, 3]) {
       await mightFail(n);  // Can catch with try/catch
   }
   
   // Or
   await Promise.all([1, 2, 3].map(async (n) => {
       await mightFail(n);
   }));  // Single rejection fails all
   ```

3. **Error handling in Promise.all vs Promise.allSettled**:
   ```javascript
   // Promise.all - fails fast on first rejection
   try {
       const results = await Promise.all([
           fetchUser(),
           fetchPosts(),
           fetchComments()
       ]);
   } catch (error) {
       // One failed, but which one?
       // Other results lost
   }
   
   // Promise.allSettled - always resolves
   const results = await Promise.allSettled([
       fetchUser(),
       fetchPosts(),
       fetchComments()
   ]);
   
   results.forEach((result, i) => {
       if (result.status === 'fulfilled') {
           console.log(`Success ${i}:`, result.value);
       } else {
           console.error(`Failed ${i}:`, result.reason);
       }
   });
   ```

4. **Rethrowing preserves stack trace**:
   ```javascript
   async function wrapper() {
       try {
           await innerFunction();
       } catch (error) {
           // ✅ Rethrow original error
           throw error;
           
           // ❌ Wrapping loses original stack
           throw new Error('Wrapper failed');
           
           // ✅ ES2022: use cause
           throw new Error('Wrapper failed', { cause: error });
       }
   }
   ```

---

## Debugging Techniques

### Console Methods

| Method | Purpose | Use Case |
|--------|---------|----------|
| `console.log()` | General output | Basic debugging |
| `console.error()` | Error output | Errors (red in console) |
| `console.warn()` | Warning output | Warnings (yellow) |
| `console.info()` | Info output | Information |
| `console.debug()` | Debug output | Verbose debugging |
| `console.table()` | Tabular output | Arrays/objects |
| `console.dir()` | Object structure | DOM elements |
| `console.trace()` | Stack trace | Call origin |
| `console.group()` | Grouped output | Nested logs |
| `console.time()` | Timing | Performance |
| `console.count()` | Call counting | Execution count |
| `console.assert()` | Assertion | Test conditions |

```javascript
// Timing
console.time('operation');
heavyOperation();
console.timeEnd('operation');  // operation: 123.45ms

// Counting
function handleClick() {
    console.count('click');  // click: 1, click: 2, ...
}

// Grouping
console.group('User Details');
console.log('Name:', user.name);
console.log('Age:', user.age);
console.groupEnd();

// Assertion
console.assert(value > 0, 'Value must be positive');

// Table
console.table([{ name: 'Andrei', age: 30 }, { name: 'John', age: 25 }]);

// Stack trace
function inner() {
    console.trace('Trace from inner');
}
function outer() {
    inner();
}
outer();
```

### Debugger Statement

```javascript
function processData(data) {
    // Execution pauses here when DevTools is open
    debugger;
    
    return data.map(item => {
        debugger;  // Pause in each iteration
        return transform(item);
    });
}
```

### Chrome DevTools Features

```javascript
// Conditional breakpoints
// Right-click line number → "Add conditional breakpoint"
// Pause only when: user.role === 'admin'

// Logpoints (log without pausing)
// Right-click → "Add logpoint"
// Logs expression without stopping

// Break on exceptions
// Sources panel → Toggle "Pause on exceptions"
// Optionally pause on caught exceptions too

// Watch expressions
// Add variables/expressions to watch panel
// Updates as you step through code

// Call stack inspection
// See all frames, click to navigate
// Restart frame to re-execute function

// Blackboxing
// Skip stepping into library code
// Settings → Blackboxing → Add pattern
```

---

## Global Error Handlers

### Browser

```javascript
// Synchronous errors
window.onerror = function(message, source, lineno, colno, error) {
    console.error({
        message,
        source,
        lineno,
        colno,
        stack: error?.stack
    });
    
    // Return true to prevent default browser error handling
    return true;
};

// Alternative
window.addEventListener('error', event => {
    console.error('Error:', event.error);
});

// Unhandled Promise rejections
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled rejection:', event.reason);
    event.preventDefault();  // Prevent console error
});
```

### Node.js

```javascript
// Uncaught exceptions
process.on('uncaughtException', (error, origin) => {
    console.error('Uncaught exception:', error);
    console.error('Origin:', origin);
    
    // Log error, then exit (process is in undefined state)
    process.exit(1);
});

// Unhandled Promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection:', reason);
});

// Warning events
process.on('warning', warning => {
    console.warn('Warning:', warning.name, warning.message);
});
```

### Limitations & Caveats

1. **Global handlers are last resort**:
   ```javascript
   // Use for logging/monitoring, not recovery
   // By the time global handler runs, state may be corrupted
   
   // ✅ Handle errors locally when possible
   // Use global handlers for unhandled cases only
   ```

2. **`window.onerror` can't catch all errors**:
   ```javascript
   // Cannot catch errors in:
   // - Cross-origin scripts without CORS
   // - Syntax errors in initial script load
   // - Some network errors
   
   // For cross-origin:
   // <script src="..." crossorigin="anonymous">
   // Server must send: Access-Control-Allow-Origin
   ```

---

## Error Boundaries (React Pattern)

```javascript
// React error boundary concept (applicable elsewhere)
class ErrorBoundary {
    constructor() {
        this.hasError = false;
        this.error = null;
    }
    
    try(fn) {
        if (this.hasError) {
            return this.fallback();
        }
        
        try {
            return fn();
        } catch (error) {
            this.hasError = true;
            this.error = error;
            this.logError(error);
            return this.fallback();
        }
    }
    
    async tryAsync(fn) {
        if (this.hasError) {
            return this.fallback();
        }
        
        try {
            return await fn();
        } catch (error) {
            this.hasError = true;
            this.error = error;
            this.logError(error);
            return this.fallback();
        }
    }
    
    fallback() {
        return { error: true, message: 'Something went wrong' };
    }
    
    logError(error) {
        // Send to monitoring service
        console.error('Error caught by boundary:', error);
    }
    
    reset() {
        this.hasError = false;
        this.error = null;
    }
}
```

---

## Best Practices

### 1. Fail Fast

```javascript
// ✅ Validate early, throw immediately
function processUser(user) {
    if (!user) {
        throw new Error('User is required');
    }
    if (!user.email) {
        throw new ValidationError('Email is required', 'email');
    }
    
    // Now we know user and email are valid
    return sendEmail(user.email);
}
```

### 2. Handle Errors at the Right Level

```javascript
// Low level: Throw specific error
async function fetchUser(id) {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
        throw new NetworkError('Failed to fetch user', response.status);
    }
    return response.json();
}

// Mid level: Translate or re-throw
async function getUserProfile(id) {
    try {
        const user = await fetchUser(id);
        return enrichProfile(user);
    } catch (error) {
        if (error instanceof NetworkError && error.statusCode === 404) {
            return null;  // Expected case - handle it
        }
        throw error;  // Unexpected - let it propagate
    }
}

// Top level: Handle all, never crash
async function displayProfile(id) {
    try {
        const profile = await getUserProfile(id);
        if (!profile) {
            showNotFound();
        } else {
            render(profile);
        }
    } catch (error) {
        logToService(error);
        showGenericError();
    }
}
```

### 3. Provide Context

```javascript
// ❌ Generic error
throw new Error('Failed');

// ✅ Contextual error
throw new Error(`Failed to process order ${orderId}: ${reason}`);

// ✅ With cause (ES2022)
try {
    await processPayment(order);
} catch (error) {
    throw new Error(`Order ${orderId} payment failed`, { cause: error });
}
```

### 4. Don't Swallow Errors

```javascript
// ❌ Swallowing errors (hiding bugs)
try {
    riskyOperation();
} catch (e) {
    // Silent failure - bugs hidden!
}

// ✅ At minimum, log errors
try {
    riskyOperation();
} catch (e) {
    console.error('Operation failed:', e);
}

// ✅ Or re-throw if you can't handle
try {
    riskyOperation();
} catch (e) {
    cleanup();
    throw e;
}
```

---

## Key Takeaways

| Concept | Key Points |
|---------|------------|
| **Error Types** | Use specific types, throw Error instances |
| **try/catch** | Sync only, finally always runs |
| **Custom Errors** | Extend Error, add context |
| **Async Errors** | Use try/catch with await, .catch() with promises |
| **Global Handlers** | Last resort for monitoring, not recovery |
| **Debugging** | Use breakpoints, console methods, DevTools |

### Error Handling Checklist

- [ ] Validate inputs early (fail fast)
- [ ] Use appropriate error types
- [ ] Include context in error messages
- [ ] Handle errors at the right level
- [ ] Always handle Promise rejections
- [ ] Log errors with stack traces
- [ ] Never swallow errors silently
- [ ] Test error scenarios

---

> 💡 **Professional Tip**: Set up error monitoring (Sentry, LogRocket, etc.) in production. Seeing real errors with full context (user, device, stack trace) is invaluable. Always include error boundaries at application edges to prevent complete crashes.
> 💡 **Andrei's Advice**: "The best error handling is invisible to users but visible to developers. Users should see friendly messages; developers should see detailed logs. Never show stack traces to users, but always log them for yourself."
> 💡 **Andrei's Advice**: "The best error handling is invisible to users but visible to developers. Users should see friendly messages; developers should see detailed logs. Never show stack traces to users, but always log them for yourself."