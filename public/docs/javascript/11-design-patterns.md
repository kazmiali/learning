# JavaScript Design Patterns

> "I learned very early the difference between knowing the name of something and knowing something." - Richard Feynman

Design patterns are reusable solutions to common programming problems. Understanding them helps you write more maintainable, scalable code and communicate effectively with other developers using shared vocabulary.

---

## What Are Design Patterns?

### Professional Definition

**Design patterns** are proven, reusable solutions to recurring software design problems. They are not code snippets but templates/blueprints that can be adapted to solve specific problems in different contexts. Patterns are categorized into three types: **Creational** (object creation), **Structural** (object composition), and **Behavioral** (object communication).

### Simple Explanation

Think of design patterns like recipes. A recipe for chocolate cake gives you a proven approach that works, but you can still customize ingredients. Similarly, design patterns give you proven approaches to coding problems that you can adapt to your specific needs.

---

## Creational Patterns

### Module Pattern

#### Professional Definition

The **Module Pattern** encapsulates private state and behavior, exposing only a public API. It leverages **closures** to create private scope, preventing pollution of the global namespace and providing data privacy. This was the primary encapsulation mechanism before ES6 modules.

#### Simple Explanation

It's like a vending machine - you can only interact with the buttons (public API), but you can't access the internal mechanisms (private state).

#### Implementation

```javascript
// Classic Module Pattern (IIFE)
const Calculator = (function() {
    // Private state
    let result = 0;
    
    // Private function
    function validate(n) {
        if (typeof n !== 'number') {
            throw new TypeError('Expected a number');
        }
    }
    
    // Public API (revealed)
    return {
        add(n) {
            validate(n);
            result += n;
            return this;
        },
        subtract(n) {
            validate(n);
            result -= n;
            return this;
        },
        multiply(n) {
            validate(n);
            result *= n;
            return this;
        },
        getResult() {
            return result;
        },
        reset() {
            result = 0;
            return this;
        }
    };
})();

Calculator.add(5).multiply(2).subtract(3).getResult();  // 7
Calculator.result;  // undefined (private!)
```

#### Revealing Module Pattern

```javascript
const UserService = (function() {
    // Private
    let users = [];
    
    function findById(id) {
        return users.find(u => u.id === id);
    }
    
    function findByEmail(email) {
        return users.find(u => u.email === email);
    }
    
    // Public functions defined privately
    function addUser(user) {
        if (findByEmail(user.email)) {
            throw new Error('Email already exists');
        }
        users.push({ ...user, id: Date.now() });
        return true;
    }
    
    function getUser(id) {
        return findById(id);
    }
    
    function getAllUsers() {
        return [...users];  // Return copy to prevent mutation
    }
    
    function removeUser(id) {
        const index = users.findIndex(u => u.id === id);
        if (index > -1) {
            users.splice(index, 1);
            return true;
        }
        return false;
    }
    
    // Reveal public API
    return {
        add: addUser,
        get: getUser,
        getAll: getAllUsers,
        remove: removeUser
    };
})();
```

#### Limitations & Caveats

1. **Cannot add private members later**:
   ```javascript
   const Module = (function() {
       let private = 1;
       return {
           getPrivate: () => private
       };
   })();
   
   // Cannot add new private members after creation
   Module.newPrivate = 2;  // This is public!
   ```

2. **Testing private functions is difficult**:
   ```javascript
   // Private functions cannot be tested directly
   // Options:
   // 1. Test through public API
   // 2. Expose private functions in test mode
   // 3. Use ES6 modules with separate test exports
   ```

3. **Changing visibility requires editing multiple places**:
   ```javascript
   // If you need to make a private function public,
   // you must add it to the return object
   ```

4. **Modern alternative - ES6 Modules**:
   ```javascript
   // userService.js
   let users = [];  // Module-scoped (private)
   
   function findById(id) {  // Not exported (private)
       return users.find(u => u.id === id);
   }
   
   export function addUser(user) {  // Public
       users.push(user);
   }
   
   export function getUser(id) {  // Public
       return findById(id);
   }
   ```

---

### Singleton Pattern

#### Professional Definition

The **Singleton Pattern** ensures a class has only one instance and provides a global point of access to it. It's useful for coordinating actions across a system, managing shared resources, or maintaining global state.

#### Simple Explanation

Like having only one president of a country at a time. No matter how many times you ask "who's the president?", you get the same person.

#### Implementation

```javascript
// Classic Singleton
const Database = (function() {
    let instance;
    
    function createInstance() {
        // Private state
        const connection = {
            host: 'localhost',
            port: 5432,
            connected: false
        };
        
        return {
            connect() {
                connection.connected = true;
                console.log('Database connected');
                return this;
            },
            disconnect() {
                connection.connected = false;
                console.log('Database disconnected');
                return this;
            },
            query(sql) {
                if (!connection.connected) {
                    throw new Error('Not connected');
                }
                console.log(`Executing: ${sql}`);
                return [];
            },
            isConnected() {
                return connection.connected;
            }
        };
    }
    
    return {
        getInstance() {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

// Usage
const db1 = Database.getInstance();
const db2 = Database.getInstance();

db1 === db2;  // true - same instance!

db1.connect();
db2.isConnected();  // true - shared state
```

