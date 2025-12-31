# Closures & Prototypes

> "The first principle is that you must not fool yourself — and you are the easiest person to fool." - Richard Feynman

These two concepts are the **pillars of JavaScript**. Master them, and you'll understand why JavaScript works the way it does.

---

## Closures

### Professional Definition

A **closure** is the combination of a function bundled together with references to its surrounding state (the **lexical environment**). In JavaScript, closures are created every time a function is created, at function creation time. A closure gives a function access to its outer scope's variables even after the outer function has returned.

According to the ECMAScript specification, every function has an internal `[[Environment]]` slot that holds a reference to the Lexical Environment in which the function was defined.

### Simple Explanation

Imagine you have a **backpack**. When you leave your house (a function), you take some things with you in that backpack. Even when you're far from home, you still have access to those things. A closure is a function that "remembers" the variables from where it was created.

### Technical Specifications

| Aspect | Description |
|--------|-------------|
| Creation | At function creation time (not invocation) |
| Scope Chain | References to all outer lexical environments |
| Garbage Collection | Closed-over variables are retained until closure is garbage collected |
| Memory | Each closure maintains its own copy of the lexical environment |
| Performance | Accessing closed-over variables is slower than local variables |

### How Closures Work Internally

```javascript
function outer() {
    let count = 0;  // Stored in outer's Lexical Environment
    
    return function inner() {
        count++;    // References outer's Lexical Environment
        return count;
    };
}

const counter = outer();
// counter.[[Environment]] → outer's Lexical Environment → { count: 0 }

counter();  // 1
counter();  // 2
counter();  // 3
```

**Internal structure:**
```
counter (function)
    └── [[Environment]]
            └── Lexical Environment of outer()
                    └── { count: 3 }
                            └── [[OuterEnv]] → Global Lexical Environment
```

### Limitations & Caveats

1. **Memory leaks from unintended closures**:
   ```javascript
   function createHandler() {
       const hugeData = new Array(1000000).fill('data');
       
       // ❌ Closure keeps hugeData alive even if unused
       return function handler() {
           return "clicked";
       };
   }
   
   // ✅ Extract only what you need
   function createHandler() {
       const hugeData = new Array(1000000).fill('data');
       const dataLength = hugeData.length;  // Extract needed value
       
       return function handler() {
           return `clicked, had ${dataLength} items`;
       };
   }
   ```

2. **Classic loop closure problem**:
   ```javascript
   // ❌ All callbacks share the same i
   for (var i = 0; i < 3; i++) {
       setTimeout(function() {
           console.log(i);  // 3, 3, 3
       }, 100);
   }
   
   // ✅ Solution 1: Use let (block-scoped)
   for (let i = 0; i < 3; i++) {
       setTimeout(function() {
           console.log(i);  // 0, 1, 2
       }, 100);
   }
   
   // ✅ Solution 2: IIFE creates new scope
   for (var i = 0; i < 3; i++) {
       (function(j) {
           setTimeout(function() {
               console.log(j);  // 0, 1, 2
           }, 100);
       })(i);
   }
   ```

3. **Closures in loops with event listeners**:
   ```javascript
   // ❌ All buttons log the same value
   for (var i = 0; i < buttons.length; i++) {
       buttons[i].onclick = function() {
           console.log(i);  // Always buttons.length
       };
   }
   
   // ✅ Use let or bind
   for (let i = 0; i < buttons.length; i++) {
       buttons[i].onclick = function() {
           console.log(i);  // Correct index
       };
   }
   ```

4. **Performance impact of deep closures**:
   ```javascript
   // Each nested function creates another scope lookup
   function level1() {
       const a = 1;
       return function level2() {
           const b = 2;
           return function level3() {
               const c = 3;
               return function level4() {
                   // Accessing 'a' requires 4 scope lookups
                   return a + b + c;
               };
           };
       };
   }
   ```

5. **Closures and `this` are independent**:
   ```javascript
   const obj = {
       value: 42,
       createGetter: function() {
           // Closure captures 'value' but not 'this'
           return function() {
               return this.value;  // 'this' is NOT obj
           };
       }
   };
   
   const getter = obj.createGetter();
   getter();  // undefined (this is global/undefined)
   
   // Fix: capture 'this' or use arrow function
   createGetter: function() {
       const self = this;
       return function() {
           return self.value;  // 42
       };
   }
   ```

### Closure Use Cases

#### 1. Data Privacy (Module Pattern)

