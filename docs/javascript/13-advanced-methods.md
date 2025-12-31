# Advanced Array & Object Methods

> "The first principle is that you must not fool yourself — and you are the easiest person to fool." - Richard Feynman

Modern JavaScript provides powerful methods for working with arrays and objects. This guide covers advanced methods introduced in ES6+ that every JavaScript developer should master.

---

## Array Methods Overview

### Method Categories

| Category | Methods | Mutates Original |
|----------|---------|------------------|
| **Transformation** | `map`, `flatMap`, `flat` | No |
| **Filtering** | `filter`, `find`, `findIndex`, `findLast`, `findLastIndex` | No |
| **Reduction** | `reduce`, `reduceRight` | No |
| **Testing** | `some`, `every`, `includes` | No |
| **Searching** | `indexOf`, `lastIndexOf`, `at` | No |
| **Ordering** | `sort`, `reverse`, `toSorted`, `toReversed` | `sort`/`reverse`: Yes, `toSorted`/`toReversed`: No |
| **Copying** | `slice`, `toSpliced`, `with` | No |
| **Adding/Removing** | `push`, `pop`, `shift`, `unshift`, `splice` | Yes |
| **Iteration** | `forEach`, `entries`, `keys`, `values` | No |
| **Creation** | `Array.from`, `Array.of`, `Array.fromAsync` | N/A |

---

## ES6+ Array Methods

### Array.from()

#### Professional Definition

`Array.from()` creates a new Array instance from an array-like or iterable object. It can also take a map function as a second argument to transform elements during creation.

#### Syntax

```javascript
Array.from(arrayLike)
Array.from(arrayLike, mapFn)
Array.from(arrayLike, mapFn, thisArg)
```

#### Use Cases

```javascript
// From string
Array.from('hello');  // ['h', 'e', 'l', 'l', 'o']

// From Set
Array.from(new Set([1, 2, 2, 3]));  // [1, 2, 3]

// From Map
Array.from(new Map([['a', 1], ['b', 2]]));  // [['a', 1], ['b', 2]]

// From NodeList
Array.from(document.querySelectorAll('div'));

// From arguments object
function example() {
    return Array.from(arguments);
}
example(1, 2, 3);  // [1, 2, 3]

// With map function
Array.from([1, 2, 3], x => x * 2);  // [2, 4, 6]

// Create array of length n
Array.from({ length: 5 }, (_, i) => i);  // [0, 1, 2, 3, 4]

// Generate range
const range = (start, end) => 
    Array.from({ length: end - start + 1 }, (_, i) => start + i);
range(1, 5);  // [1, 2, 3, 4, 5]

// Create 2D array
const matrix = Array.from({ length: 3 }, () => 
    Array.from({ length: 3 }, () => 0)
);
// [[0, 0, 0], [0, 0, 0], [0, 0, 0]]

// Clone array (shallow)
const clone = Array.from(original);

// Convert array-like with holes to dense array
const sparse = [1, , 3];  // Sparse array
Array.from(sparse);  // [1, undefined, 3] - holes become undefined
```

#### Limitations & Caveats

1. **Shallow copy only**:
   ```javascript
   const original = [{ a: 1 }, { b: 2 }];
   const copy = Array.from(original);
   
   copy[0].a = 999;
   console.log(original[0].a);  // 999 - same reference!
   ```

2. **Works with array-like objects**:
   ```javascript
   // Array-like: has length and indexed elements
   const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
   Array.from(arrayLike);  // ['a', 'b', 'c']
   
   // Missing indices become undefined
   const sparse = { 0: 'a', 2: 'c', length: 3 };
   Array.from(sparse);  // ['a', undefined, 'c']
   ```

---

### Array.of()

#### Professional Definition

`Array.of()` creates a new Array instance with a variable number of arguments, regardless of number or type. It differs from the `Array` constructor which treats a single number argument as length.

#### Syntax

```javascript
Array.of(element0, element1, /* ... */ elementN)
```

#### Use Cases

