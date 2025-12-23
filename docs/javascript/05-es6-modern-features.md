# ES6+ Modern JavaScript Features

> "What I cannot create, I do not understand." - Richard Feynman

ES6 (ECMAScript 2015) was a transformative update to JavaScript. Understanding these features deeply - including their limitations - is essential for modern development.

---

## let and const

### Professional Definition

`let` and `const` are block-scoped variable declarations introduced in ES6. Unlike `var`, they respect block boundaries and participate in the **Temporal Dead Zone (TDZ)**. `const` creates a read-only reference - the binding cannot be reassigned, but the value (if an object) can be mutated.

### Technical Specifications

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| Scope | Function | Block | Block |
| Hoisting | Yes (initialized `undefined`) | Yes (TDZ) | Yes (TDZ) |
| Redeclaration | Allowed | Error | Error |
| Reassignment | Allowed | Allowed | Error |
| Creates global property | Yes | No | No |
| TDZ | No | Yes | Yes |

### Temporal Dead Zone (TDZ)

```javascript
// TDZ: Time between entering scope and declaration
{
    // TDZ for x starts here
    console.log(x);  // ReferenceError: Cannot access 'x' before initialization
    let x = 10;      // TDZ ends here
    console.log(x);  // 10
}
```

### Limitations & Caveats

1. **`const` doesn't mean immutable**:
   ```javascript
   const obj = { a: 1 };
   obj.a = 2;        // ✅ Allowed - mutating property
   obj.b = 3;        // ✅ Allowed - adding property
   obj = { c: 4 };   // ❌ TypeError - reassigning binding
   
   // For true immutability:
   const frozen = Object.freeze({ a: 1 });
   frozen.a = 2;  // Silently fails (or throws in strict mode)
   
   // But freeze is shallow!
   const deep = Object.freeze({ nested: { value: 1 } });
   deep.nested.value = 2;  // ✅ Works! Nested object not frozen
   ```

2. **TDZ with typeof**:
   ```javascript
   // typeof is NOT safe with TDZ
   console.log(typeof undeclared);  // "undefined" (no error)
   console.log(typeof x);  // ReferenceError: x is in TDZ
   let x = 10;
   ```

3. **TDZ in switch statements**:
   ```javascript
   switch (value) {
       case 1:
           let x = 'a';  // x is in TDZ for entire switch block
           break;
       case 2:
           let x = 'b';  // SyntaxError: x already declared
           break;
   }
   
   // Fix: use block scope
   switch (value) {
       case 1: {
           let x = 'a';
           break;
       }
       case 2: {
           let x = 'b';  // OK, different block
           break;
       }
   }
   ```

4. **`const` requires initialization**:
   ```javascript
   const x;  // SyntaxError: Missing initializer in const declaration
   let y;    // OK, undefined
   ```

5. **Loop behavior difference**:
   ```javascript
   // var - one binding shared across iterations
   for (var i = 0; i < 3; i++) {
       setTimeout(() => console.log(i), 0);
   }
   // Output: 3, 3, 3
   
   // let - new binding per iteration
   for (let i = 0; i < 3; i++) {
       setTimeout(() => console.log(i), 0);
   }
   // Output: 0, 1, 2
   ```

---

## Arrow Functions

### Professional Definition

Arrow functions are a concise syntax for function expressions with **lexical `this`**, **no `arguments` object**, **no `prototype` property**, and **cannot be used as constructors**. They inherit `this` from the enclosing lexical scope at definition time.

### Syntax Variations

```javascript
// Full form
const add = (a, b) => {
    return a + b;
};

// Implicit return (single expression)
const add = (a, b) => a + b;

// Single parameter (no parentheses needed)
const double = n => n * 2;

// No parameters
const greet = () => "Hello!";

// Returning object literal (wrap in parentheses)
const createUser = name => ({ name, active: true });
```

### Technical Specifications

| Feature | Regular Function | Arrow Function |
|---------|------------------|----------------|
| `this` binding | Dynamic | Lexical |
| `arguments` object | Own | Inherited |
| `new` callable | Yes | No |
| `prototype` property | Yes | No |
| Generator (`function*`) | Yes | No |
| `super` | Own | Inherited |
| `new.target` | Own | Inherited |

### Limitations & Caveats

1. **Cannot be used as constructors**:
   ```javascript
   const Person = (name) => {
       this.name = name;
   };
   new Person("Andrei");  // TypeError: Person is not a constructor
   ```