```javascript
const bankAccount = (function() {
    let balance = 0;  // Private
    
    return {
        deposit(amount) {
            if (amount > 0) balance += amount;
            return balance;
        },
        withdraw(amount) {
            if (amount > 0 && amount <= balance) {
                balance -= amount;
            }
            return balance;
        },
        getBalance() {
            return balance;
        }
    };
})();

bankAccount.deposit(100);  // 100
bankAccount.balance;       // undefined (private!)
bankAccount.getBalance();  // 100
```

#### 2. Function Factories

```javascript
function createMultiplier(multiplier) {
    return function(number) {
        return number * multiplier;
    };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

double(5);  // 10
triple(5);  // 15
```

#### 3. Memoization

```javascript
function memoize(fn) {
    const cache = {};  // Closed over
    
    return function(...args) {
        const key = JSON.stringify(args);
        if (!(key in cache)) {
            cache[key] = fn.apply(this, args);
        }
        return cache[key];
    };
}

const expensiveFn = memoize((n) => {
    console.log('Computing...');
    return n * 2;
});

expensiveFn(5);  // Computing... 10
expensiveFn(5);  // 10 (cached)
```

#### 4. Partial Application

```javascript
function partial(fn, ...presetArgs) {
    return function(...laterArgs) {
        return fn(...presetArgs, ...laterArgs);
    };
}

const add = (a, b, c) => a + b + c;
const add5 = partial(add, 5);

add5(3, 2);  // 10 (5 + 3 + 2)
```

---

## Prototypes & Prototypal Inheritance

### Professional Definition

A **prototype** is an object from which other objects inherit properties. Every JavaScript object has an internal slot `[[Prototype]]` (accessible via `Object.getPrototypeOf()` or the deprecated `__proto__`) that references another object or `null`. This creates a **prototype chain** used for property resolution.

**Prototypal inheritance** is JavaScript's native inheritance model where objects directly inherit from other objects, as opposed to classical inheritance where classes inherit from classes.

### Simple Explanation

Think of it like a **family tree** - if you don't have something, you ask your parents. If they don't have it, they ask their parents. This continues until you reach the top (null).

### Technical Specifications

| Term | Description |
|------|-------------|
| `[[Prototype]]` | Internal slot on every object pointing to its prototype |
| `__proto__` | Legacy accessor for `[[Prototype]]` (deprecated) |
| `prototype` | Property on functions, becomes `[[Prototype]]` of instances |
| Prototype chain | Linked list of objects for property resolution |
| Chain terminus | `Object.prototype` → `null` |
| Property shadowing | Own property hides inherited property of same name |

### Prototype Chain Visualization

```
const dog = new Dog("Buddy");

dog
 │
 └──[[Prototype]]──▶ Dog.prototype
                      │    { bark: function }
                      │
                      └──[[Prototype]]──▶ Object.prototype
                                          │    { toString, hasOwnProperty, ... }
                                          │
                                          └──[[Prototype]]──▶ null
```

### `__proto__` vs `prototype`

This confuses EVERYONE. Here's the definitive explanation:

| Property | Exists On | Purpose |
|----------|-----------|---------|
| `__proto__` | Every object | Points to the object's prototype |
| `prototype` | Functions only | Becomes `[[Prototype]]` of instances created with `new` |

```javascript
function Dog(name) {
    this.name = name;
}
Dog.prototype.bark = function() { return "Woof!"; };

const myDog = new Dog("Buddy");

// __proto__ is on every object
myDog.__proto__ === Dog.prototype;  // true
Dog.__proto__ === Function.prototype;  // true
Dog.prototype.__proto__ === Object.prototype;  // true

// prototype is only on functions
myDog.prototype;  // undefined (myDog is not a function)
Dog.prototype;    // { bark: function, constructor: Dog }
```

### Limitations & Caveats

1. **`__proto__` is deprecated**:
   ```javascript
   // ❌ Deprecated (but still works)
   obj.__proto__ = newProto;
   
   // ✅ Modern alternative
   Object.setPrototypeOf(obj, newProto);
   Object.getPrototypeOf(obj);
   
   // ✅ At creation time
   Object.create(proto);
   ```

2. **Changing prototype is slow**:
   ```javascript
   // ⚠️ Changing [[Prototype]] deoptimizes the object
   Object.setPrototypeOf(obj, newProto);
   
   // ✅ Prefer setting prototype at creation
   const obj = Object.create(proto);
   ```