```javascript
// Compare with Array constructor
Array(3);      // [empty × 3] - creates array with length 3
Array.of(3);   // [3] - creates array containing 3

Array(1, 2, 3);     // [1, 2, 3]
Array.of(1, 2, 3);  // [1, 2, 3]

// Useful when you don't know the number of arguments
function createArray(...args) {
    return Array.of(...args);
}

// Creating array with single element
Array.of(undefined);  // [undefined]
Array.of(null);       // [null]
Array.of(7);          // [7]
```

---

### Array.prototype.flat()

#### Professional Definition

`flat()` creates a new array with all sub-array elements concatenated into it recursively up to the specified depth. Default depth is 1.

#### Syntax

```javascript
array.flat()
array.flat(depth)
```

#### Use Cases

```javascript
// Default depth (1)
[1, [2, 3], [4, 5]].flat();  // [1, 2, 3, 4, 5]

// Nested arrays
[1, [2, [3, [4]]]].flat();     // [1, 2, [3, [4]]]
[1, [2, [3, [4]]]].flat(2);    // [1, 2, 3, [4]]
[1, [2, [3, [4]]]].flat(3);    // [1, 2, 3, 4]

// Flatten completely with Infinity
[1, [2, [3, [4, [5]]]]].flat(Infinity);  // [1, 2, 3, 4, 5]

// Removes holes in arrays
[1, , 3, , 5].flat();  // [1, 3, 5]

// Real-world: Flatten nested data
const users = [
    { name: 'Alice', tags: ['admin', 'user'] },
    { name: 'Bob', tags: ['user'] }
];
const allTags = users.map(u => u.tags).flat();
// ['admin', 'user', 'user']

// Unique tags
const uniqueTags = [...new Set(users.map(u => u.tags).flat())];
// ['admin', 'user']
```

#### Limitations & Caveats

1. **Creates new array (non-mutating)**:
   ```javascript
   const original = [[1], [2], [3]];
   const flattened = original.flat();
   console.log(original);  // [[1], [2], [3]] - unchanged
   ```

2. **Performance with large/deep arrays**:
   ```javascript
   // For very large arrays, consider iterative approach
   function flattenIterative(arr) {
       const result = [];
       const stack = [...arr];
       
       while (stack.length) {
           const item = stack.pop();
           if (Array.isArray(item)) {
               stack.push(...item);
           } else {
               result.unshift(item);
           }
       }
       return result;
   }
   ```

---

### Array.prototype.flatMap()

#### Professional Definition

`flatMap()` maps each element using a mapping function, then flattens the result by one level. It's equivalent to `map().flat(1)` but more efficient as it's done in a single pass.

#### Syntax

```javascript
array.flatMap(callback)
array.flatMap(callback, thisArg)
```

#### Use Cases

```javascript
// Basic flatMap
[1, 2, 3].flatMap(x => [x, x * 2]);
// [1, 2, 2, 4, 3, 6]

// Compare with map + flat
[1, 2, 3].map(x => [x, x * 2]).flat();
// Same result, but two passes

// Filter and transform in one pass
const sentences = ['Hello World', 'How are you'];
sentences.flatMap(s => s.split(' '));
// ['Hello', 'World', 'How', 'are', 'you']

// Remove items by returning empty array
const nums = [1, 2, 3, 4, 5, 6];
nums.flatMap(n => n % 2 === 0 ? [n] : []);
// [2, 4, 6]

// Duplicate certain items
nums.flatMap(n => n > 3 ? [n, n] : [n]);
// [1, 2, 3, 4, 4, 5, 5, 6, 6]

// Parse and flatten
const data = ['1,2,3', '4,5,6'];
data.flatMap(str => str.split(',').map(Number));
// [1, 2, 3, 4, 5, 6]

// Real-world: Expand nested data
const orders = [
    { id: 1, items: ['apple', 'banana'] },
    { id: 2, items: ['orange'] }
];
orders.flatMap(order => 
    order.items.map(item => ({ orderId: order.id, item }))
);
// [
//   { orderId: 1, item: 'apple' },
//   { orderId: 1, item: 'banana' },
//   { orderId: 2, item: 'orange' }
// ]
```

