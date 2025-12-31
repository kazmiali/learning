# JavaScript Fundamentals

> "If you can't explain it simply, you don't understand it well enough." - Richard Feynman

---

## Variables and Data Types

### var, let, const

#### Professional Definition

JavaScript provides three variable declaration keywords: `var`, `let`, and `const`. These keywords differ in **scope**, **hoisting behavior**, **temporal dead zone (TDZ)**, and **reassignability**. Understanding these differences is critical for avoiding bugs related to variable shadowing, hoisting, and unintended mutations.

#### Simple Explanation

Think of variables like labeled boxes. `var` is an old-style box that can leak outside rooms. `let` is a modern box that stays where you put it. `const` is a sealed box - once you put something in, you can't replace it (but you can modify what's inside if it's an object).

#### Technical Specifications

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| Scope | Function-scoped | Block-scoped | Block-scoped |
| Hoisting | Hoisted, initialized as `undefined` | Hoisted, NOT initialized (TDZ) | Hoisted, NOT initialized (TDZ) |
| Redeclaration | Allowed in same scope | Not allowed | Not allowed |
| Reassignment | Allowed | Allowed | Not allowed |
| Global object property | Yes (in global scope) | No | No |
| Temporal Dead Zone | No | Yes | Yes |

#### Limitations & Caveats

1. **`var` hoisting pitfall**: Variables are hoisted but not their values
   ```javascript
   console.log(x);  // undefined (not ReferenceError!)
   var x = 5;
   ```

2. **`const` does NOT mean immutable**: Object/array contents can be modified
   ```javascript
   const arr = [1, 2, 3];
   arr.push(4);  // Allowed! arr is now [1, 2, 3, 4]
   arr = [];     // TypeError: Assignment to constant variable
   ```

3. **TDZ causes ReferenceError**: Accessing `let`/`const` before declaration
   ```javascript
   console.log(x);  // ReferenceError: Cannot access 'x' before initialization
   let x = 5;
   ```

4. **Block scope in loops**: `var` shares variable across iterations
   ```javascript
   for (var i = 0; i < 3; i++) {
       setTimeout(() => console.log(i), 100);
   }
   // Output: 3, 3, 3 (not 0, 1, 2)
   ```

5. **`const` requires initialization**: Must assign value at declaration
   ```javascript
   const x;  // SyntaxError: Missing initializer in const declaration
   ```

#### Best Practices

- **Default to `const`** - prevents accidental reassignment
- **Use `let`** when reassignment is needed
- **Never use `var`** in modern JavaScript (ES6+)
- **Use `Object.freeze()`** for truly immutable objects

#### Code Examples

```javascript
// Scope demonstration
function scopeDemo() {
    if (true) {
        var varVariable = "I leak out!";
        let letVariable = "I stay here";
        const constVariable = "I also stay here";
    }
    console.log(varVariable);    // "I leak out!"
    console.log(letVariable);    // ReferenceError
    console.log(constVariable);  // ReferenceError
}

// Hoisting demonstration
console.log(hoistedVar);   // undefined
console.log(hoistedLet);   // ReferenceError (TDZ)

var hoistedVar = "var value";
let hoistedLet = "let value";

// const with objects
const config = { debug: true };
config.debug = false;  // Allowed - modifying property
config = {};           // TypeError - reassigning const
```

---

### Primitive Types

#### Professional Definition

**Primitive types** are immutable, atomic data types that represent single values. JavaScript has **7 primitive types**: `string`, `number`, `boolean`, `undefined`, `null`, `symbol` (ES6), and `bigint` (ES2020). Primitives are **passed by value** and compared by value. They are stored directly in the **stack memory** for performance.

#### Simple Explanation

Primitives are the atoms of JavaScript - the simplest, indivisible values. When you copy a primitive, you get a completely independent copy, like photocopying a document.

#### Technical Specifications