#### ES6 Class Singleton

```javascript
class Logger {
    static #instance = null;
    #logs = [];
    
    constructor() {
        if (Logger.#instance) {
            return Logger.#instance;
        }
        Logger.#instance = this;
    }
    
    static getInstance() {
        if (!Logger.#instance) {
            Logger.#instance = new Logger();
        }
        return Logger.#instance;
    }
    
    log(message) {
        const entry = {
            timestamp: new Date().toISOString(),
            message
        };
        this.#logs.push(entry);
        console.log(`[${entry.timestamp}] ${message}`);
    }
    
    getLogs() {
        return [...this.#logs];
    }
    
    clear() {
        this.#logs = [];
    }
}

// Both approaches work
const logger1 = new Logger();
const logger2 = Logger.getInstance();
const logger3 = new Logger();

logger1 === logger2;  // true
logger2 === logger3;  // true
```

#### Module-based Singleton (Modern Approach)

```javascript
// logger.js
class Logger {
    #logs = [];
    
    log(message) {
        this.#logs.push({ timestamp: Date.now(), message });
        console.log(message);
    }
    
    getLogs() {
        return [...this.#logs];
    }
}

// Export single instance
export const logger = new Logger();

// Or export the class if needed
export { Logger };

// Usage in other files
import { logger } from './logger.js';
// Always the same instance due to ES module caching
```

#### Limitations & Caveats

1. **Global state is generally bad**:
   ```javascript
   // Singletons introduce global state which:
   // - Makes testing harder (shared state between tests)
   // - Creates hidden dependencies
   // - Makes code harder to reason about
   
   // ✅ Consider dependency injection instead
   class UserService {
       constructor(database) {  // Inject dependency
           this.db = database;
       }
   }
   ```

2. **Thread safety (in multi-threaded environments)**:
   ```javascript
   // JavaScript is single-threaded, but in Node.js with workers:
   // Each worker has its own singleton instance!
   ```

3. **Testing difficulties**:
   ```javascript
   // Reset singleton between tests
   beforeEach(() => {
       // Need to expose reset method or use dependency injection
       Logger.reset();  // If available
   });
   ```

4. **When to use Singleton**:
   ```javascript
   // ✅ Good use cases:
   // - Logger
   // - Configuration manager
   // - Connection pool
   // - Cache
   
   // ❌ Avoid for:
   // - Business logic
   // - Anything that needs to be tested in isolation
   ```

---

### Factory Pattern

#### Professional Definition

The **Factory Pattern** provides an interface for creating objects without specifying their exact classes. It encapsulates object creation logic, allowing the code to be more flexible and easier to maintain. Variations include **Simple Factory**, **Factory Method**, and **Abstract Factory**.

#### Simple Explanation

Like ordering a coffee at a café - you say "latte" and get a latte without knowing how the barista makes it. The café is the factory that creates your drink.

#### Implementation

```javascript
// Simple Factory
class User {
    constructor(name, role, permissions) {
        this.name = name;
        this.role = role;
        this.permissions = permissions;
    }
}

const UserFactory = {
    createAdmin(name) {
        return new User(name, 'admin', ['read', 'write', 'delete', 'manage']);
    },
    
    createEditor(name) {
        return new User(name, 'editor', ['read', 'write']);
    },
    
    createViewer(name) {
        return new User(name, 'viewer', ['read']);
    },
    
    // Dynamic creation based on type
    create(type, name) {
        switch (type) {
            case 'admin':
                return this.createAdmin(name);
            case 'editor':
                return this.createEditor(name);
            case 'viewer':
                return this.createViewer(name);
            default:
                throw new Error(`Unknown user type: ${type}`);
        }
    }
};

// Usage
const admin = UserFactory.createAdmin('Andrei');
const editor = UserFactory.create('editor', 'John');
```

#### Factory Method Pattern

```javascript
// Abstract creator
class DocumentCreator {
    // Factory method - subclasses override this
    createDocument() {
        throw new Error('Subclass must implement createDocument()');
    }
    
    // Common logic using the factory method
    generateReport() {
        const doc = this.createDocument();
        doc.addHeader('Report');
        doc.addContent('Generated on: ' + new Date().toISOString());
        return doc.render();
    }
}

// Concrete creators
class PDFCreator extends DocumentCreator {
    createDocument() {
        return new PDFDocument();
    }
}

class HTMLCreator extends DocumentCreator {
    createDocument() {
        return new HTMLDocument();
    }
}

// Product classes
class PDFDocument {
    constructor() {
        this.content = [];
    }
    
    addHeader(text) {
        this.content.push({ type: 'header', text, format: 'pdf' });
    }
    
    addContent(text) {
        this.content.push({ type: 'content', text, format: 'pdf' });
    }
    
    render() {
        return `PDF: ${JSON.stringify(this.content)}`;
    }
}

class HTMLDocument {
    constructor() {
        this.content = [];
    }
    
    addHeader(text) {
        this.content.push(`<h1>${text}</h1>`);
    }
    
    addContent(text) {
        this.content.push(`<p>${text}</p>`);
    }
    
    render() {
        return this.content.join('\n');
    }
}

// Usage
const pdfCreator = new PDFCreator();
const htmlCreator = new HTMLCreator();

pdfCreator.generateReport();   // PDF output
htmlCreator.generateReport();  // HTML output
```