#### Limitations & Caveats

1. **Only flattens one level**:
   ```javascript
   [[1], [[2]]].flatMap(x => x);
   // [1, [2]] - nested array not flattened
   
   // For deeper flattening, use flat()
   [[1], [[2]]].flatMap(x => x).flat();
   // [1, 2]
   ```

---

### Array.prototype.at()

#### Professional Definition

`at()` takes an integer value and returns the item at that index, supporting negative integers to count from the end. It provides a cleaner syntax for accessing elements from the end of an array.

#### Syntax

```javascript
array.at(index)
```

#### Use Cases

```javascript
const arr = ['a', 'b', 'c', 'd', 'e'];

// Positive index (same as bracket notation)
arr.at(0);   // 'a'
arr.at(2);   // 'c'

// Negative index (counts from end)
arr.at(-1);  // 'e' (last element)
arr.at(-2);  // 'd' (second to last)
arr.at(-5);  // 'a' (first element)

// Compare with bracket notation
arr[arr.length - 1];  // 'e' - verbose
arr.at(-1);           // 'e' - cleaner

// Out of bounds returns undefined
arr.at(10);   // undefined
arr.at(-10);  // undefined

// Works with strings too
'hello'.at(-1);  // 'o'

// Useful in method chains
[1, 2, 3, 4, 5]
    .filter(n => n > 2)
    .map(n => n * 2)
    .at(-1);  // 10 (last element of [6, 8, 10])
```

#### Limitations & Caveats

1. **Returns undefined for out-of-bounds**:
   ```javascript
   const arr = [1, 2, 3];
   arr.at(100);  // undefined
   arr[100];     // undefined (same behavior)
   ```

2. **Cannot be used for assignment**:
   ```javascript
   const arr = [1, 2, 3];
   arr.at(-1) = 4;  // ❌ SyntaxError
   arr[arr.length - 1] = 4;  // ✅ Works
   ```

---

### Array.prototype.findLast() & findLastIndex()

#### Professional Definition

`findLast()` returns the last element that satisfies the provided testing function. `findLastIndex()` returns the index of that element. Both iterate from end to start. (ES2023)

#### Syntax

```javascript
array.findLast(callback)
array.findLastIndex(callback)
```

#### Use Cases

```javascript
const nums = [1, 2, 3, 4, 5, 4, 3, 2, 1];

// find vs findLast
nums.find(n => n > 3);      // 4 (first match)
nums.findLast(n => n > 3);  // 4 (last match, at index 5)

// findIndex vs findLastIndex
nums.findIndex(n => n > 3);      // 3
nums.findLastIndex(n => n > 3);  // 5

// Real-world: Find most recent item matching criteria
const transactions = [
    { id: 1, type: 'credit', amount: 100 },
    { id: 2, type: 'debit', amount: 50 },
    { id: 3, type: 'credit', amount: 200 },
    { id: 4, type: 'debit', amount: 75 }
];

const lastCredit = transactions.findLast(t => t.type === 'credit');
// { id: 3, type: 'credit', amount: 200 }

const lastCreditIndex = transactions.findLastIndex(t => t.type === 'credit');
// 2

// Before ES2023 (manual implementation)
function findLastManual(arr, predicate) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i], i, arr)) {
            return arr[i];
        }
    }
    return undefined;
}
```

---

### Array.prototype.toSorted(), toReversed(), toSpliced()

#### Professional Definition

These are **copying** versions of `sort()`, `reverse()`, and `splice()`. They return new arrays without modifying the original. (ES2023)

#### Syntax

```javascript
array.toSorted()
array.toSorted(compareFn)
array.toReversed()
array.toSpliced(start, deleteCount, ...items)
```

#### Use Cases