2. **No `arguments` object**:
   ```javascript
   const fn = () => {
       console.log(arguments);  // ReferenceError or parent's arguments
   };
   
   // Use rest parameters instead
   const fn = (...args) => {
       console.log(args);  // Array of arguments
   };
   ```

3. **Cannot be used as methods**:
   ```javascript
   const obj = {
       value: 42,
       // ❌ Arrow function - 'this' is NOT obj
       getValue: () => this.value,  // undefined
       
       // ✅ Regular function or shorthand
       getValue() { return this.value; }  // 42
   };
   ```

4. **Cannot use `yield`**:
   ```javascript
   // ❌ Arrow functions cannot be generators
   const gen = *() => { yield 1; };  // SyntaxError
   
   // ✅ Use regular generator function
   function* gen() { yield 1; }
   ```

5. **No duplicate named parameters**:
   ```javascript
   // In non-strict mode, regular functions allow this
   function fn(a, a) { return a; }  // Works (uses last 'a')
   
   // Arrow functions always act like strict mode
   const fn = (a, a) => a;  // SyntaxError: Duplicate parameter name
   ```

6. **Cannot change `this` with call/apply/bind**:
   ```javascript
   const arrow = () => this;
   const obj = { value: 42 };
   
   arrow.call(obj);    // Not obj, still lexical 'this'
   arrow.apply(obj);   // Not obj
   arrow.bind(obj)();  // Not obj
   ```

7. **Returning object literals requires parentheses**:
   ```javascript
   // ❌ Interpreted as function body, not object
   const getObj = () => { name: "test" };
   console.log(getObj());  // undefined
   
   // ✅ Wrap in parentheses
   const getObj = () => ({ name: "test" });
   console.log(getObj());  // { name: "test" }
   ```

---

## Template Literals

### Professional Definition

Template literals are string literals allowing embedded expressions, multi-line strings, and tagged templates. They use backticks (`` ` ``) instead of quotes and support interpolation with `${expression}`.

### Technical Specifications

| Feature | Description |
|---------|-------------|
| Delimiter | Backticks (`` ` ``) |
| Interpolation | `${expression}` |
| Multi-line | Preserved literally |
| Raw strings | `String.raw` tag |
| Tagged templates | Custom processing |

### Limitations & Caveats

1. **Expressions are converted to strings**:
   ```javascript
   const obj = { toString: () => "custom" };
   `Value: ${obj}`;  // "Value: custom"
   
   const arr = [1, 2, 3];
   `Array: ${arr}`;  // "Array: 1,2,3" (calls toString)
   
   // ❌ Objects without toString
   `Object: ${{ a: 1 }}`;  // "Object: [object Object]"
   
   // ✅ Use JSON.stringify for objects
   `Object: ${JSON.stringify({ a: 1 })}`;  // 'Object: {"a":1}'
   ```

2. **No automatic HTML escaping**:
   ```javascript
   // ❌ XSS vulnerability
   const userInput = '<script>alert("XSS")</script>';
   element.innerHTML = `<div>${userInput}</div>`;  // Dangerous!
   
   // ✅ Use textContent or escape
   element.textContent = userInput;  // Safe
   ```

3. **Multi-line includes leading whitespace**:
   ```javascript
   const html = `
       <div>
           <p>Text</p>
       </div>
   `;
   // Includes all indentation!
   
   // Common pattern: use array join or template tag
   const html = [
       '<div>',
       '    <p>Text</p>',
       '</div>'
   ].join('\n');
   ```

4. **Tagged template function signature**:
   ```javascript
   function tag(strings, ...values) {
       // strings: array of static string parts
       // values: array of interpolated values
       
       console.log(strings);  // ["Hello ", "!", ""]
       console.log(values);   // ["World", 42]
   }
   
   tag`Hello ${"World"}! ${42}`;
   
   // strings.raw contains raw strings (unescaped)
   function rawTag(strings) {
       console.log(strings.raw[0]);  // "\\n" (literal backslash-n)
       console.log(strings[0]);      // actual newline character
   }
   rawTag`\n`;
   ```

5. **Cannot nest template literals in interpolation (without escaping)**:
   ```javascript
   // ✅ Actually, you CAN nest them
   const nested = `Outer ${`Inner ${"Deep"}`}`;  // "Outer Inner Deep"
   
   // But it gets confusing, prefer:
   const deep = "Deep";
   const inner = `Inner ${deep}`;
   const outer = `Outer ${inner}`;
   ```