#### Real-World Example: UI Component Factory

```javascript
const UIFactory = {
    components: new Map(),
    
    // Register component creators
    register(type, creator) {
        this.components.set(type, creator);
    },
    
    // Create component by type
    create(type, props = {}) {
        const creator = this.components.get(type);
        if (!creator) {
            throw new Error(`Unknown component type: ${type}`);
        }
        return creator(props);
    }
};

// Register different button types
UIFactory.register('primary-button', (props) => ({
    type: 'button',
    className: 'btn btn-primary',
    ...props
}));

UIFactory.register('danger-button', (props) => ({
    type: 'button',
    className: 'btn btn-danger',
    ...props
}));

UIFactory.register('icon-button', (props) => ({
    type: 'button',
    className: 'btn btn-icon',
    icon: props.icon || 'default',
    ...props
}));

// Usage
const submitBtn = UIFactory.create('primary-button', { text: 'Submit' });
const deleteBtn = UIFactory.create('danger-button', { text: 'Delete' });
const menuBtn = UIFactory.create('icon-button', { icon: 'menu' });
```

#### Limitations & Caveats

1. **Can become complex with many product types**:
   ```javascript
   // Consider using a registry pattern for many types
   const factory = {
       creators: {},
       register(type, creator) {
           this.creators[type] = creator;
       },
       create(type, ...args) {
           return this.creators[type]?.(...args);
       }
   };
   ```

2. **Type checking is lost**:
   ```javascript
   // Factory returns generic type
   const user = UserFactory.create('admin', 'Andrei');
   // TypeScript: user is User, not AdminUser
   
   // Solution: Use generics or type guards
   ```

---

## Structural Patterns

### Observer Pattern (Pub/Sub)

#### Professional Definition

The **Observer Pattern** defines a one-to-many dependency between objects. When one object (the **subject/publisher**) changes state, all its dependents (**observers/subscribers**) are notified and updated automatically. The **Pub/Sub** variation adds a message broker between publishers and subscribers for looser coupling.

#### Simple Explanation

Like subscribing to a YouTube channel. When the creator uploads a video (publishes), all subscribers get notified. You don't need to keep checking - you're automatically informed.

#### Implementation

```javascript
// Basic Observer Pattern
class EventEmitter {
    #events = new Map();
    
    on(event, callback) {
        if (!this.#events.has(event)) {
            this.#events.set(event, []);
        }
        this.#events.get(event).push(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (!this.#events.has(event)) return;
        
        const callbacks = this.#events.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    emit(event, ...args) {
        if (!this.#events.has(event)) return;
        
        this.#events.get(event).forEach(callback => {
            callback(...args);
        });
    }
    
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
}

// Usage
const emitter = new EventEmitter();

// Subscribe
const unsubscribe = emitter.on('userLoggedIn', (user) => {
    console.log(`Welcome, ${user.name}!`);
});

emitter.on('userLoggedIn', (user) => {
    console.log(`Logging activity for ${user.name}`);
});

// Publish
emitter.emit('userLoggedIn', { name: 'Andrei' });
// Output:
// Welcome, Andrei!
// Logging activity for Andrei

// Unsubscribe
unsubscribe();
```

#### Advanced Pub/Sub with Namespaces

```javascript
class PubSub {
    #subscribers = new Map();
    
    subscribe(topic, callback) {
        if (!this.#subscribers.has(topic)) {
            this.#subscribers.set(topic, new Set());
        }
        this.#subscribers.get(topic).add(callback);
        
        return {
            unsubscribe: () => {
                this.#subscribers.get(topic)?.delete(callback);
            }
        };
    }
    
    publish(topic, data) {
        if (!this.#subscribers.has(topic)) return;
        
        this.#subscribers.get(topic).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in subscriber for ${topic}:`, error);
            }
        });
    }
    
    // Wildcard subscription
    subscribeAll(callback) {
        return this.subscribe('*', callback);
    }
    
    publishWithWildcard(topic, data) {
        this.publish(topic, data);
        this.publish('*', { topic, data });
    }
    
    // Clear all subscribers for a topic
    clear(topic) {
        this.#subscribers.delete(topic);
    }
    
    // Clear all subscribers
    clearAll() {
        this.#subscribers.clear();
    }
}

// Usage with namespaced events
const pubsub = new PubSub();

pubsub.subscribe('user:created', (user) => {
    console.log('New user:', user.name);
});

pubsub.subscribe('user:updated', (user) => {
    console.log('User updated:', user.name);
});

pubsub.subscribe('user:*', (data) => {
    console.log('Any user event:', data);
});

pubsub.publish('user:created', { name: 'Andrei' });
```

#### Real-World: State Management

```javascript
class Store {
    #state;
    #listeners = new Set();
    #reducers = new Map();
    
    constructor(initialState = {}) {
        this.#state = initialState;
    }
    
    getState() {
        return { ...this.#state };
    }
    
    subscribe(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }
    
    dispatch(action) {
        const reducer = this.#reducers.get(action.type);
        if (reducer) {
            this.#state = reducer(this.#state, action);
            this.#notify();
        }
    }
    
    registerReducer(actionType, reducer) {
        this.#reducers.set(actionType, reducer);
    }
    
    #notify() {
        this.#listeners.forEach(listener => listener(this.#state));
    }
}