| Type | typeof Result | Falsy Values | Notes |
|------|---------------|--------------|-------|
| `string` | `"string"` | `""` (empty string) | Immutable, UTF-16 encoded |
| `number` | `"number"` | `0`, `-0`, `NaN` | IEEE 754 double-precision (64-bit) |
| `boolean` | `"boolean"` | `false` | Only `true` or `false` |
| `undefined` | `"undefined"` | `undefined` | Uninitialized variables |
| `null` | `"object"` ⚠️ | `null` | Intentional absence of value |
| `symbol` | `"symbol"` | Never falsy | Unique, immutable identifiers |
| `bigint` | `"bigint"` | `0n` | Arbitrary precision integers |

#### Limitations & Caveats

1. **`typeof null === "object"`**: Historical bug, never fixed for compatibility
   ```javascript
   typeof null;  // "object" - NOT "null"!
   // Use strict equality to check for null
   value === null;
   ```

2. **Number precision limits**: 64-bit float has precision issues
   ```javascript
   0.1 + 0.2 === 0.3;  // false! (0.30000000000000004)
   Number.MAX_SAFE_INTEGER;  // 9007199254740991
   9007199254740992 === 9007199254740993;  // true! Precision lost
   ```

3. **NaN is not equal to itself**:
   ```javascript
   NaN === NaN;  // false
   Number.isNaN(NaN);  // true (use this instead)
   ```

4. **String immutability**: Methods return new strings
   ```javascript
   let str = "hello";
   str.toUpperCase();  // Returns "HELLO"
   console.log(str);   // Still "hello"
   str[0] = "H";       // Silently fails
   ```

5. **Symbol limitations**: Cannot be converted to string implicitly
   ```javascript
   const sym = Symbol("id");
   console.log("Symbol: " + sym);  // TypeError
   console.log(`Symbol: ${sym}`);  // TypeError
   console.log("Symbol: " + sym.toString());  // OK
   ```

6. **BigInt cannot mix with Number**:
   ```javascript
   10n + 5;  // TypeError: Cannot mix BigInt and other types
   10n + BigInt(5);  // 15n (OK)
   ```

#### Code Examples

```javascript
// Primitive immutability
let str = "hello";
let str2 = str;
str2 = "world";
console.log(str);   // "hello" - unchanged

// Type checking
typeof "hello";     // "string"
typeof 42;          // "number"
typeof true;        // "boolean"
typeof undefined;   // "undefined"
typeof null;        // "object" ⚠️ (historical bug)
typeof Symbol();    // "symbol"
typeof 42n;         // "bigint"

// Safe number checking
Number.isNaN(NaN);           // true
Number.isFinite(Infinity);   // false
Number.isInteger(5.0);       // true
Number.isSafeInteger(9007199254740992);  // false

// BigInt for large numbers
const bigNum = 9007199254740991n;
const bigger = bigNum + 1n;  // 9007199254740992n (precise!)
```

---

### Reference Types

#### Professional Definition

**Reference types** are objects stored in **heap memory**, with variables holding references (pointers) to their memory addresses. Reference types include `Object`, `Array`, `Function`, `Date`, `RegExp`, `Map`, `Set`, and custom objects. They are **passed by reference** and compared by reference identity, not structural equality.

#### Simple Explanation

Reference types are like giving someone your home address instead of a copy of your house. Multiple variables can point to the same object, so changes through one variable affect all references.

#### Technical Specifications

| Aspect | Primitives | Reference Types |
|--------|-----------|-----------------|
| Storage | Stack | Heap |
| Copying | Creates independent copy | Copies reference (pointer) |
| Comparison | By value | By reference (identity) |
| Mutability | Immutable | Mutable |
| typeof | Specific type | `"object"` or `"function"` |

#### Limitations & Caveats

1. **Shallow copy pitfall**: Spread operator only copies top level
   ```javascript
   const original = { a: 1, nested: { b: 2 } };
   const shallow = { ...original };
   shallow.nested.b = 999;
   console.log(original.nested.b);  // 999 - affected!
   ```

2. **Array/Object comparison**: Always compares references
   ```javascript
   [1, 2, 3] === [1, 2, 3];  // false (different references)
   {} === {};                // false
   JSON.stringify(a) === JSON.stringify(b);  // Workaround (has limitations)
   ```