3. **Prototype pollution security risk**:
   ```javascript
   // ❌ DANGEROUS: Affects ALL objects!
   Object.prototype.malicious = function() {
       console.log("Hacked!");
   };
   
   ({}).malicious();  // "Hacked!"
   [].malicious();    // "Hacked!"
   
   // ✅ Never modify built-in prototypes
   ```

4. **Property shadowing pitfalls**:
   ```javascript
   const proto = { count: 0 };
   const obj = Object.create(proto);
   
   obj.count++;  // Creates OWN property, doesn't increment proto.count
   console.log(obj.count);    // 1 (own)
   console.log(proto.count);  // 0 (unchanged)
   
   // To modify prototype property directly:
   proto.count++;  // or
   Object.getPrototypeOf(obj).count++;
   ```

5. **`hasOwnProperty` can be shadowed**:
   ```javascript
   const obj = {
       hasOwnProperty: function() { return false; }
   };
   
   obj.hasOwnProperty("key");  // Uses shadowed method!
   
   // ✅ Safe way
   Object.prototype.hasOwnProperty.call(obj, "key");
   // or in ES2022+
   Object.hasOwn(obj, "key");
   ```

6. **`for...in` includes inherited properties**:
   ```javascript
   const proto = { inherited: true };
   const obj = Object.create(proto);
   obj.own = true;
   
   for (let key in obj) {
       console.log(key);  // "own", "inherited"
   }
   
   // ✅ Filter with hasOwnProperty
   for (let key in obj) {
       if (Object.hasOwn(obj, key)) {
           console.log(key);  // "own" only
       }
   }
   
   // ✅ Or use Object.keys
   Object.keys(obj);  // ["own"]
   ```

7. **`instanceof` checks prototype chain, not constructor**:
   ```javascript
   function Foo() {}
   function Bar() {}
   
   const obj = new Foo();
   console.log(obj instanceof Foo);  // true
   
   // Change prototype chain
   Object.setPrototypeOf(obj, Bar.prototype);
   console.log(obj instanceof Foo);  // false
   console.log(obj instanceof Bar);  // true
   
   // Even though obj was created with new Foo()!
   ```

### Constructor Functions

#### Professional Definition

A **constructor function** is a function designed to be called with the `new` operator to create object instances. By convention, constructor names are PascalCase. When called with `new`, four steps occur: (1) create empty object, (2) set `[[Prototype]]` to constructor's `prototype`, (3) bind `this` to new object, (4) return `this` unless function returns an object.

```javascript
function Person(name, age) {
    // 1. this = {}
    // 2. this.[[Prototype]] = Person.prototype
    this.name = name;
    this.age = age;
    // 3. return this (implicit)
}

Person.prototype.greet = function() {
    return `Hello, I'm ${this.name}`;
};

const person = new Person("Andrei", 30);
```

#### What `new` Does (Step by Step)

```javascript
function _new(Constructor, ...args) {
    // 1. Create empty object with prototype set
    const obj = Object.create(Constructor.prototype);
    
    // 2. Call constructor with 'this' bound to new object
    const result = Constructor.apply(obj, args);
    
    // 3. If constructor returns an object, use that; otherwise use obj
    return (typeof result === 'object' && result !== null) ? result : obj;
}
```

#### Limitations & Caveats

1. **Forgetting `new`**:
   ```javascript
   function Person(name) {
       this.name = name;
   }
   
   const p = Person("Andrei");  // Forgot new!
   console.log(p);        // undefined
   console.log(name);     // "Andrei" (leaked to global!)
   
   // ✅ Protection: Check if called with new
   function SafePerson(name) {
       if (!(this instanceof SafePerson)) {
           return new SafePerson(name);
       }
       this.name = name;
   }
   
   // ✅ Or use ES6 new.target
   function SafePerson(name) {
       if (!new.target) {
           throw new Error("Must call with new");
       }
       this.name = name;
   }
   ```

2. **Constructor returning objects**:
   ```javascript
   function Weird() {
       this.a = 1;
       return { b: 2 };  // Returns this object instead!
   }
   
   const w = new Weird();
   console.log(w.a);  // undefined
   console.log(w.b);  // 2
   
   // Returning primitives is ignored
   function Normal() {
       this.a = 1;
       return 42;  // Ignored, this is returned
   }
   ```

3. **Arrow functions cannot be constructors**:
   ```javascript
   const Person = (name) => {
       this.name = name;
   };
   
   new Person("Andrei");  // TypeError: Person is not a constructor
   ```

### Object.create()

#### Professional Definition

`Object.create(proto, [propertiesObject])` creates a new object with the specified prototype and optionally defines new properties using property descriptors.

```javascript
const animal = {
    speak() {
        return `${this.name} makes a sound`;
    }
};