// Usage
const store = new Store({ count: 0, user: null });

store.registerReducer('INCREMENT', (state, action) => ({
    ...state,
    count: state.count + (action.payload || 1)
}));

store.registerReducer('SET_USER', (state, action) => ({
    ...state,
    user: action.payload
}));

// Subscribe to changes
store.subscribe((state) => {
    console.log('State changed:', state);
});

store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT', payload: 5 });
store.dispatch({ type: 'SET_USER', payload: { name: 'Andrei' } });
```

#### Limitations & Caveats

1. **Memory leaks from forgotten subscriptions**:
   ```javascript
   // ❌ Subscription never cleaned up
   class Component {
       constructor() {
           emitter.on('event', this.handleEvent);
       }
       // No cleanup!
   }
   
   // ✅ Always unsubscribe on cleanup
   class Component {
       constructor() {
           this.unsubscribe = emitter.on('event', this.handleEvent);
       }
       
       destroy() {
           this.unsubscribe();
       }
   }
   ```

2. **Order of notification is not guaranteed**:
   ```javascript
   // Subscribers are called in order of subscription,
   // but don't rely on this for critical logic
   ```

3. **Debugging can be difficult**:
   ```javascript
   // Hard to trace what triggered an event
   // Solution: Add logging/debugging mode
   emit(event, ...args) {
       if (this.debug) {
           console.log(`Event: ${event}`, args);
       }
       // ...
   }
   ```

4. **Can lead to cascading updates**:
   ```javascript
   // Event A triggers handler that emits Event B
   // Event B triggers handler that emits Event A
   // Infinite loop!
   
   // Solution: Track emission depth or use async emission
   ```

---

### Decorator Pattern

#### Professional Definition

The **Decorator Pattern** attaches additional responsibilities to an object dynamically. It provides a flexible alternative to subclassing for extending functionality. Decorators wrap objects to add behavior without modifying the original class.

#### Simple Explanation

Like adding toppings to ice cream. You start with vanilla (base object) and can add chocolate sauce, sprinkles, whipped cream (decorators). Each topping adds something without changing the ice cream itself.

#### Implementation

```javascript
// Function Decorators
function withLogging(fn) {
    return function(...args) {
        console.log(`Calling ${fn.name} with:`, args);
        const result = fn.apply(this, args);
        console.log(`${fn.name} returned:`, result);
        return result;
    };
}

function withTiming(fn) {
    return function(...args) {
        const start = performance.now();
        const result = fn.apply(this, args);
        const duration = performance.now() - start;
        console.log(`${fn.name} took ${duration.toFixed(2)}ms`);
        return result;
    };
}

function withMemoization(fn) {
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

// Usage
function calculateSum(a, b) {
    return a + b;
}

const enhancedSum = withLogging(withTiming(calculateSum));
enhancedSum(5, 3);
// Output:
// Calling calculateSum with: [5, 3]
// calculateSum took 0.01ms
// calculateSum returned: 8
```

#### Class Method Decorators (ES Decorators Proposal)

```javascript
// Note: This is Stage 3 proposal syntax
// May require transpilation

function log(target, name, descriptor) {
    const original = descriptor.value;
    
    descriptor.value = function(...args) {
        console.log(`Calling ${name} with:`, args);
        return original.apply(this, args);
    };
    
    return descriptor;
}

function readonly(target, name, descriptor) {
    descriptor.writable = false;
    return descriptor;
}

function debounce(delay) {
    return function(target, name, descriptor) {
        const original = descriptor.value;
        let timeout;
        
        descriptor.value = function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                original.apply(this, args);
            }, delay);
        };
        
        return descriptor;
    };
}

// Usage (with decorator support)
class SearchComponent {
    @log
    search(query) {
        return `Searching for: ${query}`;
    }
    
    @debounce(300)
    handleInput(value) {
        this.search(value);
    }
    
    @readonly
    version = '1.0.0';
}
```

#### Object Decorators

```javascript
// Decorator that adds functionality to objects
class Coffee {
    constructor() {
        this.description = 'Basic Coffee';
        this.cost = 2.00;
    }
    
    getDescription() {
        return this.description;
    }
    
    getCost() {
        return this.cost;
    }
}

// Decorator base
class CoffeeDecorator {
    constructor(coffee) {
        this.coffee = coffee;
    }
    
    getDescription() {
        return this.coffee.getDescription();
    }
    
    getCost() {
        return this.coffee.getCost();
    }
}

// Concrete decorators
class MilkDecorator extends CoffeeDecorator {
    getDescription() {
        return `${super.getDescription()}, Milk`;
    }
    
    getCost() {
        return super.getCost() + 0.50;
    }
}

class SugarDecorator extends CoffeeDecorator {
    getDescription() {
        return `${super.getDescription()}, Sugar`;
    }
    
    getCost() {
        return super.getCost() + 0.25;
    }
}

class WhippedCreamDecorator extends CoffeeDecorator {
    getDescription() {
        return `${super.getDescription()}, Whipped Cream`;
    }
    
    getCost() {
        return super.getCost() + 0.75;
    }
}