3. **Pass by reference confusion**:
   ```javascript
   function modify(obj) {
       obj.x = 10;      // Modifies original
       obj = { x: 20 }; // Creates new local reference
   }
   const myObj = { x: 1 };
   modify(myObj);
   console.log(myObj.x);  // 10 (not 20)
   ```

4. **`typeof` limitations for objects**:
   ```javascript
   typeof [];        // "object"
   typeof {};        // "object"
   typeof null;      // "object"
   typeof new Date(); // "object"
   // Use Array.isArray(), instanceof, or Object.prototype.toString
   ```

#### Deep Copy Solutions

```javascript
// 1. JSON method (limited: no functions, undefined, symbols, circular refs)
const deep1 = JSON.parse(JSON.stringify(original));

// 2. structuredClone (modern, handles more types)
const deep2 = structuredClone(original);

// 3. Recursive function (full control)
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(deepClone);
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
    );
}
```

---

## Operators

### Comparison Operators

#### Professional Definition

JavaScript provides two categories of equality operators: **loose equality** (`==`, `!=`) which performs type coercion before comparison, and **strict equality** (`===`, `!==`) which compares both value and type without coercion. The ECMAScript specification defines the **Abstract Equality Comparison Algorithm** for `==` and the **Strict Equality Comparison Algorithm** for `===`.

#### Simple Explanation

`==` is a flexible judge who converts things to compare them. `===` is a strict judge who requires exact matches - same value AND same type.

#### Technical Specifications

| Operator | Name | Type Coercion | Recommended |
|----------|------|---------------|-------------|
| `==` | Loose equality | Yes | No |
| `===` | Strict equality | No | Yes |
| `!=` | Loose inequality | Yes | No |
| `!==` | Strict inequality | No | Yes |

#### Abstract Equality Algorithm (`==`)

```javascript
// Type coercion rules (simplified):
// 1. null == undefined → true
// 2. Number vs String → String converted to Number
// 3. Boolean vs anything → Boolean converted to Number
// 4. Object vs primitive → Object converted via ToPrimitive

null == undefined;    // true
"5" == 5;            // true (string → number)
true == 1;           // true (boolean → number)
false == 0;          // true
[] == false;         // true ([] → "" → 0, false → 0)
[] == ![];           // true! ([] truthy, ![] = false, [] == false)
```

#### Limitations & Caveats

1. **Counterintuitive `==` results**:
   ```javascript
   "" == false;      // true
   " " == false;     // true
   "0" == false;     // true
   [] == false;      // true
   [[]] == false;    // true
   [0] == false;     // true
   ```

2. **`NaN` is never equal to anything**:
   ```javascript
   NaN == NaN;   // false
   NaN === NaN;  // false
   Object.is(NaN, NaN);  // true (ES6)
   ```

3. **`-0` and `+0` are equal with `===`**:
   ```javascript
   -0 === +0;           // true
   Object.is(-0, +0);   // false
   ```

4. **Object comparison is reference-based**:
   ```javascript
   {} === {};  // false (different objects)
   const a = {};
   const b = a;
   a === b;    // true (same reference)
   ```

#### Best Practices

- **Always use `===` and `!==`** unless you have a specific reason for loose equality
- **Use `Object.is()`** for edge cases (`NaN`, `-0`)
- **Explicitly convert types** before comparison for clarity

---

### Logical Operators

#### Professional Definition

JavaScript's logical operators (`&&`, `||`, `!`, `??`) perform boolean logic but return **operand values**, not necessarily booleans. `&&` and `||` use **short-circuit evaluation**, stopping as soon as the result is determined. The **nullish coalescing operator** (`??`) specifically handles `null` and `undefined`.

#### Technical Specifications

| Operator | Name | Returns | Short-circuits when |
|----------|------|---------|---------------------|
| `&&` | Logical AND | First falsy OR last value | First falsy found |
| `\|\|` | Logical OR | First truthy OR last value | First truthy found |
| `!` | Logical NOT | Boolean (negated) | N/A |
| `??` | Nullish coalescing | Left if not null/undefined | Left is not nullish |