```javascript
// toSorted - non-mutating sort
const nums = [3, 1, 4, 1, 5, 9];
const sorted = nums.toSorted((a, b) => a - b);

console.log(sorted);  // [1, 1, 3, 4, 5, 9]
console.log(nums);    // [3, 1, 4, 1, 5, 9] - unchanged!

// Compare with sort (mutating)
const nums2 = [3, 1, 4];
nums2.sort((a, b) => a - b);  // Mutates nums2

// toReversed - non-mutating reverse
const arr = [1, 2, 3];
const reversed = arr.toReversed();

console.log(reversed);  // [3, 2, 1]
console.log(arr);       // [1, 2, 3] - unchanged!

// toSpliced - non-mutating splice
const items = ['a', 'b', 'c', 'd'];

// Remove items
items.toSpliced(1, 2);  // ['a', 'd']

// Insert items
items.toSpliced(1, 0, 'x', 'y');  // ['a', 'x', 'y', 'b', 'c', 'd']

// Replace items
items.toSpliced(1, 2, 'x');  // ['a', 'x', 'd']

console.log(items);  // ['a', 'b', 'c', 'd'] - unchanged!

// Real-world: Immutable state updates
const state = {
    users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
    ]
};

// Remove user at index 1
const newState = {
    ...state,
    users: state.users.toSpliced(1, 1)
};
// state.users unchanged, newState.users has Bob removed
```

#### Before ES2023 (Alternatives)

```javascript
// Before toSorted
const sorted = [...arr].sort(compareFn);

// Before toReversed
const reversed = [...arr].reverse();

// Before toSpliced
const spliced = [...arr.slice(0, start), ...items, ...arr.slice(start + deleteCount)];
```

---

### Array.prototype.with()

#### Professional Definition

`with()` returns a new array with the element at the given index replaced with the given value. It's the copying version of bracket notation assignment. (ES2023)

#### Syntax

```javascript
array.with(index, value)
```

#### Use Cases

```javascript
const arr = ['a', 'b', 'c', 'd'];

// Replace element (non-mutating)
const newArr = arr.with(1, 'x');

console.log(newArr);  // ['a', 'x', 'c', 'd']
console.log(arr);     // ['a', 'b', 'c', 'd'] - unchanged!

// Negative index
arr.with(-1, 'z');  // ['a', 'b', 'c', 'z']

// Chaining
arr.with(0, 'w').with(1, 'x').with(2, 'y');
// ['w', 'x', 'y', 'd']

// Real-world: Immutable state update
const todos = [
    { id: 1, text: 'Learn JS', done: false },
    { id: 2, text: 'Build app', done: false }
];

// Toggle todo at index 0
const updatedTodos = todos.with(0, { ...todos[0], done: true });

// Before with()
const updatedManual = todos.map((todo, i) => 
    i === 0 ? { ...todo, done: true } : todo
);
```

#### Limitations & Caveats

1. **Throws RangeError for invalid index**:
   ```javascript
   const arr = [1, 2, 3];
   arr.with(10, 'x');  // RangeError: Invalid index
   arr.with(-10, 'x'); // RangeError: Invalid index
   ```

---

### Array.prototype.includes()

#### Professional Definition

`includes()` determines whether an array includes a certain value, returning `true` or `false`. It uses **SameValueZero** comparison (handles NaN correctly).

#### Syntax

```javascript
array.includes(searchElement)
array.includes(searchElement, fromIndex)
```

#### Use Cases

```javascript
const arr = [1, 2, 3, NaN];

// Basic usage
arr.includes(2);     // true
arr.includes(4);     // false

// Handles NaN (unlike indexOf)
arr.includes(NaN);   // true
arr.indexOf(NaN);    // -1 (doesn't find NaN!)

// With fromIndex
arr.includes(1, 1);  // false (starts searching from index 1)
arr.includes(3, -2); // true (negative index counts from end)

// Case-sensitive for strings
['Apple', 'Banana'].includes('apple');  // false

// Object reference comparison
const obj = { a: 1 };
[obj, { b: 2 }].includes(obj);      // true
[obj, { b: 2 }].includes({ a: 1 }); // false (different reference)

// Practical: Check if value is one of allowed values
const allowedRoles = ['admin', 'editor', 'viewer'];
function hasAccess(role) {
    return allowedRoles.includes(role);
}
```