// Usage - compose decorators
let myCoffee = new Coffee();
myCoffee = new MilkDecorator(myCoffee);
myCoffee = new SugarDecorator(myCoffee);
myCoffee = new WhippedCreamDecorator(myCoffee);

console.log(myCoffee.getDescription());  // "Basic Coffee, Milk, Sugar, Whipped Cream"
console.log(myCoffee.getCost());         // 3.50
```

#### Higher-Order Component Pattern (React-like)

```javascript
// HOC pattern - decorating components
function withAuth(Component) {
    return function AuthenticatedComponent(props) {
        if (!props.user) {
            return { type: 'redirect', to: '/login' };
        }
        return Component(props);
    };
}

function withLoading(Component) {
    return function LoadingComponent(props) {
        if (props.isLoading) {
            return { type: 'loading', message: 'Loading...' };
        }
        return Component(props);
    };
}

function withErrorBoundary(Component) {
    return function ErrorBoundaryComponent(props) {
        try {
            return Component(props);
        } catch (error) {
            return { type: 'error', message: error.message };
        }
    };
}

// Compose decorators
const Dashboard = (props) => ({
    type: 'dashboard',
    user: props.user.name
});

const EnhancedDashboard = withErrorBoundary(
    withLoading(
        withAuth(Dashboard)
    )
);
```

#### Limitations & Caveats

1. **Order of decorators matters**:
   ```javascript
   // Different order = different behavior
   withA(withB(fn))  // B runs first, then A
   withB(withA(fn))  // A runs first, then B
   ```

2. **Can obscure the original interface**:
   ```javascript
   // After decoration, it's hard to know what the original function does
   // Solution: Good naming and documentation
   ```

3. **Debugging decorated functions**:
   ```javascript
   // Stack traces show decorator wrappers
   // Solution: Preserve function name
   function withLogging(fn) {
       const wrapper = function(...args) { /* ... */ };
       Object.defineProperty(wrapper, 'name', { value: fn.name });
       return wrapper;
   }
   ```

---

### Proxy Pattern

#### Professional Definition

The **Proxy Pattern** provides a surrogate or placeholder for another object to control access to it. In JavaScript, the built-in `Proxy` object enables creating a proxy for another object, intercepting and redefining fundamental operations like property lookup, assignment, enumeration, and function invocation.

#### Simple Explanation

Like a security guard at a building entrance. They control who can enter, check credentials, and log visitors - all without changing how the building itself works.

#### Implementation with ES6 Proxy

```javascript
// Basic Proxy - Validation
const userValidator = {
    set(target, property, value) {
        if (property === 'age') {
            if (!Number.isInteger(value)) {
                throw new TypeError('Age must be an integer');
            }
            if (value < 0 || value > 150) {
                throw new RangeError('Age must be between 0 and 150');
            }
        }
        if (property === 'email') {
            if (!value.includes('@')) {
                throw new Error('Invalid email format');
            }
        }
        target[property] = value;
        return true;
    }
};

const user = new Proxy({}, userValidator);

user.name = 'Andrei';  // OK
user.age = 30;         // OK
user.age = -5;         // RangeError: Age must be between 0 and 150
user.email = 'invalid'; // Error: Invalid email format
```

#### Proxy for Logging/Debugging

```javascript
function createLoggingProxy(target, name = 'Object') {
    return new Proxy(target, {
        get(target, property, receiver) {
            console.log(`GET ${name}.${String(property)}`);
            const value = Reflect.get(target, property, receiver);
            
            // Recursively proxy nested objects
            if (typeof value === 'object' && value !== null) {
                return createLoggingProxy(value, `${name}.${String(property)}`);
            }
            return value;
        },
        
        set(target, property, value, receiver) {
            console.log(`SET ${name}.${String(property)} = ${JSON.stringify(value)}`);
            return Reflect.set(target, property, value, receiver);
        },
        
        deleteProperty(target, property) {
            console.log(`DELETE ${name}.${String(property)}`);
            return Reflect.deleteProperty(target, property);
        },
        
        apply(target, thisArg, args) {
            console.log(`CALL ${name}(${args.map(a => JSON.stringify(a)).join(', ')})`);
            return Reflect.apply(target, thisArg, args);
        }
    });
}

// Usage
const data = createLoggingProxy({ user: { name: 'Andrei' } }, 'data');
data.user.name;           // GET data.user, GET data.user.name
data.user.age = 30;       // SET data.user.age = 30
```

#### Proxy for Lazy Loading

```javascript
function createLazyProxy(loader) {
    let instance = null;
    let loaded = false;
    
    return new Proxy({}, {
        get(target, property) {
            if (!loaded) {
                instance = loader();
                loaded = true;
            }
            return instance[property];
        },
        
        set(target, property, value) {
            if (!loaded) {
                instance = loader();
                loaded = true;
            }
            instance[property] = value;
            return true;
        }
    });
}

// Heavy object only loaded when first accessed
const heavyObject = createLazyProxy(() => {
    console.log('Loading heavy object...');
    return {
        data: new Array(1000000).fill('data'),
        process() {
            return this.data.length;
        }
    };
});