---

## Destructuring

### Professional Definition

**Destructuring** is a syntax for extracting values from arrays or properties from objects into distinct variables. It supports default values, renaming (aliasing), nested patterns, and rest patterns. Destructuring is evaluated left-to-right.

### Technical Specifications

| Feature | Array | Object |
|---------|-------|--------|
| Syntax | `[a, b] = arr` | `{a, b} = obj` |
| Default values | `[a = 1]` | `{a = 1}` |
| Rename | N/A | `{a: alias}` |
| Rest | `[a, ...rest]` | `{a, ...rest}` |
| Nested | `[[a]]` | `{nested: {a}}` |

### Limitations & Caveats

1. **Cannot destructure `null` or `undefined`**:
   ```javascript
   const { a } = null;       // TypeError
   const { a } = undefined;  // TypeError
   const [a] = null;         // TypeError
   
   // ✅ Provide default object
   const { a } = maybeNull || {};
   const { a } = maybeNull ?? {};
   ```

2. **Default values only for `undefined`, not `null`**:
   ```javascript
   const { a = 1 } = { a: undefined };  // a = 1
   const { a = 1 } = { a: null };       // a = null (NOT 1)
   const { a = 1 } = {};                // a = 1
   
   // Same for arrays
   const [x = 1] = [undefined];  // x = 1
   const [x = 1] = [null];       // x = null
   ```

3. **Destructuring declarations vs assignments**:
   ```javascript
   // Declaration
   const { a, b } = obj;
   let [x, y] = arr;
   
   // Assignment (existing variables) - requires parentheses for objects!
   let a, b;
   ({ a, b } = obj);  // Parentheses required!
   [x, y] = arr;      // OK without parentheses
   
   // Why? { a, b } = obj is parsed as a block statement
   ```

4. **Computed property names in destructuring**:
   ```javascript
   const key = 'dynamicKey';
   const { [key]: value } = { dynamicKey: 42 };
   console.log(value);  // 42
   
   // You MUST provide an alias with computed property names
   const { [key] } = obj;  // SyntaxError
   const { [key]: val } = obj;  // OK
   ```

5. **Object rest only copies enumerable own properties**:
   ```javascript
   const proto = { inherited: true };
   const obj = Object.create(proto);
   obj.own = true;
   
   const { ...rest } = obj;
   console.log(rest);  // { own: true } - no 'inherited'
   
   // Also excludes non-enumerable
   Object.defineProperty(obj, 'hidden', { value: true, enumerable: false });
   const { ...rest2 } = obj;
   console.log(rest2);  // { own: true } - no 'hidden'
   ```

6. **Function parameter destructuring needs default**:
   ```javascript
   // ❌ Crashes if called without arguments
   function fn({ a, b }) {
       console.log(a, b);
   }
   fn();  // TypeError: Cannot destructure property 'a' of 'undefined'
   
   // ✅ Provide default object
   function fn({ a, b } = {}) {
       console.log(a, b);  // undefined, undefined
   }
   fn();  // OK
   ```

---

## Spread and Rest Operators

### Professional Definition

The **spread operator** (`...`) expands an iterable into individual elements. The **rest operator** (`...`) collects remaining elements into an array (in function parameters or destructuring). They share the same syntax but perform opposite operations.

### Technical Specifications

| Context | Operator | Purpose |
|---------|----------|---------|
| Function call | Spread | `fn(...arr)` - expand array to arguments |
| Array literal | Spread | `[...arr]` - expand into elements |
| Object literal | Spread | `{...obj}` - expand into properties |
| Function parameter | Rest | `fn(...args)` - collect arguments |
| Destructuring | Rest | `[a, ...rest]` - collect remaining |

### Limitations & Caveats

1. **Spread creates shallow copies only**:
   ```javascript
   const original = { a: 1, nested: { b: 2 } };
   const copy = { ...original };
   
   copy.a = 10;          // original.a unchanged
   copy.nested.b = 20;   // original.nested.b IS changed!
   
   // ✅ For deep copies:
   const deep = structuredClone(original);
   // or
   const deep = JSON.parse(JSON.stringify(original));
   ```

2. **Object spread only copies enumerable own properties**:
   ```javascript
   const proto = { inherited: true };
   const obj = Object.create(proto);
   obj.own = true;
   
   const copy = { ...obj };
   console.log(copy.inherited);  // undefined!
   console.log(copy.own);        // true
   ```