#### Limitations & Caveats

1. **Reference comparison for objects**:
   ```javascript
   // ❌ Doesn't work for object equality
   [{ a: 1 }].includes({ a: 1 });  // false
   
   // ✅ Use some() for custom comparison
   [{ a: 1 }].some(obj => obj.a === 1);  // true
   ```

---

### Array.prototype.entries(), keys(), values()

#### Professional Definition

These methods return new Array Iterator objects. `entries()` returns key/value pairs, `keys()` returns indices, and `values()` returns values.

#### Use Cases

```javascript
const arr = ['a', 'b', 'c'];

// entries() - returns [index, value] pairs
for (const [index, value] of arr.entries()) {
    console.log(index, value);
}
// 0 'a'
// 1 'b'
// 2 'c'

// keys() - returns indices
[...arr.keys()];  // [0, 1, 2]

// values() - returns values
[...arr.values()];  // ['a', 'b', 'c']

// Practical: Enumerate with index
const items = ['apple', 'banana', 'cherry'];
const enumerated = [...items.entries()].map(
    ([i, item]) => `${i + 1}. ${item}`
);
// ['1. apple', '2. banana', '3. cherry']

// Works with sparse arrays
const sparse = [1, , 3];
[...sparse.keys()];     // [0, 1, 2]
[...sparse.values()];   // [1, undefined, 3]
[...sparse.entries()];  // [[0, 1], [1, undefined], [2, 3]]
```

---

### Array.prototype.group() & groupToMap() (Proposed)

#### Professional Definition

`group()` groups array elements by a key returned from a callback. `groupToMap()` returns a Map instead of an object. (Stage 3 proposal - may change)

#### Use Cases

```javascript
// Note: Check browser/Node.js support - may need polyfill

const inventory = [
    { name: 'asparagus', type: 'vegetables', quantity: 5 },
    { name: 'bananas', type: 'fruit', quantity: 0 },
    { name: 'goat', type: 'meat', quantity: 23 },
    { name: 'cherries', type: 'fruit', quantity: 5 },
    { name: 'fish', type: 'meat', quantity: 22 }
];

// Group by type
const grouped = inventory.group(item => item.type);
// {
//   vegetables: [{ name: 'asparagus', ... }],
//   fruit: [{ name: 'bananas', ... }, { name: 'cherries', ... }],
//   meat: [{ name: 'goat', ... }, { name: 'fish', ... }]
// }

// Group by custom key
const byQuantity = inventory.group(item => 
    item.quantity > 0 ? 'inStock' : 'outOfStock'
);

// groupToMap - returns Map (useful for non-string keys)
const byTypeMap = inventory.groupToMap(item => item.type);
byTypeMap.get('fruit');  // [{ name: 'bananas', ... }, ...]

// Before group() - manual implementation
function groupBy(arr, keyFn) {
    return arr.reduce((acc, item) => {
        const key = keyFn(item);
        (acc[key] ??= []).push(item);
        return acc;
    }, {});
}
```

---

## Object Methods

### Object.keys(), values(), entries()

#### Professional Definition

These methods return arrays of an object's own enumerable property names, values, or key-value pairs respectively.

#### Use Cases

```javascript
const user = {
    name: 'Andrei',
    age: 30,
    role: 'developer'
};

// Object.keys() - returns array of keys
Object.keys(user);  // ['name', 'age', 'role']

// Object.values() - returns array of values
Object.values(user);  // ['Andrei', 30, 'developer']

// Object.entries() - returns array of [key, value] pairs
Object.entries(user);
// [['name', 'Andrei'], ['age', 30], ['role', 'developer']]

// Iteration patterns
for (const key of Object.keys(user)) {
    console.log(key, user[key]);
}

for (const [key, value] of Object.entries(user)) {
    console.log(key, value);
}

// Transform object
const doubled = Object.fromEntries(
    Object.entries({ a: 1, b: 2 }).map(([k, v]) => [k, v * 2])
);
// { a: 2, b: 4 }

// Filter object
const filtered = Object.fromEntries(
    Object.entries(user).filter(([k, v]) => typeof v === 'string')
);
// { name: 'Andrei', role: 'developer' }
```