console.log('Proxy created');  // No loading yet
heavyObject.process();         // "Loading heavy object..." then processes
```

#### Proxy for Reactive Data (Vue.js-like)

```javascript
function reactive(obj, onChange) {
    return new Proxy(obj, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            
            // Make nested objects reactive too
            if (typeof value === 'object' && value !== null) {
                return reactive(value, onChange);
            }
            return value;
        },
        
        set(target, property, value, receiver) {
            const oldValue = target[property];
            const result = Reflect.set(target, property, value, receiver);
            
            if (oldValue !== value) {
                onChange(property, value, oldValue);
            }
            return result;
        },
        
        deleteProperty(target, property) {
            const oldValue = target[property];
            const result = Reflect.deleteProperty(target, property);
            
            if (result) {
                onChange(property, undefined, oldValue);
            }
            return result;
        }
    });
}

// Usage
const state = reactive({ count: 0, user: { name: 'Andrei' } }, (prop, newVal, oldVal) => {
    console.log(`${prop} changed from ${oldVal} to ${newVal}`);
    // Trigger re-render, update DOM, etc.
});

state.count++;              // "count changed from 0 to 1"
state.user.name = 'John';   // "name changed from Andrei to John"
```

#### Proxy Traps Reference

| Trap | Intercepts |
|------|------------|
| `get` | Property read |
| `set` | Property write |
| `has` | `in` operator |
| `deleteProperty` | `delete` operator |
| `apply` | Function call |
| `construct` | `new` operator |
| `getPrototypeOf` | `Object.getPrototypeOf` |
| `setPrototypeOf` | `Object.setPrototypeOf` |
| `isExtensible` | `Object.isExtensible` |
| `preventExtensions` | `Object.preventExtensions` |
| `getOwnPropertyDescriptor` | `Object.getOwnPropertyDescriptor` |
| `defineProperty` | `Object.defineProperty` |
| `ownKeys` | `Object.keys`, `for...in` |

#### Limitations & Caveats

1. **Performance overhead**:
   ```javascript
   // Proxies add overhead to every operation
   // Don't use for hot paths unless necessary
   
   // Benchmark before using in performance-critical code
   ```

2. **Identity issues**:
   ```javascript
   const target = {};
   const proxy = new Proxy(target, {});
   
   proxy === target;  // false
   
   // WeakMap/WeakSet may not work as expected
   const map = new WeakMap();
   map.set(target, 'value');
   map.get(proxy);  // undefined!
   ```

3. **Some operations cannot be intercepted**:
   ```javascript
   // === comparison
   // typeof
   // instanceof (without Symbol.hasInstance)
   ```

4. **Private fields don't work through proxy**:
   ```javascript
   class Secret {
       #private = 'secret';
       getPrivate() { return this.#private; }
   }
   
   const secret = new Secret();
   const proxy = new Proxy(secret, {});
   
   proxy.getPrivate();  // TypeError: Cannot read private member
   // Private fields are tied to the target, not the proxy
   ```

---

## Behavioral Patterns

### Strategy Pattern

#### Professional Definition

The **Strategy Pattern** defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from clients that use it. This pattern is useful when you have multiple ways to perform an operation and want to switch between them at runtime.

#### Simple Explanation

Like choosing a route on Google Maps - you can select driving, walking, or public transit (different strategies) for the same destination. The app uses whichever strategy you choose.

#### Implementation

```javascript
// Payment strategies
const paymentStrategies = {
    creditCard: {
        validate(details) {
            return details.cardNumber && details.cvv && details.expiry;
        },
        pay(amount, details) {
            console.log(`Paying $${amount} with credit card ending in ${details.cardNumber.slice(-4)}`);
            return { success: true, transactionId: `CC-${Date.now()}` };
        }
    },
    
    paypal: {
        validate(details) {
            return details.email && details.password;
        },
        pay(amount, details) {
            console.log(`Paying $${amount} via PayPal account ${details.email}`);
            return { success: true, transactionId: `PP-${Date.now()}` };
        }
    },
    
    crypto: {
        validate(details) {
            return details.walletAddress && details.currency;
        },
        pay(amount, details) {
            console.log(`Paying $${amount} in ${details.currency} to ${details.walletAddress}`);
            return { success: true, transactionId: `CRYPTO-${Date.now()}` };
        }
    }
};

// Context that uses strategies
class PaymentProcessor {
    constructor() {
        this.strategy = null;
    }
    
    setStrategy(strategyName) {
        this.strategy = paymentStrategies[strategyName];
        if (!this.strategy) {
            throw new Error(`Unknown payment strategy: ${strategyName}`);
        }
    }
    
    processPayment(amount, details) {
        if (!this.strategy) {
            throw new Error('No payment strategy set');
        }
        
        if (!this.strategy.validate(details)) {
            throw new Error('Invalid payment details');
        }
        
        return this.strategy.pay(amount, details);
    }
}

// Usage
const processor = new PaymentProcessor();

processor.setStrategy('creditCard');
processor.processPayment(100, {
    cardNumber: '4111111111111111',
    cvv: '123',
    expiry: '12/25'
});

processor.setStrategy('paypal');
processor.processPayment(50, {
    email: 'user@example.com',
    password: 'secret'
});
```

#### Sorting Strategies

```javascript
const sortStrategies = {
    byName: (a, b) => a.name.localeCompare(b.name),
    byNameDesc: (a, b) => b.name.localeCompare(a.name),
    byPrice: (a, b) => a.price - b.price,
    byPriceDesc: (a, b) => b.price - a.price,
    byDate: (a, b) => new Date(a.date) - new Date(b.date),
    byDateDesc: (a, b) => new Date(b.date) - new Date(a.date),
    byPopularity: (a, b) => b.views - a.views
};

class ProductList {
    constructor(products) {
        this.products = products;
        this.sortStrategy = sortStrategies.byName;  // Default
    }
    
    setSortStrategy(strategyName) {
        if (!sortStrategies[strategyName]) {
            throw new Error(`Unknown sort strategy: ${strategyName}`);
        }
        this.sortStrategy = sortStrategies[strategyName];
    }
    
    getSorted() {
        return [...this.products].sort(this.sortStrategy);
    }
}

// Usage
const products = [
    { name: 'Laptop', price: 999, date: '2024-01-15', views: 1500 },
    { name: 'Phone', price: 699, date: '2024-02-20', views: 3000 },
    { name: 'Tablet', price: 449, date: '2024-01-10', views: 800 }
];

const list = new ProductList(products);

list.setSortStrategy('byPrice');
console.log(list.getSorted());  // Sorted by price ascending

list.setSortStrategy('byPopularity');
console.log(list.getSorted());  // Sorted by views descending
```

#### Validation Strategies

```javascript
const validators = {
    required: (value) => ({
        valid: value !== null && value !== undefined && value !== '',
        message: 'This field is required'
    }),
    
    email: (value) => ({
        valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Invalid email format'
    }),
    
    minLength: (min) => (value) => ({
        valid: value.length >= min,
        message: `Must be at least ${min} characters`
    }),
    
    maxLength: (max) => (value) => ({
        valid: value.length <= max,
        message: `Must be at most ${max} characters`
    }),
    
    pattern: (regex, message) => (value) => ({
        valid: regex.test(value),
        message
    }),
    
    range: (min, max) => (value) => ({
        valid: value >= min && value <= max,
        message: `Must be between ${min} and ${max}`
    })
};

class FormValidator {
    constructor() {
        this.fields = new Map();
    }
    
    addField(name, ...strategies) {
        this.fields.set(name, strategies);
    }
    
    validate(data) {
        const errors = {};
        let isValid = true;
        
        for (const [field, strategies] of this.fields) {
            const value = data[field];
            
            for (const strategy of strategies) {
                const result = strategy(value);
                if (!result.valid) {
                    errors[field] = result.message;
                    isValid = false;
                    break;
                }
            }
        }
        
        return { isValid, errors };
    }
}

// Usage
const validator = new FormValidator();
validator.addField('email', validators.required, validators.email);
validator.addField('password', validators.required, validators.minLength(8));
validator.addField('age', validators.required, validators.range(18, 100));

const result = validator.validate({
    email: 'test@example.com',
    password: '12345',  // Too short
    age: 25
});

console.log(result);
// { isValid: false, errors: { password: 'Must be at least 8 characters' } }
```

---

### Command Pattern

#### Professional Definition

The **Command Pattern** encapsulates a request as an object, allowing you to parameterize clients with different requests, queue or log requests, and support undoable operations. It decouples the object that invokes the operation from the one that knows how to perform it.

#### Simple Explanation

Like a restaurant order slip. The waiter writes down your order (command), gives it to the kitchen (receiver), and can even cancel it if needed. The slip contains all the information needed to execute the request.

#### Implementation

```javascript
// Command interface
class Command {
    execute() {
        throw new Error('execute() must be implemented');
    }
    
    undo() {
        throw new Error('undo() must be implemented');
    }
}

// Receiver
class TextEditor {
    constructor() {
        this.content = '';
        this.clipboard = '';
    }
    
    insertText(text, position) {
        this.content = 
            this.content.slice(0, position) + 
            text + 
            this.content.slice(position);
    }
    
    deleteText(position, length) {
        const deleted = this.content.slice(position, position + length);
        this.content = 
            this.content.slice(0, position) + 
            this.content.slice(position + length);
        return deleted;
    }
    
    getContent() {
        return this.content;
    }
}

// Concrete Commands
class InsertCommand extends Command {
    constructor(editor, text, position) {
        super();
        this.editor = editor;
        this.text = text;
        this.position = position;
    }
    
    execute() {
        this.editor.insertText(this.text, this.position);
    }
    
    undo() {
        this.editor.deleteText(this.position, this.text.length);
    }
}

class DeleteCommand extends Command {
    constructor(editor, position, length) {
        super();
        this.editor = editor;
        this.position = position;
        this.length = length;
        this.deletedText = '';
    }
    
    execute() {
        this.deletedText = this.editor.deleteText(this.position, this.length);
    }
    
    undo() {
        this.editor.insertText(this.deletedText, this.position);
    }
}

// Invoker with undo/redo support
class CommandManager {
    constructor() {
        this.history = [];
        this.redoStack = [];
    }
    
    execute(command) {
        command.execute();
        this.history.push(command);
        this.redoStack = [];  // Clear redo stack on new command
    }
    
    undo() {
        const command = this.history.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }
    }
    
    redo() {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.history.push(command);
        }
    }
    
    canUndo() {
        return this.history.length > 0;
    }
    
    canRedo() {
        return this.redoStack.length > 0;
    }
}

