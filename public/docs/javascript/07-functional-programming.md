# Functional Programming in JavaScript

> "The first principle is that you must not fool yourself — and you are the easiest person to fool." - Richard Feynman

Functional Programming (FP) is a paradigm that treats computation as the evaluation of mathematical functions, emphasizing immutability, pure functions, and declarative code. JavaScript is a multi-paradigm language that supports FP patterns.

---

## Pure Functions

### Professional Definition

A **pure function** is a function that: (1) always returns the same output for the same input (**deterministic**), and (2) has no **side effects** (doesn't modify external state, I/O, or mutable arguments). Pure functions are the foundation of functional programming.

### Technical Specifications

| Property | Pure Function | Impure Function |
|----------|---------------|-----------------|
| Same input → Same output | Yes | No |
| Side effects | None | May have |
| Depends on external state | No | May |
| Modifies arguments | No | May |
| I/O operations | No | May |
| Random values | No | May |
| Current time | No | May |

### Examples

```javascript
// ✅ Pure function
function add(a, b) {
    return a + b;
}

// ✅ Pure function
function getFullName(user) {
    return `${user.firstName} ${user.lastName}`;
}

// ❌ Impure - depends on external state
let tax = 0.1;
function calculateTotal(price) {
    return price + (price * tax);  // Depends on external 'tax'
}

// ❌ Impure - modifies external state
let counter = 0;
function increment() {
    counter++;  // Side effect
    return counter;
}

// ❌ Impure - modifies argument
function addItem(arr, item) {
    arr.push(item);  // Mutates input
    return arr;
}

// ✅ Pure version
function addItemPure(arr, item) {
    return [...arr, item];  // Returns new array
}

// ❌ Impure - I/O
function logAndReturn(value) {
    console.log(value);  // Side effect (I/O)
    return value;
}

// ❌ Impure - non-deterministic
function getRandomId() {
    return Math.random();  // Different each time
}
```

### Limitations & Caveats

1. **All useful programs need side effects eventually**:
   ```javascript
   // At some point you need to:
   // - Write to DOM
   // - Make HTTP requests
   // - Write to database
   
   // Strategy: Push side effects to the edges
   // Core logic: Pure functions
   // Boundaries: Impure (controlled)
   ```

2. **Reference equality issues**:
   ```javascript
   // Pure functions returning objects create new references
   function getUser() {
       return { name: 'Andrei' };
   }
   
   getUser() === getUser();  // false (different objects)
   
   // May affect React renders, memoization, etc.
   ```

3. **Performance considerations**:
   ```javascript
   // Creating new objects/arrays can be slower than mutation
   // But often negligible and enables optimizations
   
   // Pure (creates new array each time)
   const doubled = arr.map(x => x * 2);
   
   // Impure but faster (mutates)
   arr.forEach((x, i, a) => { a[i] = x * 2; });
   ```

---

## Immutability

### Professional Definition

**Immutability** means data cannot be changed after creation. Instead of modifying existing data, new data structures are created with the desired changes. This prevents unintended side effects and makes code more predictable.

### Immutable Update Patterns

```javascript
// Objects - spread operator
const user = { name: 'Andrei', age: 30 };
const olderUser = { ...user, age: 31 };

// Arrays - spread, concat, slice
const arr = [1, 2, 3];
const withFour = [...arr, 4];           // Add
const withoutTwo = arr.filter(x => x !== 2);  // Remove
const doubled = arr.map(x => x * 2);    // Transform

// Nested objects
const state = {
    user: { name: 'Andrei', address: { city: 'Toronto' } }
};

const newState = {
    ...state,
    user: {
        ...state.user,
        address: {
            ...state.user.address,
            city: 'Vancouver'
        }
    }
};
```

### Limitations & Caveats

1. **Shallow vs Deep immutability**:
   ```javascript
   const original = { nested: { value: 1 } };
   const copy = { ...original };
   
   copy.nested.value = 2;
   console.log(original.nested.value);  // 2 - affected!
   
   // Spread only copies top level
   // For deep copy: structuredClone() or JSON.parse/stringify
   ```

2. **`Object.freeze()` is shallow**:
   ```javascript
   const obj = Object.freeze({ 
       nested: { value: 1 } 
   });
   
   obj.nested.value = 2;  // Works! Nested object not frozen
   console.log(obj.nested.value);  // 2
   
   // Deep freeze requires recursion
   function deepFreeze(obj) {
       Object.freeze(obj);
       Object.values(obj).forEach(v => {
           if (typeof v === 'object' && v !== null) {
               deepFreeze(v);
           }
       });
       return obj;
   }
   ```

3. **`const` doesn't mean immutable**:
   ```javascript
   const arr = [1, 2, 3];
   arr.push(4);  // Works! const prevents reassignment, not mutation
   
   const obj = { a: 1 };
   obj.a = 2;    // Works!
   ```

4. **Performance with large data structures**:
   ```javascript
   // Creating new objects/arrays for every change can be expensive
   // Solutions:
   // - Structural sharing (Immutable.js)
   // - Immer (copy-on-write)
   
   import { produce } from 'immer';
   
   const nextState = produce(state, draft => {
       draft.nested.deep.value = 42;  // Looks mutable, but isn't!
   });
   ```

---

## Higher-Order Functions

### Professional Definition

A **Higher-Order Function (HOF)** is a function that either (1) takes one or more functions as arguments, or (2) returns a function. HOFs enable abstraction over actions, not just values.

### Built-in Array HOFs

| Method | Purpose | Returns |
|--------|---------|---------|
| `map(fn)` | Transform each element | New array (same length) |
| `filter(fn)` | Select elements passing test | New array (≤ length) |
| `reduce(fn, init)` | Accumulate to single value | Single value |
| `forEach(fn)` | Execute for each element | undefined |
| `find(fn)` | Find first matching element | Element or undefined |
| `findIndex(fn)` | Find index of first match | Index or -1 |
| `some(fn)` | Test if any element matches | Boolean |
| `every(fn)` | Test if all elements match | Boolean |
| `flatMap(fn)` | Map then flatten one level | New array |
| `sort(fn)` | Sort (mutates!) | Same array |

### Limitations & Caveats

1. **`map`/`filter`/`reduce` cannot be broken out of**:
   ```javascript
   // ❌ Cannot use break
   [1, 2, 3].map(x => {
       if (x === 2) break;  // SyntaxError
   });
   
   // ✅ Use for...of if you need break
   for (const x of [1, 2, 3]) {
       if (x === 2) break;
   }
   
   // Or use find/findIndex/some/every for early exit
   ```

2. **`forEach` returns undefined**:
   ```javascript
   const result = [1, 2, 3].forEach(x => x * 2);
   console.log(result);  // undefined
   
   // Use map if you need the results
   const result = [1, 2, 3].map(x => x * 2);  // [2, 4, 6]
   ```

3. **`reduce` without initial value on empty array throws**:
   ```javascript
   [].reduce((a, b) => a + b);  // TypeError
   [].reduce((a, b) => a + b, 0);  // 0 (OK with initial value)
   ```

4. **`sort` mutates the original array**:
   ```javascript
   const arr = [3, 1, 2];
   arr.sort();  // Mutates arr!
   
   // ✅ Create copy first
   const sorted = [...arr].sort();
   
   // ES2023: toSorted() returns new array
   const sorted = arr.toSorted();
   ```

5. **Callback `this` binding**:
   ```javascript
   const obj = {
       multiplier: 2,
       
       // ❌ 'this' is undefined in callback
       double(arr) {
           return arr.map(function(x) {
               return x * this.multiplier;  // undefined
           });
       },
       
       // ✅ Solution 1: Arrow function
       doubleArrow(arr) {
           return arr.map(x => x * this.multiplier);
       },
       
       // ✅ Solution 2: thisArg parameter
       doubleThis(arr) {
           return arr.map(function(x) {
               return x * this.multiplier;
           }, this);  // Second argument is thisArg
       }
   };
   ```

### Creating HOFs

```javascript
// Function that returns a function
function createMultiplier(factor) {
    return function(number) {
        return number * factor;
    };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

double(5);  // 10
triple(5);  // 15

// Function that takes a function
function repeat(n, action) {
    for (let i = 0; i < n; i++) {
        action(i);
    }
}

repeat(3, console.log);  // 0, 1, 2
```

---

## Function Composition

### Professional Definition

**Function composition** is combining simple functions to build complex ones. If `f` and `g` are functions, their composition `f ∘ g` is a function that applies `g` first, then `f`: `(f ∘ g)(x) = f(g(x))`.

### Implementation

```javascript
// Right-to-left composition
const compose = (...fns) => (x) => 
    fns.reduceRight((acc, fn) => fn(acc), x);

// Left-to-right composition (pipe)
const pipe = (...fns) => (x) => 
    fns.reduce((acc, fn) => fn(acc), x);

// Example
const addOne = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const composed = compose(square, double, addOne);
composed(2);  // square(double(addOne(2))) = square(double(3)) = square(6) = 36

const piped = pipe(addOne, double, square);
piped(2);  // square(double(addOne(2))) = 36 (same result, different reading order)
```

### Limitations & Caveats

1. **Only works with unary functions**:
   ```javascript
   const add = (a, b) => a + b;  // Binary function
   const double = x => x * 2;
   
   // ❌ Cannot compose directly
   const composed = pipe(add, double);  // Won't work as expected
   
   // ✅ Curry first
   const addCurried = a => b => a + b;
   const add5 = addCurried(5);
   const composed = pipe(add5, double);
   composed(3);  // double(add5(3)) = double(8) = 16
   ```

2. **Debugging can be harder**:
   ```javascript
   // Hard to debug composed functions
   const result = pipe(fn1, fn2, fn3, fn4, fn5)(input);
   
   // Add a tap/trace function for debugging
   const trace = label => value => {
       console.log(label, value);
       return value;
   };
   
   const result = pipe(
       fn1,
       trace('after fn1'),
       fn2,
       trace('after fn2'),
       fn3
   )(input);
   ```

3. **Error handling across composed functions**:
   ```javascript
   // Errors in any function break the chain
   // Consider Result/Either types for explicit error handling
   
   const Result = {
       ok: value => ({ isOk: true, value }),
       err: error => ({ isOk: false, error })
   };
   
   const safeDiv = (a, b) => 
       b === 0 ? Result.err('Division by zero') : Result.ok(a / b);
   ```

---

## Currying

### Professional Definition

**Currying** transforms a function with multiple arguments into a sequence of functions, each taking a single argument. Given `f(a, b, c)`, currying produces `f(a)(b)(c)`. This enables **partial application** - fixing some arguments to create specialized functions.

### Implementation

```javascript
// Manual currying
const add = a => b => c => a + b + c;
add(1)(2)(3);  // 6

// Generic curry function
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        }
        return function(...moreArgs) {
            return curried.apply(this, args.concat(moreArgs));
        };
    };
}

// Usage
const multiply = (a, b, c) => a * b * c;
const curriedMultiply = curry(multiply);

curriedMultiply(2)(3)(4);     // 24
curriedMultiply(2, 3)(4);     // 24
curriedMultiply(2)(3, 4);     // 24
curriedMultiply(2, 3, 4);     // 24
```

### Limitations & Caveats

1. **Depends on `fn.length` (arity)**:
   ```javascript
   // Rest parameters make length 0
   function varArgs(...args) {
       return args.reduce((a, b) => a + b);
   }
   console.log(varArgs.length);  // 0
   
   // Default parameters may not be counted
   function withDefault(a, b = 1) {}
   console.log(withDefault.length);  // 1 (not 2)
   ```

2. **Performance overhead**:
   ```javascript
   // Each curried call creates a new function
   // For hot paths, regular function calls may be faster
   
   // Profile before optimizing!
   ```

3. **Debugging stack traces**:
   ```javascript
   // Anonymous functions in curry chain make debugging harder
   // Use named function expressions where possible
   ```

4. **Argument order matters**:
   ```javascript
   // Data-last is better for composition
   const filter = predicate => array => array.filter(predicate);
   const map = fn => array => array.map(fn);
   
   // Can compose easily
   const transform = pipe(
       filter(x => x > 0),
       map(x => x * 2)
   );
   ```

---

## Partial Application

### Professional Definition

**Partial application** fixes a number of arguments to a function, producing a new function with fewer arguments. Unlike currying (which produces unary functions), partial application can fix any number of arguments.

```javascript
// Using bind for partial application
const multiply = (a, b, c) => a * b * c;
const multiplyBy2 = multiply.bind(null, 2);
multiplyBy2(3, 4);  // 24

// Custom partial function
function partial(fn, ...presetArgs) {
    return function(...laterArgs) {
        return fn(...presetArgs, ...laterArgs);
    };
}

const greet = (greeting, name, punctuation) => 
    `${greeting}, ${name}${punctuation}`;

const sayHello = partial(greet, 'Hello');
sayHello('Andrei', '!');  // "Hello, Andrei!"

const sayHelloToAndrei = partial(greet, 'Hello', 'Andrei');
sayHelloToAndrei('?');  // "Hello, Andrei?"
```

---

## Recursion

### Professional Definition

**Recursion** is when a function calls itself to solve a problem by breaking it into smaller subproblems. Every recursive function needs a **base case** (termination condition) and a **recursive case** (self-call with progress toward base case).

```javascript
// Factorial: n! = n * (n-1)!
function factorial(n) {
    if (n <= 1) return 1;      // Base case
    return n * factorial(n - 1); // Recursive case
}

// Fibonacci
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
```

### Limitations & Caveats

1. **Stack overflow risk**:
   ```javascript
   function countdown(n) {
       if (n <= 0) return;
       console.log(n);
       countdown(n - 1);
   }
   
   countdown(100000);  // RangeError: Maximum call stack size exceeded
   
   // Solutions:
   // 1. Convert to iteration
   // 2. Trampoline pattern
   // 3. Tail call optimization (limited support)
   ```

2. **Exponential time complexity**:
   ```javascript
   // Naive Fibonacci is O(2^n)
   fibonacci(40);  // Very slow!
   
   // ✅ Use memoization
   const fibMemo = (() => {
       const cache = {};
       return function fib(n) {
           if (n in cache) return cache[n];
           if (n <= 1) return n;
           return cache[n] = fib(n - 1) + fib(n - 2);
       };
   })();
   
   fibMemo(40);  // Fast!
   ```

3. **Tail Call Optimization (TCO)**:
   ```javascript
   // TCO allows tail-recursive functions to run in O(1) stack space
   // Only Safari fully supports it
   
   // ❌ Not tail recursive (does multiplication after call)
   function factorial(n) {
       if (n <= 1) return 1;
       return n * factorial(n - 1);  // Multiplication after recursive call
   }
   
   // ✅ Tail recursive (call is last operation)
   function factorialTCO(n, acc = 1) {
       if (n <= 1) return acc;
       return factorialTCO(n - 1, n * acc);  // Last operation is call
   }
   ```

4. **Trampoline pattern for deep recursion**:
   ```javascript
   const trampoline = fn => (...args) => {
       let result = fn(...args);
       while (typeof result === 'function') {
           result = result();
       }
       return result;
   };
   
   const sumRange = trampoline(function sum(n, acc = 0) {
       if (n <= 0) return acc;
       return () => sum(n - 1, acc + n);  // Return thunk instead of calling
   });
   
   sumRange(100000);  // Works without stack overflow
   ```

---

## Memoization

### Professional Definition

**Memoization** is an optimization technique that caches function results based on arguments. Subsequent calls with the same arguments return the cached result instead of recomputing.

```javascript
function memoize(fn) {
    const cache = new Map();
    
    return function(...args) {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

const expensiveCalc = memoize((n) => {
    console.log('Computing...');
    return n * 2;
});

expensiveCalc(5);  // Computing... 10
expensiveCalc(5);  // 10 (cached, no log)
```

### Limitations & Caveats

1. **Only works with pure functions**:
   ```javascript
   // ❌ Don't memoize impure functions
   const getTime = memoize(() => Date.now());
   getTime();  // Returns same cached time forever!
   ```

2. **Memory growth**:
   ```javascript
   // Cache grows unbounded
   // Consider LRU cache for long-running applications
   
   function memoizeWithLimit(fn, maxSize = 100) {
       const cache = new Map();
       
       return function(...args) {
           const key = JSON.stringify(args);
           
           if (cache.has(key)) {
               const value = cache.get(key);
               // Move to end (most recently used)
               cache.delete(key);
               cache.set(key, value);
               return value;
           }
           
           const result = fn.apply(this, args);
           cache.set(key, result);
           
           // Remove oldest if over limit
           if (cache.size > maxSize) {
               const firstKey = cache.keys().next().value;
               cache.delete(firstKey);
           }
           
           return result;
       };
   }
   ```

3. **Key serialization issues**:
   ```javascript
   // Objects with same content have different JSON
   memoizedFn({ a: 1 });  // Cache key: '{"a":1}'
   memoizedFn({ a: 1 });  // Different object, but same key - works!
   
   // But order matters in JSON
   memoizedFn({ a: 1, b: 2 });  // '{"a":1,"b":2}'
   memoizedFn({ b: 2, a: 1 });  // '{"b":2,"a":1}' - cache miss!
   
   // Functions, undefined, symbols are lost in JSON.stringify
   ```

4. **`this` context issues**:
   ```javascript
   const obj = {
       multiplier: 2,
       calc: memoize(function(n) {
           return n * this.multiplier;  // 'this' must be handled
       })
   };
   ```

---

## Functors and Monads (Introduction)

### Professional Definition

A **Functor** is a type that implements `map`, allowing transformation of values while keeping the container structure. A **Monad** is a functor that also implements `flatMap` (or `chain`), allowing sequencing of computations that return wrapped values.

```javascript
// Array is a Functor
[1, 2, 3].map(x => x * 2);  // [2, 4, 6]

// Promise is a Monad
Promise.resolve(5)
    .then(x => x * 2)
    .then(x => Promise.resolve(x + 1));  // flatMap behavior

// Maybe Monad for null handling
const Maybe = {
    just: value => ({
        map: fn => Maybe.just(fn(value)),
        flatMap: fn => fn(value),
        getOrElse: () => value
    }),
    nothing: () => ({
        map: () => Maybe.nothing(),
        flatMap: () => Maybe.nothing(),
        getOrElse: defaultValue => defaultValue
    }),
    fromNullable: value => 
        value == null ? Maybe.nothing() : Maybe.just(value)
};

const result = Maybe.fromNullable(user)
    .map(u => u.address)
    .map(a => a.city)
    .getOrElse('Unknown');
```

---

## Key Takeaways

| Concept | Key Points |
|---------|------------|
| **Pure Functions** | Same input → same output, no side effects |
| **Immutability** | Don't mutate, create new data |
| **HOFs** | Functions that take/return functions |
| **Composition** | Combine simple functions into complex ones |
| **Currying** | Transform multi-arg to single-arg chain |
| **Recursion** | Watch for stack overflow, use memoization |
| **Memoization** | Cache for pure functions, mind memory growth |

### Best Practices

1. **Push side effects to the edges** of your program
2. **Prefer immutable operations** (`map`, `filter`, `reduce` over `forEach`)
3. **Compose small, focused functions** rather than large monolithic ones
4. **Use currying** for partial application and point-free style
5. **Memoize expensive pure computations**
6. **Consider iterative solutions** for deep recursion

---

> 💡 **Professional Tip**: JavaScript isn't a purely functional language - don't force FP everywhere. Use it where it improves clarity and maintainability. Libraries like Ramda, Lodash/fp, and fp-ts provide robust FP utilities if you need advanced patterns.