const dog = Object.create(animal, {
    name: { value: 'Buddy', writable: true, enumerable: true },
    bark: { value: function() { return 'Woof!'; } }
});

dog.speak();  // "Buddy makes a sound"
dog.bark();   // "Woof!"
Object.getPrototypeOf(dog) === animal;  // true
```

#### Limitations

1. **Property descriptors are verbose**:
   ```javascript
   // Verbose with Object.create
   const obj = Object.create(proto, {
       name: { value: 'test', writable: true, enumerable: true, configurable: true }
   });
   
   // Simpler: create then assign
   const obj = Object.create(proto);
   obj.name = 'test';
   ```

2. **Object.create(null) has no prototype methods**:
   ```javascript
   const dict = Object.create(null);
   dict.key = "value";
   
   dict.hasOwnProperty;  // undefined!
   dict.toString;        // undefined!
   
   // Useful for pure dictionaries without inherited properties
   ```

### Prototype Methods Reference

| Method | Description |
|--------|-------------|
| `Object.getPrototypeOf(obj)` | Returns `[[Prototype]]` of obj |
| `Object.setPrototypeOf(obj, proto)` | Sets `[[Prototype]]` (slow!) |
| `Object.create(proto)` | Creates object with specified prototype |
| `obj.hasOwnProperty(key)` | Checks if property is own (not inherited) |
| `Object.hasOwn(obj, key)` | ES2022 safe version of hasOwnProperty |
| `proto.isPrototypeOf(obj)` | Checks if proto is in obj's chain |
| `obj instanceof Constructor` | Checks if Constructor.prototype is in chain |

---

## ES6 Classes vs Prototypes

### Professional Definition

ES6 classes are **syntactic sugar** over JavaScript's prototype-based inheritance. Under the hood, classes still use prototypes. The `class` syntax provides a cleaner, more familiar syntax but has the same capabilities and limitations.

### Comparison

| Feature | Constructor Function | ES6 Class |
|---------|---------------------|-----------|
| Hoisting | Function hoisted | Not hoisted (TDZ) |
| `new` required | No (but buggy without) | Yes (throws error) |
| Methods enumerable | Yes | No |
| Strict mode | Optional | Always strict |
| `super` keyword | No | Yes |

```javascript
// Constructor function
function Person(name) {
    this.name = name;
}
Person.prototype.greet = function() {
    return `Hello, ${this.name}`;
};

// Equivalent ES6 class
class Person {
    constructor(name) {
        this.name = name;
    }
    greet() {
        return `Hello, ${this.name}`;
    }
}

// Both result in the same prototype chain!
```

### Limitations & Caveats

1. **Classes are not hoisted**:
   ```javascript
   const p = new Person();  // ReferenceError
   
   class Person {}
   ```

2. **Class methods are non-enumerable**:
   ```javascript
   class Foo {
       method() {}
   }
   Object.keys(Foo.prototype);  // [] (empty!)
   
   function Bar() {}
   Bar.prototype.method = function() {};
   Object.keys(Bar.prototype);  // ["method"]
   ```

3. **Classes always run in strict mode**:
   ```javascript
   class Foo {
       method() {
           // 'use strict' is implicit
           undeclaredVar = 1;  // ReferenceError
       }
   }
   ```

---

## Key Takeaways

### Closures
- Created at function definition, not invocation
- Maintains reference to lexical environment
- **Watch for**: memory leaks, loop variables, stale closures
- **Use for**: data privacy, factories, memoization

### Prototypes
- Every object has `[[Prototype]]` (accessible via `Object.getPrototypeOf`)
- Only functions have `prototype` property
- Property lookup traverses the prototype chain
- **Watch for**: prototype pollution, property shadowing, slow `setPrototypeOf`
- **Use**: `Object.create()` for clean inheritance, `Object.hasOwn()` for property checks

### Best Practices
- Prefer `Object.getPrototypeOf` over `__proto__`
- Never modify built-in prototypes
- Use ES6 classes for clearer syntax
- Understand that classes are still prototypes underneath

---

> 💡 **Professional Tip**: Use Chrome DevTools to inspect `[[Prototype]]` chains. Expand any object in the console to see its `[[Prototype]]` and trace the inheritance hierarchy. This is invaluable for debugging prototype-related issues.