# Object-Oriented Programming & Classes

> "The worthwhile problems are the ones you can really solve or help solve, the ones you can really contribute something to." - Richard Feynman

JavaScript's OOP model is unique - it's **prototype-based**, not class-based. ES6 classes are syntactic sugar over prototypes, providing familiar syntax while maintaining JavaScript's prototypal nature.

---

## ES6 Classes

### Professional Definition

An ES6 **class** is a syntactic construct that provides a cleaner, more declarative way to create constructor functions and establish prototypal inheritance. Under the hood, classes are still functions, and class methods are added to the constructor's prototype. Classes always execute in **strict mode** and are **not hoisted**.

### Technical Specifications

| Feature | Class | Constructor Function |
|---------|-------|---------------------|
| Hoisting | Not hoisted (TDZ) | Function hoisted |
| `new` required | Yes (throws error) | No (fails silently) |
| Methods enumerable | No | Yes |
| Strict mode | Always | Optional |
| `typeof` | `"function"` | `"function"` |
| `super` keyword | Yes | No |
| Static methods | `static` keyword | Manual assignment |

### Basic Syntax

```javascript
class Person {
    // Constructor - called when using 'new'
    constructor(name, age) {
        this.name = name;  // Instance property
        this.age = age;
    }
    
    // Prototype method (shared by all instances)
    greet() {
        return `Hello, I'm ${this.name}`;
    }
    
    // Static method (on the class itself)
    static create(name) {
        return new Person(name, 0);
    }
    
    // Getter
    get info() {
        return `${this.name}, ${this.age}`;
    }
    
    // Setter
    set info(value) {
        [this.name, this.age] = value.split(', ');
    }
}

const person = new Person('Andrei', 30);
```

### Limitations & Caveats

1. **Classes are not hoisted**:
   ```javascript
   const p = new Person();  // ReferenceError: Cannot access 'Person' before initialization
   
   class Person {}
   
   // Compare to function hoisting:
   const p2 = new Person2();  // Works!
   function Person2() {}
   ```

2. **Must use `new` to call classes**:
   ```javascript
   class Person {
       constructor(name) {
           this.name = name;
       }
   }
   
   Person('Andrei');  // TypeError: Class constructor Person cannot be invoked without 'new'
   
   // Constructor function doesn't enforce this:
   function PersonFn(name) {
       this.name = name;
   }
   PersonFn('Andrei');  // Creates global variable in non-strict mode!
   ```

3. **Class methods are non-enumerable**:
   ```javascript
   class Foo {
       method() {}
   }
   Object.keys(Foo.prototype);  // [] - empty!
   Object.getOwnPropertyNames(Foo.prototype);  // ['constructor', 'method']
   
   // Constructor function methods ARE enumerable by default:
   function Bar() {}
   Bar.prototype.method = function() {};
   Object.keys(Bar.prototype);  // ['method']
   ```

4. **No comma between class members**:
   ```javascript
   // ❌ SyntaxError
   class Foo {
       method1() {},  // Comma not allowed!
       method2() {}
   }
   
   // ✅ No separators needed
   class Foo {
       method1() {}
       method2() {}
   }
   ```

5. **Class body only allows methods and fields**:
   ```javascript
   // ❌ Cannot have arbitrary code in class body
   class Foo {
       console.log('hello');  // SyntaxError
       if (true) {}           // SyntaxError
   }
   
   // ✅ Use static initialization block (ES2022)
   class Foo {
       static {
           console.log('Class initialized');
       }
   }
   ```

---

## Static Members

### Professional Definition

**Static members** (methods and properties) belong to the class itself, not to instances. They are accessed via the class name and are often used for utility functions, factory methods, or class-level configuration.

### Technical Specifications

```javascript
class MathUtils {
    static PI = 3.14159;  // Static property (ES2022)
    
    static square(n) {    // Static method
        return n * n;
    }
    
    static {              // Static initialization block (ES2022)
        this.E = 2.71828;
    }
}

// Access via class name
MathUtils.PI;          // 3.14159
MathUtils.square(5);   // 25
MathUtils.E;           // 2.71828