#### Limitations & Caveats

1. **Only enumerable own properties**:
   ```javascript
   const obj = Object.create({ inherited: true });
   obj.own = true;
   Object.defineProperty(obj, 'hidden', {
       value: 'secret',
       enumerable: false
   });
   
   Object.keys(obj);    // ['own'] - no inherited, no non-enumerable
   Object.values(obj);  // [true]
   ```

2. **Order is not guaranteed for integer keys**:
   ```javascript
   const obj = { 2: 'b', 1: 'a', 3: 'c' };
   Object.keys(obj);  // ['1', '2', '3'] - sorted numerically!
   
   const obj2 = { b: 2, a: 1, c: 3 };
   Object.keys(obj2);  // ['b', 'a', 'c'] - insertion order
   ```

---

### Object.fromEntries()

#### Professional Definition

`Object.fromEntries()` transforms a list of key-value pairs into an object. It's the reverse of `Object.entries()`.

#### Syntax

```javascript
Object.fromEntries(iterable)
```

#### Use Cases

```javascript
// From entries array
Object.fromEntries([['a', 1], ['b', 2], ['c', 3]]);
// { a: 1, b: 2, c: 3 }

// From Map
const map = new Map([['name', 'Andrei'], ['age', 30]]);
Object.fromEntries(map);
// { name: 'Andrei', age: 30 }

// Transform object
const original = { a: 1, b: 2, c: 3 };
const transformed = Object.fromEntries(
    Object.entries(original).map(([k, v]) => [k.toUpperCase(), v * 10])
);
// { A: 10, B: 20, C: 30 }

// Filter object properties
const user = { name: 'Andrei', password: 'secret', age: 30 };
const safeUser = Object.fromEntries(
    Object.entries(user).filter(([key]) => key !== 'password')
);
// { name: 'Andrei', age: 30 }

// Swap keys and values
const original2 = { a: 1, b: 2, c: 3 };
const swapped = Object.fromEntries(
    Object.entries(original2).map(([k, v]) => [v, k])
);
// { 1: 'a', 2: 'b', 3: 'c' }

// Parse URL search params
const params = new URLSearchParams('name=Andrei&age=30');
Object.fromEntries(params);
// { name: 'Andrei', age: '30' }

// Merge objects with transformation
const defaults = { theme: 'light', lang: 'en' };
const overrides = { theme: 'dark' };
const merged = Object.fromEntries([
    ...Object.entries(defaults),
    ...Object.entries(overrides)
]);
// { theme: 'dark', lang: 'en' }
```

---

### Object.assign()

#### Professional Definition

`Object.assign()` copies all enumerable own properties from one or more source objects to a target object. It returns the modified target object.

#### Syntax

```javascript
Object.assign(target, ...sources)
```

#### Use Cases

```javascript
// Basic merge
const target = { a: 1 };
const source = { b: 2 };
Object.assign(target, source);
// target is now { a: 1, b: 2 }

// Multiple sources (later sources override)
Object.assign({}, { a: 1 }, { b: 2 }, { a: 3 });
// { a: 3, b: 2 }

// Clone object (shallow)
const clone = Object.assign({}, original);

// Merge with defaults
const defaults = { theme: 'light', lang: 'en', debug: false };
const options = { theme: 'dark' };
const config = Object.assign({}, defaults, options);
// { theme: 'dark', lang: 'en', debug: false }

// Add properties to existing object
const user = { name: 'Andrei' };
Object.assign(user, { age: 30, role: 'admin' });
// user is now { name: 'Andrei', age: 30, role: 'admin' }
```

#### Limitations & Caveats