#### Limitations & Caveats

1. **`||` treats all falsy values the same**:
   ```javascript
   0 || "default";     // "default" (0 is falsy)
   "" || "default";    // "default"
   false || "default"; // "default"
   // Problem: What if 0 or "" are valid values?
   ```

2. **`??` only checks for null/undefined**:
   ```javascript
   0 ?? "default";     // 0 (0 is not nullish)
   "" ?? "default";    // ""
   false ?? "default"; // false
   null ?? "default";  // "default"
   undefined ?? "default"; // "default"
   ```

3. **Cannot mix `??` with `&&`/`||` without parentheses**:
   ```javascript
   a || b ?? c;  // SyntaxError
   (a || b) ?? c;  // OK
   a || (b ?? c);  // OK
   ```

4. **Short-circuit side effects**:
   ```javascript
   let x = 0;
   false && (x = 1);  // x remains 0 (right side never evaluated)
   true || (x = 1);   // x remains 0
   ```

#### Code Examples

```javascript
// Short-circuit evaluation
const user = null;
const name = user && user.name;  // null (stops at user)

// Default values
const port = process.env.PORT || 3000;  // Falls back to 3000

// Nullish coalescing for zero/empty string valid values
const count = userCount ?? 10;  // Only defaults if null/undefined
const message = inputMessage ?? "No message";

// Combining for safe property access
const city = user?.address?.city ?? "Unknown";
```

---

## Control Flow

### Loops

#### Professional Definition

JavaScript provides multiple iteration mechanisms: `for`, `while`, `do-while` for general iteration; `for...in` for enumerable object properties; `for...of` for iterable values (ES6). Each has distinct use cases, performance characteristics, and gotchas.

#### Technical Specifications

| Loop Type | Iterates Over | Use Case | Can break/continue |
|-----------|---------------|----------|-------------------|
| `for` | Counter | Known iteration count | Yes |
| `while` | Condition | Unknown iteration count | Yes |
| `do-while` | Condition | At least one iteration | Yes |
| `for...in` | Enumerable keys | Object properties | Yes |
| `for...of` | Iterable values | Arrays, strings, Maps, Sets | Yes |
| `forEach` | Array elements | Functional style | No ⚠️ |

#### Limitations & Caveats

1. **`for...in` includes inherited properties**:
   ```javascript
   Object.prototype.custom = "inherited";
   const obj = { a: 1, b: 2 };
   for (let key in obj) {
       console.log(key);  // "a", "b", "custom" ⚠️
   }
   // Fix: Use hasOwnProperty
   for (let key in obj) {
       if (obj.hasOwnProperty(key)) console.log(key);
   }
   // Better: Use Object.keys()
   Object.keys(obj).forEach(key => console.log(key));
   ```

2. **`for...in` on arrays iterates indices as strings**:
   ```javascript
   const arr = ["a", "b", "c"];
   for (let i in arr) {
       console.log(typeof i);  // "string" (not number!)
   }
   ```

3. **`forEach` cannot be broken**:
   ```javascript
   [1, 2, 3, 4, 5].forEach(n => {
       if (n === 3) return;  // Only skips this iteration
       if (n === 4) break;   // SyntaxError!
       console.log(n);
   });
   // Use for...of or regular for when you need break
   ```

4. **`forEach` with async doesn't await**:
   ```javascript
   // ❌ Doesn't work as expected
   [1, 2, 3].forEach(async (n) => {
       await someAsyncOperation(n);
   });
   // The loop completes before async operations finish

   // ✅ Use for...of
   for (const n of [1, 2, 3]) {
       await someAsyncOperation(n);
   }
   ```

5. **`for...of` doesn't work on plain objects**:
   ```javascript
   const obj = { a: 1, b: 2 };
   for (const val of obj) { }  // TypeError: obj is not iterable
   
   // Use Object.values() or Object.entries()
   for (const val of Object.values(obj)) { }
   for (const [key, val] of Object.entries(obj)) { }
   ```

---

## Functions

### Function Declarations vs Expressions

#### Professional Definition