// NOT available on instances
const utils = new MathUtils();
utils.PI;              // undefined
utils.square;          // undefined
```

### Limitations & Caveats

1. **`this` in static methods refers to the class**:
   ```javascript
   class Parent {
       static name = 'Parent';
       
       static getName() {
           return this.name;  // 'this' is the class
       }
   }
   
   class Child extends Parent {
       static name = 'Child';
   }
   
   Parent.getName();  // 'Parent'
   Child.getName();   // 'Child' - inherited and 'this' is Child
   ```

2. **Static methods don't have access to instance properties**:
   ```javascript
   class Counter {
       count = 0;
       
       static getCount() {
           return this.count;  // undefined! No instance access
       }
   }
   ```

3. **Static properties are inherited**:
   ```javascript
   class Parent {
       static value = 10;
   }
   
   class Child extends Parent {}
   
   Child.value;  // 10 (inherited)
   
   Child.value = 20;  // Creates own property
   Parent.value;  // 10 (unchanged)
   ```

---

## Instance Properties and Class Fields

### Professional Definition

**Class fields** (ES2022) allow declaring instance properties directly in the class body without using the constructor. Fields can be public or private (prefixed with `#`).

### Technical Specifications

```javascript
class User {
    // Public instance fields
    name = 'Anonymous';
    role = 'user';
    
    // Private instance field
    #password;
    
    // Public static field
    static count = 0;
    
    // Private static field
    static #secret = 'hidden';
    
    constructor(name, password) {
        this.name = name;
        this.#password = password;
        User.count++;
    }
    
    checkPassword(pwd) {
        return this.#password === pwd;
    }
}
```

### Limitations & Caveats

1. **Private fields MUST be declared in class body**:
   ```javascript
   class Foo {
       #declared;  // Must declare private field
       
       constructor() {
           this.#declared = 1;  // OK
           this.#undeclared = 2;  // SyntaxError: Private field '#undeclared' must be declared
       }
   }
   ```

2. **Private fields are truly private (not accessible outside)**:
   ```javascript
   class Foo {
       #private = 'secret';
   }
   
   const foo = new Foo();
   foo.#private;  // SyntaxError: Private field '#private' must be declared in an enclosing class
   foo['#private'];  // undefined (this is a different property!)
   
   // Cannot be accessed even with Reflect or Object methods
   Object.keys(foo);  // []
   Reflect.ownKeys(foo);  // [] - private fields not included
   ```

3. **Private fields are not inherited**:
   ```javascript
   class Parent {
       #value = 10;
       
       getValue() {
           return this.#value;
       }
   }
   
   class Child extends Parent {
       // Cannot access #value here!
       getParentValue() {
           return this.#value;  // SyntaxError
       }
   }
   
   const child = new Child();
   child.getValue();  // 10 - inherited method CAN access
   ```

4. **Class fields are assigned per-instance**:
   ```javascript
   class Foo {
       // Arrow function as field - new function per instance!
       handleClick = () => {
           console.log(this);
       };
   }
   
   const foo1 = new Foo();
   const foo2 = new Foo();
   foo1.handleClick === foo2.handleClick;  // false! Different functions
   
   // Memory impact: 1000 instances = 1000 functions
   // Prefer prototype methods for shared functionality
   ```

5. **Field initialization order**:
   ```javascript
   class Foo {
       a = 1;
       b = this.a + 1;  // OK, a is already initialized
       
       constructor() {
           console.log(this.b);  // 2
       }
   }
   
   // Fields are initialized:
   // 1. Before constructor runs
   // 2. In declaration order
   // 3. After super() in derived classes
   ```

---

## Getters and Setters

### Professional Definition

**Getters** and **setters** are accessor properties that allow controlled access to object properties. A getter is invoked when reading a property; a setter is invoked when writing. They enable computed properties, validation, and encapsulation.

### Technical Specifications