1. **Shallow copy only**:
   ```javascript
   const original = { nested: { value: 1 } };
   const copy = Object.assign({}, original);
   
   copy.nested.value = 2;
   console.log(original.nested.value);  // 2 - affected!
   ```

2. **Doesn't copy non-enumerable or inherited properties**:
   ```javascript
   const source = Object.create({ inherited: true });
   Object.defineProperty(source, 'hidden', {
       value: 'secret',
       enumerable: false
   });
   source.visible = 'shown';
   
   const copy = Object.assign({}, source);
   // { visible: 'shown' } - no inherited, no hidden
   ```

3. **Prefer spread for simple cases**:
   ```javascript
   // Modern alternative
   const merged = { ...defaults, ...options };
   ```

---

### Object.hasOwn()

#### Professional Definition

`Object.hasOwn()` returns `true` if the specified object has the indicated property as its own property. It's a safer replacement for `hasOwnProperty()`. (ES2022)

#### Syntax

```javascript
Object.hasOwn(obj, prop)
```

#### Use Cases

```javascript
const user = { name: 'Andrei', age: 30 };

// Check own property
Object.hasOwn(user, 'name');      // true
Object.hasOwn(user, 'toString');  // false (inherited)

// Safer than hasOwnProperty
// ❌ Can be overridden or unavailable
const obj = { hasOwnProperty: () => false };
obj.hasOwnProperty('hasOwnProperty');  // false (wrong!)

// ❌ Objects created with null prototype
const nullProto = Object.create(null);
nullProto.key = 'value';
nullProto.hasOwnProperty('key');  // TypeError!

// ✅ Object.hasOwn always works
Object.hasOwn(obj, 'hasOwnProperty');  // true
Object.hasOwn(nullProto, 'key');       // true

// Before Object.hasOwn (safe alternative)
Object.prototype.hasOwnProperty.call(obj, 'prop');
```

---

### Object.freeze(), seal(), preventExtensions()

#### Professional Definition

These methods control object mutability at different levels:
- `freeze()`: No add, delete, or modify
- `seal()`: No add or delete, can modify existing
- `preventExtensions()`: No add, can delete and modify

#### Comparison

| Method | Add | Delete | Modify |
|--------|-----|--------|--------|
| `freeze()` | ❌ | ❌ | ❌ |
| `seal()` | ❌ | ❌ | ✅ |
| `preventExtensions()` | ❌ | ✅ | ✅ |

#### Use Cases

```javascript
// Object.freeze - completely immutable
const frozen = Object.freeze({ a: 1, b: 2 });
frozen.a = 10;     // Silently fails (throws in strict mode)
frozen.c = 3;      // Silently fails
delete frozen.a;   // Silently fails
console.log(frozen);  // { a: 1, b: 2 }

// Object.seal - can modify, can't add/delete
const sealed = Object.seal({ a: 1, b: 2 });
sealed.a = 10;     // ✅ Works
sealed.c = 3;      // ❌ Fails
delete sealed.a;   // ❌ Fails
console.log(sealed);  // { a: 10, b: 2 }

// Object.preventExtensions - can't add new properties
const noExtend = Object.preventExtensions({ a: 1 });
noExtend.a = 10;   // ✅ Works
noExtend.b = 2;    // ❌ Fails
delete noExtend.a; // ✅ Works

// Check status
Object.isFrozen(frozen);           // true
Object.isSealed(sealed);           // true
Object.isExtensible(noExtend);     // false
```

#### Limitations & Caveats

1. **All are shallow**:
   ```javascript
   const obj = Object.freeze({ nested: { value: 1 } });
   obj.nested.value = 2;  // ✅ Works! Nested object not frozen
   
   // Deep freeze
   function deepFreeze(obj) {
       Object.freeze(obj);
       Object.values(obj).forEach(value => {
           if (typeof value === 'object' && value !== null) {
               deepFreeze(value);
           }
       });
       return obj;
   }
   ```

---

### Object.getOwnPropertyDescriptor(s)

#### Professional Definition

`getOwnPropertyDescriptor()` returns a property descriptor for an own property. `getOwnPropertyDescriptors()` returns all own property descriptors.