3. **Later properties overwrite earlier ones**:
   ```javascript
   const defaults = { a: 1, b: 2, c: 3 };
   const overrides = { b: 10 };
   
   const result = { ...defaults, ...overrides };
   // { a: 1, b: 10, c: 3 }
   
   // Order matters!
   const wrong = { ...overrides, ...defaults };
   // { a: 1, b: 2, c: 3 } - defaults overwrote overrides
   ```

4. **Rest parameter must be last**:
   ```javascript
   // ❌ SyntaxError
   function fn(...rest, last) {}
   const [...rest, last] = arr;
   
   // ✅ Rest must be last
   function fn(first, ...rest) {}
   const [first, ...rest] = arr;
   ```

5. **Spread doesn't work on all objects**:
   ```javascript
   // ✅ Array spread works on iterables
   const str = "abc";
   const chars = [...str];  // ["a", "b", "c"]
   
   const set = new Set([1, 2, 3]);
   const arr = [...set];  // [1, 2, 3]
   
   // ❌ Plain objects are not iterable
   const obj = { a: 1 };
   const arr = [...obj];  // TypeError: obj is not iterable
   
   // ✅ Object spread only works in object literals
   const copy = { ...obj };  // OK
   ```

6. **Rest in object destructuring excludes specified properties**:
   ```javascript
   const user = { id: 1, name: 'Andrei', password: 'secret' };
   
   const { password, ...safeUser } = user;
   console.log(safeUser);  // { id: 1, name: 'Andrei' }
   // Great for omitting sensitive data!
   ```

---

## Modules (import/export)

### Professional Definition

ES6 modules are a native module system with static structure (imports/exports are determined at compile time, not runtime). They support named exports, default exports, and re-exports. Modules execute in **strict mode** by default and have their own scope.

### Technical Specifications

| Feature | Syntax |
|---------|--------|
| Named export | `export const x = 1;` or `export { x };` |
| Default export | `export default value;` |
| Named import | `import { x } from './mod.js';` |
| Default import | `import x from './mod.js';` |
| Rename on export | `export { x as y };` |
| Rename on import | `import { x as y } from './mod.js';` |
| Import all | `import * as mod from './mod.js';` |
| Dynamic import | `import('./mod.js')` returns Promise |
| Re-export | `export { x } from './mod.js';` |

### Limitations & Caveats

1. **Static structure - no conditional imports**:
   ```javascript
   // ❌ SyntaxError: import must be at top level
   if (condition) {
       import { x } from './mod.js';
   }
   
   // ✅ Use dynamic import for conditional loading
   if (condition) {
       const { x } = await import('./mod.js');
   }
   ```

2. **Imports are read-only bindings**:
   ```javascript
   // module.js
   export let count = 0;
   export function increment() {
       count++;
   }
   
   // main.js
   import { count, increment } from './module.js';
   
   console.log(count);  // 0
   increment();
   console.log(count);  // 1 (binding updates!)
   
   count = 10;  // TypeError: Assignment to constant variable
   ```

3. **Import hoisting**:
   ```javascript
   // Imports are hoisted - available before they appear
   console.log(x);  // Works!
   
   import { x } from './mod.js';
   ```

4. **Circular dependencies**:
   ```javascript
   // a.js
   import { b } from './b.js';
   export const a = 'A: ' + b;
   
   // b.js
   import { a } from './a.js';
   export const b = 'B: ' + a;  // a is undefined at this point!
   
   // ✅ Fix: use functions that access values later
   // a.js
   import { getB } from './b.js';
   export const a = 'A';
   export const getA = () => a;
   
   // b.js
   import { getA } from './a.js';
   export const b = 'B';
   export const getB = () => b;
   ```

5. **Only one default export per module**:
   ```javascript
   // ❌ SyntaxError
   export default const a = 1;
   export default const b = 2;
   
   // ✅ Combine into object if needed
   export default { a: 1, b: 2 };
   ```

6. **Module scripts in HTML**:
   ```html
   <!-- Must use type="module" -->
   <script type="module" src="app.js"></script>
   
   <!-- Modules are deferred by default -->
   <!-- Modules use strict mode automatically -->
   <!-- Modules have their own scope (no global pollution) -->
   <!-- CORS required for cross-origin modules -->
   ```

7. **Dynamic import returns a Promise**:
   ```javascript
   // Dynamic import for code splitting
   async function loadModule() {
       const module = await import('./heavy-module.js');
       module.doSomething();
   }
   
   // Access default export
   const { default: MyClass } = await import('./MyClass.js');
   ```