**Function declarations** are hoisted completely (both name and body), making them available throughout their scope. **Function expressions** assign anonymous or named functions to variables, following variable hoisting rules. **Arrow functions** (ES6) are always expressions with lexical `this` binding and no `arguments` object.

#### Technical Specifications

| Feature | Declaration | Expression | Arrow |
|---------|-------------|------------|-------|
| Hoisting | Full (name + body) | Variable only | Variable only |
| `this` binding | Dynamic | Dynamic | Lexical (inherited) |
| `arguments` object | Yes | Yes | No |
| Can be constructor | Yes | Yes | No |
| Has `prototype` | Yes | Yes | No |
| Can be generator | Yes | Yes | No |

#### Limitations & Caveats

1. **Arrow functions cannot be constructors**:
   ```javascript
   const Foo = () => {};
   new Foo();  // TypeError: Foo is not a constructor
   ```

2. **Arrow functions have no `arguments`**:
   ```javascript
   const fn = () => {
       console.log(arguments);  // ReferenceError
   };
   // Use rest parameters instead
   const fn = (...args) => console.log(args);
   ```

3. **Arrow functions cannot be used as methods (this binding)**:
   ```javascript
   const obj = {
       value: 42,
       getValue: () => this.value  // 'this' is NOT obj!
   };
   obj.getValue();  // undefined
   ```

4. **Function expression hoisting**:
   ```javascript
   foo();  // "works"
   bar();  // TypeError: bar is not a function

   function foo() { return "works"; }  // Declaration - hoisted
   var bar = function() { return "fails"; };  // Expression - not hoisted
   ```

5. **Named function expressions**:
   ```javascript
   const factorial = function fact(n) {
       return n <= 1 ? 1 : n * fact(n - 1);  // 'fact' only available inside
   };
   console.log(factorial.name);  // "fact"
   console.log(fact);  // ReferenceError: fact is not defined
   ```

---

### Parameters and Arguments

#### Professional Definition

**Parameters** are variables declared in a function's signature. **Arguments** are values passed when invoking the function. JavaScript functions accept any number of arguments regardless of declared parameters. ES6 introduced **default parameters**, **rest parameters** (`...args`), and the **spread operator** for arguments.

#### Technical Specifications

| Feature | Syntax | Description |
|---------|--------|-------------|
| Default parameters | `function(a = 1)` | Fallback when undefined |
| Rest parameters | `function(...args)` | Collects remaining args into array |
| Spread operator | `fn(...array)` | Expands array into arguments |
| `arguments` object | Built-in | Array-like object of all arguments |

#### Limitations & Caveats

1. **Default parameters only trigger on `undefined`**:
   ```javascript
   function greet(name = "Guest") {
       console.log(name);
   }
   greet(undefined);  // "Guest"
   greet(null);       // null (not "Guest"!)
   greet("");         // "" (not "Guest"!)
   ```

2. **Default parameters are evaluated at call time**:
   ```javascript
   function add(a, b = getDefault()) {
       return a + b;
   }
   // getDefault() is called each time b is undefined
   ```

3. **Default parameters can reference earlier parameters**:
   ```javascript
   function greet(name, greeting = `Hello, ${name}`) {
       return greeting;
   }
   greet("Andrei");  // "Hello, Andrei"
   ```

4. **`arguments` is not a real array**:
   ```javascript
   function demo() {
       arguments.forEach(x => console.log(x));  // TypeError!
       Array.from(arguments).forEach(x => console.log(x));  // OK
       [...arguments].forEach(x => console.log(x));  // OK
   }
   ```

5. **`arguments` and parameters are linked in sloppy mode**:
   ```javascript
   function demo(a) {
       arguments[0] = 99;
       console.log(a);  // 99 in sloppy mode, original in strict mode
   }
   ```

6. **Rest parameter must be last**:
   ```javascript
   function fn(...rest, last) { }  // SyntaxError
   function fn(first, ...rest) { }  // OK
   ```

---

## Arrays

### Array Methods

#### Professional Definition