#### Use Cases

```javascript
const obj = {
    name: 'Andrei',
    get fullName() { return this.name; }
};

// Single property
Object.getOwnPropertyDescriptor(obj, 'name');
// {
//   value: 'Andrei',
//   writable: true,
//   enumerable: true,
//   configurable: true
// }

Object.getOwnPropertyDescriptor(obj, 'fullName');
// {
//   get: [Function: get fullName],
//   set: undefined,
//   enumerable: true,
//   configurable: true
// }

// All properties
Object.getOwnPropertyDescriptors(obj);
// {
//   name: { value: 'Andrei', ... },
//   fullName: { get: [Function], ... }
// }

// Useful for proper object cloning with getters/setters
const clone = Object.defineProperties(
    {},
    Object.getOwnPropertyDescriptors(obj)
);

// Or with Object.create
const clone2 = Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj)
);
```

---

## Practical Patterns

### Chaining Transformations

```javascript
const data = [
    { name: 'Alice', age: 25, department: 'Engineering' },
    { name: 'Bob', age: 30, department: 'Marketing' },
    { name: 'Charlie', age: 35, department: 'Engineering' },
    { name: 'Diana', age: 28, department: 'Engineering' }
];

// Chain multiple operations
const result = data
    .filter(person => person.department === 'Engineering')
    .map(person => ({ ...person, senior: person.age > 30 }))
    .toSorted((a, b) => b.age - a.age)
    .map(person => person.name);

// ['Charlie', 'Diana', 'Alice']
```

### Immutable Updates

```javascript
// Update nested state immutably
const state = {
    users: [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false }
    ],
    settings: { theme: 'dark' }
};

// Update user at index 1
const newState = {
    ...state,
    users: state.users.with(1, { ...state.users[1], active: true })
};

// Or using toSpliced
const newState2 = {
    ...state,
    users: state.users.toSpliced(1, 1, { ...state.users[1], active: true })
};
```

### Object Transformation Pipeline

```javascript
// Transform object through pipeline
const transformObject = (obj, ...transformers) =>
    transformers.reduce((acc, fn) => fn(acc), obj);

const addTimestamp = obj => ({ ...obj, timestamp: Date.now() });
const removeNulls = obj => Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
);
const lowercase = obj => Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])
);

const result = transformObject(
    { Name: 'Andrei', Age: null, Role: 'Admin' },
    lowercase,
    removeNulls,
    addTimestamp
);
// { name: 'Andrei', role: 'Admin', timestamp: 1234567890 }
```

---

## Key Takeaways

| Method | Purpose | Mutates |
|--------|---------|---------|
| `Array.from()` | Create array from iterable | N/A |
| `Array.of()` | Create array from arguments | N/A |
| `flat()` | Flatten nested arrays | No |
| `flatMap()` | Map + flatten in one pass | No |
| `at()` | Access by index (supports negative) | No |
| `findLast()` | Find from end | No |
| `toSorted()` | Sort without mutating | No |
| `toReversed()` | Reverse without mutating | No |
| `toSpliced()` | Splice without mutating | No |
| `with()` | Replace element without mutating | No |
| `Object.fromEntries()` | Create object from entries | N/A |
| `Object.hasOwn()` | Safe own property check | No |

### Best Practices

1. **Prefer non-mutating methods** for predictable code
2. **Use `at(-1)`** instead of `arr[arr.length - 1]`
3. **Use `Object.hasOwn()`** instead of `hasOwnProperty()`
4. **Use `toSorted()`/`toReversed()`** when you need to preserve original
5. **Chain methods** for readable transformations
6. **Use `flatMap()`** instead of `map().flat()`

---

> 💡 **Professional Tip**: Modern array methods like `toSorted()`, `toReversed()`, and `with()` are game-changers for immutable programming patterns. They eliminate the need for manual spreading (`[...arr].sort()`) and make functional programming in JavaScript much cleaner. Check browser/Node.js support and use polyfills if needed for older environments.