---

## Maps and Sets

### Professional Definition

**Map** is a key-value collection where keys can be any value (including objects). **Set** is a collection of unique values. Both maintain insertion order and provide efficient O(1) lookups. They differ from plain objects/arrays in key flexibility and built-in methods.

### Technical Specifications

| Feature | Object | Map |
|---------|--------|-----|
| Key types | String, Symbol | Any value |
| Key order | Not guaranteed (mostly) | Insertion order |
| Size | `Object.keys(obj).length` | `map.size` |
| Iteration | `for...in`, `Object.keys` | `for...of`, `.forEach` |
| Prototype pollution | Possible | No |
| Serialization | JSON.stringify | Manual |
| Performance | Slower for frequent add/delete | Faster |

| Feature | Array | Set |
|---------|-------|-----|
| Duplicates | Allowed | Not allowed |
| Value lookup | O(n) `indexOf` | O(1) `has` |
| Order | Index-based | Insertion order |

### Limitations & Caveats

1. **Map keys use SameValueZero equality**:
   ```javascript
   const map = new Map();
   
   // Objects are compared by reference
   map.set({ a: 1 }, 'value1');
   map.get({ a: 1 });  // undefined! Different object reference
   
   const key = { a: 1 };
   map.set(key, 'value2');
   map.get(key);  // 'value2' - same reference
   
   // NaN equals NaN (unlike ===)
   map.set(NaN, 'not a number');
   map.get(NaN);  // 'not a number'
   ```

2. **Map/Set cannot be JSON serialized directly**:
   ```javascript
   const map = new Map([['a', 1], ['b', 2]]);
   JSON.stringify(map);  // '{}'
   
   // ✅ Convert to array/object first
   JSON.stringify([...map]);  // '[["a",1],["b",2]]'
   JSON.stringify(Object.fromEntries(map));  // '{"a":1,"b":2}'
   
   // ✅ Or use custom replacer
   JSON.stringify(map, (key, value) => {
       if (value instanceof Map) {
           return Object.fromEntries(value);
       }
       return value;
   });
   ```

3. **Set only stores unique values**:
   ```javascript
   const set = new Set([1, 2, 2, 3, 3, 3]);
   console.log(set.size);  // 3
   console.log([...set]);  // [1, 2, 3]
   
   // Object uniqueness is by reference
   const set2 = new Set();
   set2.add({ a: 1 });
   set2.add({ a: 1 });
   console.log(set2.size);  // 2! Different objects
   ```

4. **WeakMap/WeakSet limitations**:
   ```javascript
   const weakMap = new WeakMap();
   
   // Keys must be objects
   weakMap.set('string', 'value');  // TypeError
   weakMap.set({ key: 1 }, 'value');  // OK
   
   // Not iterable
   for (const [k, v] of weakMap) {}  // TypeError
   
   // No .size property
   console.log(weakMap.size);  // undefined
   
   // Use case: Associating data with objects without preventing GC
   ```

5. **Map vs Object performance**:
   ```javascript
   // Map is better for:
   // - Frequent additions and deletions
   // - Non-string keys
   // - Maintaining insertion order
   // - Checking size frequently
   
   // Object is better for:
   // - Static structure known at compile time
   // - Need JSON serialization
   // - String keys with dot notation access
   // - Need prototype methods
   ```

---

## Symbols

### Professional Definition

**Symbol** is a primitive type representing a unique identifier. Every `Symbol()` call creates a new unique symbol. Symbols can be used as object property keys to create "hidden" or non-enumerable-like properties. The global symbol registry (`Symbol.for()`) allows sharing symbols across realms.

### Technical Specifications

| Feature | Description |
|---------|-------------|
| Creation | `Symbol('description')` |
| Uniqueness | Every symbol is unique |
| Property access | Bracket notation only |
| Enumeration | Not included in `for...in`, `Object.keys` |
| Global registry | `Symbol.for('key')`, `Symbol.keyFor(sym)` |
| Well-known symbols | `Symbol.iterator`, `Symbol.toStringTag`, etc. |

### Limitations & Caveats

1. **Cannot be converted to string implicitly**:
   ```javascript
   const sym = Symbol('id');
   
   // ❌ TypeError
   console.log('Symbol: ' + sym);
   console.log(`Symbol: ${sym}`);
   
   // ✅ Explicit conversion
   console.log('Symbol: ' + sym.toString());
   console.log('Symbol: ' + sym.description);
   ```