// Usage
const editor = new TextEditor();
const manager = new CommandManager();

manager.execute(new InsertCommand(editor, 'Hello', 0));
console.log(editor.getContent());  // "Hello"

manager.execute(new InsertCommand(editor, ' World', 5));
console.log(editor.getContent());  // "Hello World"

manager.undo();
console.log(editor.getContent());  // "Hello"

manager.redo();
console.log(editor.getContent());  // "Hello World"

manager.execute(new DeleteCommand(editor, 5, 6));
console.log(editor.getContent());  // "Hello"
```

#### Macro Commands (Composite)

```javascript
class MacroCommand extends Command {
    constructor() {
        super();
        this.commands = [];
    }
    
    add(command) {
        this.commands.push(command);
        return this;
    }
    
    execute() {
        this.commands.forEach(cmd => cmd.execute());
    }
    
    undo() {
        // Undo in reverse order
        [...this.commands].reverse().forEach(cmd => cmd.undo());
    }
}

// Usage - batch operations
const formatMacro = new MacroCommand()
    .add(new InsertCommand(editor, '**', 0))
    .add(new InsertCommand(editor, '**', editor.content.length + 2));

manager.execute(formatMacro);  // Wraps content in **
manager.undo();                 // Removes both **
```

---

### Iterator Pattern

#### Professional Definition

The **Iterator Pattern** provides a way to access elements of a collection sequentially without exposing its underlying representation. JavaScript has built-in iterator support through the **Iterable Protocol** (`Symbol.iterator`) and **Iterator Protocol** (`next()` method).

#### Simple Explanation

Like a TV remote's channel buttons. You can go to the next channel without knowing how channels are stored internally. You just press "next" and get the next item.

#### Implementation

```javascript
// Custom Iterator
class Range {
    constructor(start, end, step = 1) {
        this.start = start;
        this.end = end;
        this.step = step;
    }
    