JavaScript arrays are ordered, integer-indexed collections with a dynamic `length` property. Array methods fall into categories: **mutating methods** (modify original array), **non-mutating methods** (return new array/value), and **iteration methods** (execute callback on elements).

#### Technical Specifications

| Method | Mutates | Returns | Purpose |
|--------|---------|---------|---------|
| `push()` | Yes | New length | Add to end |
| `pop()` | Yes | Removed element | Remove from end |
| `shift()` | Yes | Removed element | Remove from start |
| `unshift()` | Yes | New length | Add to start |
| `splice()` | Yes | Removed elements | Add/remove anywhere |
| `sort()` | Yes | Sorted array | Sort in place |
| `reverse()` | Yes | Reversed array | Reverse in place |
| `fill()` | Yes | Modified array | Fill with value |
| `map()` | No | New array | Transform elements |
| `filter()` | No | New array | Select elements |
| `reduce()` | No | Single value | Accumulate value |
| `slice()` | No | New array | Extract portion |
| `concat()` | No | New array | Merge arrays |
| `flat()` | No | New array | Flatten nested |
| `find()` | No | Element or undefined | Find first match |
| `findIndex()` | No | Index or -1 | Find first match index |
| `includes()` | No | Boolean | Check existence |
| `some()` | No | Boolean | Any element matches |
| `every()` | No | Boolean | All elements match |

#### Limitations & Caveats

1. **`sort()` converts to strings by default**:
   ```javascript
   [10, 2, 1].sort();  // [1, 10, 2] - wrong!
   [10, 2, 1].sort((a, b) => a - b);  // [1, 2, 10] - correct
   ```

2. **`sort()` is not guaranteed stable in older engines**:
   ES2019 guarantees stable sort, but older implementations may not be stable.

3. **Sparse arrays have unexpected behavior**:
   ```javascript
   const arr = [1, , 3];  // Sparse array
   arr.forEach(x => console.log(x));  // 1, 3 (skips hole)
   arr.map(x => x * 2);  // [2, empty, 6] (preserves hole)
   arr.filter(x => true);  // [1, 3] (removes holes)
   ```

4. **`includes()` uses SameValueZero (handles NaN)**:
   ```javascript
   [NaN].includes(NaN);  // true
   [NaN].indexOf(NaN);   // -1 (uses strict equality)
   ```

5. **`reduce()` without initial value**:
   ```javascript
   [].reduce((a, b) => a + b);  // TypeError on empty array!
   [].reduce((a, b) => a + b, 0);  // 0 (OK with initial value)
   ```

6. **`flat()` depth parameter**:
   ```javascript
   [[1, [2, [3]]]].flat();     // [1, [2, [3]]] (depth 1)
   [[1, [2, [3]]]].flat(2);    // [1, 2, [3]]
   [[1, [2, [3]]]].flat(Infinity);  // [1, 2, 3]
   ```

---

## Objects

### Object Basics

#### Professional Definition

Objects are unordered collections of **key-value pairs** (properties). Keys are strings or Symbols; values can be any type. Objects can have **own properties** and **inherited properties** via the prototype chain. Property access uses dot notation or bracket notation.

#### Technical Specifications

| Feature | Dot Notation | Bracket Notation |
|---------|-------------|------------------|
| Syntax | `obj.key` | `obj["key"]` |
| Key type | Valid identifiers only | Any string/symbol |
| Dynamic keys | No | Yes |
| Reserved words | Depends on ES version | Yes |

#### Property Descriptors

Every property has a **descriptor** with attributes:

| Attribute | Description | Default |
|-----------|-------------|---------|
| `value` | The property's value | undefined |
| `writable` | Can value be changed | true |
| `enumerable` | Shows in for...in, Object.keys | true |
| `configurable` | Can delete or change attributes | true |
| `get` | Getter function | undefined |
| `set` | Setter function | undefined |

#### Limitations & Caveats

1. **Property order is not guaranteed (mostly)**:
   - ES2015+: Integer keys are sorted numerically first
   - Then string keys in insertion order
   - Then Symbol keys in insertion order
   ```javascript
   const obj = { b: 1, 2: 2, a: 3, 1: 4 };
   Object.keys(obj);  // ["1", "2", "b", "a"]
   ```