2. **Symbol properties are not truly private**:
   ```javascript
   const secret = Symbol('secret');
   const obj = {
       [secret]: 'hidden value',
       public: 'visible'
   };
   
   // Not in normal enumeration
   Object.keys(obj);  // ['public']
   JSON.stringify(obj);  // '{"public":"visible"}'
   
   // But CAN be accessed!
   Object.getOwnPropertySymbols(obj);  // [Symbol(secret)]
   Reflect.ownKeys(obj);  // ['public', Symbol(secret)]
   ```

3. **Global registry vs local symbols**:
   ```javascript
   // Local symbols are always unique
   Symbol('id') === Symbol('id');  // false
   
   // Global registry symbols are shared
   Symbol.for('id') === Symbol.for('id');  // true
   
   // Get key from global symbol
   const sym = Symbol.for('id');
   Symbol.keyFor(sym);  // 'id'
   
   // Local symbols return undefined
   const local = Symbol('id');
   Symbol.keyFor(local);  // undefined
   ```

4. **Well-known symbols override built-in behavior**:
   ```javascript
   // Custom iterator
   const obj = {
       data: [1, 2, 3],
       [Symbol.iterator]() {
           let i = 0;
           return {
               next: () => {
                   if (i < this.data.length) {
                       return { value: this.data[i++], done: false };
                   }
                   return { done: true };
               }
           };
       }
   };
   
   for (const x of obj) {
       console.log(x);  // 1, 2, 3
   }
   ```

---

## Classes

See dedicated file: `06-oop-classes.md`

---

## Default Parameters

### Professional Definition

**Default parameters** allow function parameters to have default values when no argument is passed or when `undefined` is passed. Default values are evaluated at call time (not definition time) and can reference earlier parameters.

### Limitations & Caveats

1. **Only triggers on `undefined`, not `null` or falsy values**:
   ```javascript
   function greet(name = 'Guest') {
       return `Hello, ${name}`;
   }
   
   greet();           // "Hello, Guest"
   greet(undefined);  // "Hello, Guest"
   greet(null);       // "Hello, null" - null is NOT undefined!
   greet('');         // "Hello, " - empty string is NOT undefined
   greet(0);          // "Hello, 0" - 0 is NOT undefined
   ```

2. **Evaluated at call time (can have side effects)**:
   ```javascript
   let callCount = 0;
   function getDefault() {
       callCount++;
       return 'default';
   }
   
   function fn(value = getDefault()) {}
   
   fn('explicit');  // getDefault NOT called
   fn();            // getDefault called, callCount = 1
   fn();            // getDefault called, callCount = 2
   ```

3. **Can reference earlier parameters**:
   ```javascript
   function greet(name, greeting = `Hello, ${name}`) {
       return greeting;
   }
   
   greet('Andrei');  // "Hello, Andrei"
   
   // But NOT later parameters (TDZ)
   function invalid(a = b, b) {}  // ReferenceError when called
   ```

4. **Affects `arguments` object**:
   ```javascript
   function fn(a = 10) {
       console.log(arguments[0]);  // undefined (not 10)
       console.log(a);  // 10
   }
   fn();
   
   // arguments reflects passed arguments, not default values
   ```

---

## Key Takeaways

| Feature | Key Points |
|---------|------------|
| **let/const** | Block-scoped, TDZ, const doesn't mean immutable |
| **Arrow functions** | Lexical this, no arguments, no constructor |
| **Template literals** | Interpolation, multi-line, tagged templates |
| **Destructuring** | Cannot destructure null/undefined, defaults only for undefined |
| **Spread/Rest** | Shallow copy only, rest must be last |
| **Modules** | Static structure, read-only bindings, hoisted |
| **Map/Set** | Any key type, O(1) lookup, not JSON serializable |
| **Symbols** | Unique identifiers, not truly private |

### Best Practices

1. **Default to `const`**, use `let` only when reassignment is needed
2. **Use arrow functions** for callbacks, regular functions for methods
3. **Prefer destructuring** for extracting object/array values
4. **Use spread** for shallow copies and merging
5. **Use Map** when keys are dynamic or non-strings
6. **Use Set** for unique collections
7. **Use Symbols** for truly unique property keys

---

> 💡 **Professional Tip**: Check browser/Node.js compatibility for ES6+ features at caniuse.com and node.green. Use Babel for transpilation if supporting older environments. TypeScript also helps catch many ES6+ usage errors at compile time.