```javascript
class Circle {
    constructor(radius) {
        this._radius = radius;  // Convention: _ prefix for "private"
    }
    
    // Getter - accessed like property
    get radius() {
        return this._radius;
    }
    
    // Setter - with validation
    set radius(value) {
        if (value < 0) {
            throw new RangeError('Radius must be non-negative');
        }
        this._radius = value;
    }
    
    // Computed property (getter only)
    get area() {
        return Math.PI * this._radius ** 2;
    }
    
    get circumference() {
        return 2 * Math.PI * this._radius;
    }
}

const circle = new Circle(5);
circle.radius;        // 5 (invokes getter)
circle.radius = 10;   // invokes setter
circle.area;          // 314.159... (computed)
circle.area = 100;    // Silently ignored (no setter)
```

### Limitations & Caveats

1. **No setter means property is read-only**:
   ```javascript
   class Foo {
       get value() { return 42; }
       // No setter defined
   }
   
   const foo = new Foo();
   foo.value = 100;  // Silently fails (or TypeError in strict mode)
   console.log(foo.value);  // 42
   ```

2. **Getters can have side effects (but shouldn't)**:
   ```javascript
   // ❌ Bad: getter with side effects
   class Counter {
       #count = 0;
       
       get count() {
           return this.#count++;  // Changes state on read!
       }
   }
   
   const c = new Counter();
   c.count;  // 0
   c.count;  // 1 - different value!
   ```

3. **Infinite recursion trap**:
   ```javascript
   class Foo {
       get value() {
           return this.value;  // Calls itself infinitely!
       }
       
       set value(v) {
           this.value = v;  // Calls itself infinitely!
       }
   }
   
   // ✅ Use different internal property
   class Foo {
       #value;
       
       get value() { return this.#value; }
       set value(v) { this.#value = v; }
   }
   ```

4. **Getters/setters are on the prototype**:
   ```javascript
   class Foo {
       get value() { return 42; }
   }
   
   const foo = new Foo();
   foo.hasOwnProperty('value');  // false
   Object.getOwnPropertyDescriptor(Foo.prototype, 'value');
   // { get: [Function], set: undefined, enumerable: false, configurable: true }
   ```

---

## Inheritance with extends

### Professional Definition

The `extends` keyword establishes prototypal inheritance between classes. A **derived class** (subclass) inherits all properties and methods from the **base class** (superclass) and can override or extend them. The `super` keyword provides access to the parent class's constructor and methods.

### Technical Specifications

```javascript
class Animal {
    constructor(name) {
        this.name = name;
    }
    
    speak() {
        return `${this.name} makes a sound`;
    }
    
    static kingdom = 'Animalia';
}

class Dog extends Animal {
    constructor(name, breed) {
        super(name);  // MUST call super() before 'this'
        this.breed = breed;
    }
    
    // Override parent method
    speak() {
        return `${this.name} barks: Woof!`;
    }
    
    // Call parent method
    describeLoud() {
        return super.speak().toUpperCase();
    }
}

const dog = new Dog('Buddy', 'Labrador');
dog.speak();  // "Buddy barks: Woof!"
Dog.kingdom;  // "Animalia" (static inherited)
```

### Limitations & Caveats

1. **MUST call `super()` before using `this` in derived constructor**:
   ```javascript
   class Child extends Parent {
       constructor() {
           this.value = 1;  // ReferenceError: Must call super first
           super();
       }
   }
   
   // If no constructor, super() is called automatically:
   class Child extends Parent {
       // Implicit: constructor(...args) { super(...args); }
   }
   ```

2. **`super` only works in methods, not regular functions**:
   ```javascript
   class Child extends Parent {
       method() {
           super.method();  // OK
           
           const fn = function() {
               super.method();  // SyntaxError: 'super' keyword is unexpected here
           };
           
           const arrow = () => {
               super.method();  // OK - arrows inherit super binding
           };
       }
   }
   ```

3. **Cannot extend non-constructible values**:
   ```javascript
   // ❌ Cannot extend null (but can use Object.create(null))
   class Foo extends null {
       constructor() {
           super();  // TypeError: Super constructor null of Foo is not a constructor
       }
   }
   
   // ❌ Cannot extend primitives
   class Foo extends 42 {}  // TypeError
   ```

4. **Extending built-ins has caveats**:
   ```javascript
   class MyArray extends Array {
       // Works in ES6+, but has quirks
   }
   
   const arr = new MyArray(1, 2, 3);
   arr.map(x => x * 2) instanceof MyArray;  // true (species pattern)
   
   // Date, Error, etc. work but may have limitations
   class MyDate extends Date {
       // Some internal slots may not be properly inherited
   }
   ```

5. **Static members are inherited via prototype chain**:
   ```javascript
   class Parent {
       static value = 10;
       static method() { return 'parent'; }
   }
   
   class Child extends Parent {}
   
   Child.value;   // 10
   Child.method();  // 'parent'
   
   // Child's [[Prototype]] is Parent (not Parent.prototype)
   Object.getPrototypeOf(Child) === Parent;  // true
   ```

6. **Method overriding completely replaces parent method**:
   ```javascript
   class Parent {
       greet() {
           return 'Hello from Parent';
       }
   }
   
   class Child extends Parent {
       greet() {
           return 'Hello from Child';  // Completely replaces
       }
       
       greetBoth() {
           return super.greet() + ' and Child';  // Can still call parent
       }
   }
   ```

---

## Private Methods and Accessors

### Professional Definition

Private methods and accessors (ES2022) use the `#` prefix and are only accessible within the class body. They provide true encapsulation, unlike the convention of using `_` prefix.

```javascript
class BankAccount {
    #balance = 0;
    
    // Private method
    #validateAmount(amount) {
        if (amount < 0) throw new Error('Negative amount');
        return true;
    }
    
    // Private getter
    get #internalBalance() {
        return this.#balance;
    }
    
    deposit(amount) {
        this.#validateAmount(amount);
        this.#balance += amount;
    }
    
    getBalance() {
        return this.#internalBalance;
    }
}
```

### Limitations & Caveats

1. **Cannot be accessed dynamically**:
   ```javascript
   class Foo {
       #method() {}
   }
   
   const foo = new Foo();
   const name = '#method';
   foo[name]();  // undefined is not a function
   
   // Private names are not properties - they're lexical bindings
   ```

2. **No private methods on prototype**:
   ```javascript
   // Private methods are per-instance (like class fields)
   // This may have memory implications for many instances
   ```

---

## Constructor Functions (Pre-ES6)

### Professional Definition

Before ES6, constructor functions were the standard pattern for creating objects with shared methods. A **constructor function** is a regular function called with `new` that initializes an object and typically has methods defined on its `prototype`.

```javascript
function Person(name, age) {
    // Instance properties
    this.name = name;
    this.age = age;
}

// Prototype methods (shared by all instances)
Person.prototype.greet = function() {
    return `Hello, I'm ${this.name}`;
};