2. **`in` operator checks prototype chain**:
   ```javascript
   const obj = { a: 1 };
   "a" in obj;        // true
   "toString" in obj; // true (inherited!)
   obj.hasOwnProperty("toString");  // false
   ```

3. **Object.keys/values/entries skip non-enumerable**:
   ```javascript
   Object.defineProperty(obj, 'hidden', {
       value: 'secret',
       enumerable: false
   });
   Object.keys(obj);  // Does NOT include 'hidden'
   ```

4. **`delete` only removes own properties**:
   ```javascript
   delete obj.a;        // true, removes
   delete obj.toString; // true, but doesn't remove (it's inherited)
   ```

5. **`Object.freeze()` is shallow**:
   ```javascript
   const obj = { nested: { value: 1 } };
   Object.freeze(obj);
   obj.nested.value = 2;  // Works! Only top level is frozen
   ```

#### Code Examples

```javascript
// Property descriptors
Object.defineProperty(obj, 'readonly', {
    value: 42,
    writable: false,
    enumerable: true,
    configurable: false
});
obj.readonly = 100;  // Silently fails (or throws in strict mode)
console.log(obj.readonly);  // 42

// Getters and setters
const user = {
    firstName: "John",
    lastName: "Doe",
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    },
    set fullName(value) {
        [this.firstName, this.lastName] = value.split(' ');
    }
};
console.log(user.fullName);  // "John Doe"
user.fullName = "Jane Smith";
console.log(user.firstName);  // "Jane"
```

---

## Destructuring

### Object & Array Destructuring

#### Professional Definition

**Destructuring** is a syntax for extracting values from arrays or properties from objects into distinct variables. It supports default values, renaming, nested patterns, and rest patterns. Destructuring is evaluated left-to-right and throws if destructuring `null` or `undefined`.

#### Limitations & Caveats

1. **Destructuring null/undefined throws**:
   ```javascript
   const { a } = null;       // TypeError
   const { a } = undefined;  // TypeError
   const { a } = false;      // OK, a is undefined
   ```

2. **Default values only for undefined**:
   ```javascript
   const { a = 1 } = { a: null };
   console.log(a);  // null (not 1)
   
   const { b = 1 } = { b: undefined };
   console.log(b);  // 1
   ```

3. **Destructuring in function parameters**:
   ```javascript
   // Must provide default object to avoid TypeError on undefined
   function fn({ a, b } = {}) { }
   fn();  // OK
   fn(undefined);  // OK
   
   function fn2({ a, b }) { }
   fn2();  // TypeError: Cannot destructure property 'a' of 'undefined'
   ```

4. **Computed property names require brackets**:
   ```javascript
   const key = "dynamicKey";
   const { [key]: value } = { dynamicKey: 42 };
   console.log(value);  // 42
   ```

5. **Destructuring doesn't create deep copies**:
   ```javascript
   const original = { nested: { value: 1 } };
   const { nested } = original;
   nested.value = 2;
   console.log(original.nested.value);  // 2 (same reference!)
   ```

---

## Key Takeaways

### Variables
- Default to `const`, use `let` when needed, avoid `var`
- `const` prevents reassignment but not mutation
- Understand TDZ for `let`/`const`

### Types
- Know the 7 primitive types and their gotchas (`typeof null`, NaN, number precision)
- Reference types are compared by identity, not value
- Use `structuredClone()` for deep copies

### Operators
- Always use `===` over `==`
- Use `??` for nullish coalescing, `||` for all falsy values
- Understand short-circuit evaluation

### Functions
- Arrow functions have no `this`, `arguments`, or `prototype`
- Default parameters only apply to `undefined`
- Rest parameters must be last

### Arrays & Objects
- Know which methods mutate vs return new arrays
- `sort()` requires a compare function for numbers
- Object property order follows specific rules in ES2015+

---

> 💡 **Professional Tip**: The ECMAScript specification (ECMA-262) is the authoritative source for JavaScript behavior. When in doubt, check the spec or use polyfills for cross-browser compatibility.