    // Make it iterable
    [Symbol.iterator]() {
        let current = this.start;
        const end = this.end;
        const step = this.step;
        
        return {
            next() {
                if (current <= end) {
                    const value = current;
                    current += step;
                    return { value, done: false };
                }
                return { done: true };
            }
        };
    }
}

// Usage
const range = new Range(1, 5);
for (const num of range) {
    console.log(num);  // 1, 2, 3, 4, 5
}

console.log([...range]);  // [1, 2, 3, 4, 5]

const range2 = new Range(0, 10, 2);
console.log([...range2]);  // [0, 2, 4, 6, 8, 10]
```

#### Generator-based Iterator

```javascript
class Tree {
    constructor(value, children = []) {
        this.value = value;
        this.children = children;
    }
    
    // Depth-first iteration using generator
    *[Symbol.iterator]() {
        yield this.value;
        for (const child of this.children) {
            yield* child;  // Delegate to child iterator
        }
    }
    
    // Breadth-first iteration
    *breadthFirst() {
        const queue = [this];
        while (queue.length > 0) {
            const node = queue.shift();
            yield node.value;
            queue.push(...node.children);
        }
    }
}

// Build tree
const tree = new Tree('root', [
    new Tree('a', [
        new Tree('a1'),
        new Tree('a2')
    ]),
    new Tree('b', [
        new Tree('b1')
    ])
]);

console.log([...tree]);  // ['root', 'a', 'a1', 'a2', 'b', 'b1'] (depth-first)
console.log([...tree.breadthFirst()]);  // ['root', 'a', 'b', 'a1', 'a2', 'b1']
```

#### Infinite Iterator

```javascript
function* fibonacci() {
    let [prev, curr] = [0, 1];
    while (true) {
        yield curr;
        [prev, curr] = [curr, prev + curr];
    }
}

// Take first n items from infinite iterator
function take(iterator, n) {
    const result = [];
    for (let i = 0; i < n; i++) {
        const { value, done } = iterator.next();
        if (done) break;
        result.push(value);
    }
    return result;
}

console.log(take(fibonacci(), 10));  // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```

---

## Key Takeaways

| Pattern | Use When | Avoid When |
|---------|----------|------------|
| **Module** | Need encapsulation, private state | Using ES6 modules |
| **Singleton** | Need single shared instance | Testing is important |
| **Factory** | Object creation is complex | Simple object creation |
| **Observer** | Objects need to react to changes | Simple direct communication |
| **Decorator** | Add behavior without modifying class | Simpler inheritance works |
| **Proxy** | Need to control object access | Performance is critical |
| **Strategy** | Multiple algorithms for same task | Only one algorithm |
| **Command** | Need undo/redo, queuing | Simple direct method calls |
| **Iterator** | Need custom traversal | Built-in iteration works |

### Best Practices

1. **Don't over-engineer** - Use patterns when they solve real problems
2. **Combine patterns** - Many real solutions use multiple patterns together
3. **Prefer composition** - Over complex inheritance hierarchies
4. **Consider testability** - Patterns should make testing easier, not harder
5. **Document intent** - Make it clear why a pattern was chosen

---

> 💡 **Professional Tip**: Design patterns are tools, not rules. The goal is readable, maintainable code - not using patterns for their own sake. If a simple function solves the problem, don't force a pattern onto it. Learn patterns so you recognize when they're genuinely useful.