// Static method
Person.create = function(name) {
    return new Person(name, 0);
};

const person = new Person('Andrei', 30);
```

### Limitations vs Classes

| Issue | Constructor Function | Class |
|-------|---------------------|-------|
| Forgetting `new` | Silently fails or pollutes global | Throws TypeError |
| Strict mode | Must opt-in | Always enabled |
| Method enumerable | Yes (for...in includes them) | No |
| Hoisting | Function hoisted | Not hoisted |
| `super` | Not available | Available |

---

## Factory Functions

### Professional Definition

A **factory function** is a function that returns an object without using `new`. Factory functions offer flexibility (no `new` required), true privacy via closures, and avoid `this` binding issues.

```javascript
function createUser(name, age) {
    // Private variable (closure)
    let _loginCount = 0;
    
    return {
        name,
        age,
        login() {
            _loginCount++;
            return `${name} logged in (${_loginCount} times)`;
        },
        getLoginCount() {
            return _loginCount;
        }
    };
}

const user = createUser('Andrei', 30);
user.login();  // "Andrei logged in (1 times)"
user._loginCount;  // undefined (truly private!)
```

### Factory vs Class Comparison

| Feature | Class | Factory |
|---------|-------|---------|
| `new` keyword | Required | Not needed |
| `instanceof` | Works | Returns false |
| `this` issues | Possible | None |
| True privacy | `#` syntax (ES2022) | Closures |
| Memory | Prototype shared | Each object has own methods |
| Inheritance | `extends` | Composition |

---

## Composition Over Inheritance

### Professional Definition

**Composition** is a design principle where objects are composed of smaller, reusable pieces rather than inheriting from a class hierarchy. It promotes flexibility and avoids the rigidity of deep inheritance chains.

```javascript
// Composable behaviors
const canWalk = (state) => ({
    walk: () => `${state.name} is walking`
});

const canSwim = (state) => ({
    swim: () => `${state.name} is swimming`
});

const canFly = (state) => ({
    fly: () => `${state.name} is flying`
});

// Compose different creatures
function createDuck(name) {
    const state = { name };
    return {
        name,
        ...canWalk(state),
        ...canSwim(state),
        ...canFly(state)
    };
}

function createPenguin(name) {
    const state = { name };
    return {
        name,
        ...canWalk(state),
        ...canSwim(state)
        // No fly!
    };
}

const duck = createDuck('Donald');
duck.fly();   // "Donald is flying"
duck.swim();  // "Donald is swimming"

const penguin = createPenguin('Pingu');
penguin.swim();  // "Pingu is swimming"
penguin.fly;     // undefined
```

### When to Use

| Use Inheritance | Use Composition |
|-----------------|-----------------|
| Clear "is-a" relationship | "Has-a" or "can-do" relationship |
| Shallow hierarchy (1-2 levels) | Complex or changing behaviors |
| Extending framework classes | Mixing capabilities from multiple sources |
| Need `instanceof` checks | Need flexibility |

---

## instanceof and typeof

### Technical Specifications

```javascript
class Animal {}
class Dog extends Animal {}

const dog = new Dog();

// instanceof checks prototype chain
dog instanceof Dog;     // true
dog instanceof Animal;  // true
dog instanceof Object;  // true

// typeof returns string type
typeof dog;            // "object"
typeof Dog;            // "function"
typeof Animal;         // "function"

// Checking actual constructor
dog.constructor === Dog;  // true
dog.constructor.name;     // "Dog"
```

### Limitations

1. **`instanceof` can be fooled**:
   ```javascript
   const dog = new Dog();
   Object.setPrototypeOf(dog, {});
   
   dog instanceof Dog;  // false now!
   ```

2. **Cross-realm issues**:
   ```javascript
   // Arrays from iframes have different Array constructor
   const arr = iframe.contentWindow.Array();
   arr instanceof Array;  // false!
   
   // Use Array.isArray instead
   Array.isArray(arr);  // true
   ```

---

## Key Takeaways

| Concept | Key Points |
|---------|------------|
| **Classes** | Syntactic sugar over prototypes, not hoisted, always strict |
| **Static members** | On class itself, not instances, inherited |
| **Private fields** | `#` prefix, truly private, must be declared |
| **Inheritance** | `extends`, must call `super()` before `this` |
| **Getters/Setters** | Computed properties, validation, on prototype |
| **Factory functions** | No `new`, true privacy via closure, no `instanceof` |
| **Composition** | Prefer over deep inheritance, mix behaviors |

### Best Practices

1. **Use classes** for clear OOP patterns and framework integration
2. **Prefer composition** over deep inheritance hierarchies
3. **Use private fields** (`#`) for encapsulation
4. **Use static methods** for utility functions related to the class
5. **Be aware** that class fields create per-instance values/functions
6. **Consider factory functions** when you need true privacy without ES2022

---

> 💡 **Professional Tip**: JavaScript's prototype system is more flexible than classical OOP. Don't force classical patterns where prototypal patterns work better. Use TypeScript for additional type safety and better IDE support with classes.
> 💡 **Andrei's Advice**: "Don't force OOP everywhere. JavaScript is multi-paradigm. Use classes when they make sense (components, services), but don't be afraid to use plain objects and functions when they're simpler."
> 💡 **Andrei's Advice**: "Don't force OOP everywhere. JavaScript is multi-paradigm. Use classes when they make sense (components, services), but don't be afraid to use plain objects and functions when they're simpler."