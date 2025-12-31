# JavaScript Module Systems

> "What I cannot create, I do not understand." - Richard Feynman

Understanding JavaScript's module systems is crucial for organizing code, managing dependencies, and building scalable applications. This guide covers the evolution from no modules to modern ES Modules, including bundling concepts.

---

## Why Modules?

### Professional Definition

**Modules** are self-contained units of code that encapsulate functionality, expose a public API, and can be imported/exported between files. They solve problems of **namespace pollution**, **dependency management**, **code organization**, and **reusability**.

### Simple Explanation

Think of modules like LEGO bricks. Each brick (module) has a specific shape and purpose. You can combine different bricks to build complex structures, and you can reuse the same brick in different projects.

### Problems Modules Solve

| Problem | Without Modules | With Modules |
|---------|-----------------|--------------|
| Global namespace pollution | All variables are global | Each module has its own scope |
| Dependency management | Manual `<script>` ordering | Explicit imports |
| Code organization | Everything in one file | Logical separation |
| Reusability | Copy-paste code | Import/export |
| Encapsulation | Everything exposed | Private by default |

---

## The Evolution of JavaScript Modules

```
1995-2009: No Module System
    ↓
2009: CommonJS (Node.js)
    ↓
2011: AMD (RequireJS)
    ↓
2011: UMD (Universal)
    ↓
2015: ES Modules (ES6)
    ↓
Today: ES Modules dominant, CommonJS in legacy Node.js
```

---

## CommonJS (CJS)

### Professional Definition

**CommonJS** is a module system designed for server-side JavaScript (Node.js). It uses synchronous `require()` for imports and `module.exports` or `exports` for exports. Each file is a module with its own scope.

### Simple Explanation

Like ordering from a catalog - you `require` what you need, and it's delivered synchronously. You can also `export` your own products for others to order.

### Syntax

```javascript
// math.js - Exporting
// Method 1: module.exports object
module.exports = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b
};

// Method 2: Individual exports
exports.add = (a, b) => a + b;
exports.subtract = (a, b) => a - b;

// Method 3: Single export
module.exports = function add(a, b) {
    return a + b;
};

// Method 4: Class export
module.exports = class Calculator {
    add(a, b) { return a + b; }
};
```

```javascript
// app.js - Importing
// Import entire module
const math = require('./math');
math.add(1, 2);  // 3

// Destructuring import
const { add, subtract } = require('./math');
add(1, 2);  // 3

// Import with alias
const { add: sum } = require('./math');
sum(1, 2);  // 3

// Import JSON
const config = require('./config.json');

// Import from node_modules
const lodash = require('lodash');
const express = require('express');
```

### Technical Specifications

| Feature | CommonJS |
|---------|----------|
| Loading | Synchronous |
| Evaluation | Runtime |
| Exports | `module.exports`, `exports` |
| Imports | `require()` |
| File extension | `.js`, `.cjs` |
| Top-level `this` | `module.exports` |
| Circular deps | Partial exports available |

### How require() Works Internally

```javascript
// Simplified require implementation
function require(modulePath) {
    // 1. Resolve the absolute path
    const absolutePath = resolve(modulePath);
    
    // 2. Check cache
    if (cache[absolutePath]) {
        return cache[absolutePath].exports;
    }
    
    // 3. Create module object
    const module = {
        exports: {},
        loaded: false,
        id: absolutePath
    };
    
    // 4. Cache it (before execution for circular deps)
    cache[absolutePath] = module;
    
    // 5. Load and execute the module
    const code = fs.readFileSync(absolutePath, 'utf8');
    
    // 6. Wrap in function to create module scope
    const wrapper = `(function(exports, require, module, __filename, __dirname) {
        ${code}
    })`;
    
    // 7. Execute
    const fn = eval(wrapper);
    fn(module.exports, require, module, absolutePath, dirname(absolutePath));
    
    // 8. Mark as loaded
    module.loaded = true;
    
    // 9. Return exports
    return module.exports;
}
```

### Limitations & Caveats

1. **`exports` vs `module.exports` confusion**:
   ```javascript
   // exports is a shorthand reference to module.exports
   console.log(exports === module.exports);  // true (initially)
   
   // ❌ This doesn't work - reassigning exports breaks the reference
   exports = { add: () => {} };
   
   // ✅ This works - adding to exports
   exports.add = () => {};
   
   // ✅ This works - reassigning module.exports
   module.exports = { add: () => {} };
   
   // ❌ Mixed usage - module.exports wins
   module.exports = { a: 1 };
   exports.b = 2;  // Ignored! exports no longer points to module.exports
   ```

2. **Synchronous loading blocks execution**:
   ```javascript
   // ❌ In browser, this would block rendering
   const heavyModule = require('./heavy-module');  // Blocks until loaded
   
   // CommonJS is designed for server-side where file I/O is fast
   ```

3. **Dynamic imports are runtime evaluated**:
   ```javascript
   // This works in CommonJS
   if (condition) {
       const moduleA = require('./moduleA');
   } else {
       const moduleB = require('./moduleB');
   }
   
   // But prevents static analysis and tree shaking
   ```

4. **Circular dependencies can cause issues**:
   ```javascript
   // a.js
   const b = require('./b');
   console.log('a: b.value =', b.value);  // undefined at first!
   exports.value = 'A';
   
   // b.js
   const a = require('./a');  // a.value is undefined here
   console.log('b: a.value =', a.value);
   exports.value = 'B';
   
   // When you require('./a'):
   // 1. a.js starts executing
   // 2. a.js requires b.js
   // 3. b.js requires a.js - gets partial exports (value not set yet)
   // 4. b.js finishes
   // 5. a.js finishes
   ```

5. **Cannot be statically analyzed**:
   ```javascript
   // Bundlers can't know what's imported without running the code
   const moduleName = getModuleName();
   const module = require(moduleName);  // Dynamic, unknown at build time
   ```

---

## ES Modules (ESM)

### Professional Definition

**ES Modules** (ECMAScript Modules) are the official JavaScript module system standardized in ES6 (2015). They use static `import`/`export` syntax, support asynchronous loading, and enable static analysis for optimizations like tree shaking.

### Simple Explanation

Like a library catalog system - you declare upfront what books (exports) you're offering and what books (imports) you need. The system can analyze the catalog before anyone enters the library.

### Syntax

```javascript
// Named Exports
// math.js
export const PI = 3.14159;

export function add(a, b) {
    return a + b;
}

export function subtract(a, b) {
    return a - b;
}

export class Calculator {
    add(a, b) { return a + b; }
}

// Or export at the end
const multiply = (a, b) => a * b;
const divide = (a, b) => a / b;

export { multiply, divide };

// Export with rename
export { multiply as mult, divide as div };
```

```javascript
// Default Export
// logger.js
export default class Logger {
    log(message) {
        console.log(message);
    }
}

// Or
class Logger { /* ... */ }
export default Logger;

// Or inline
export default function(message) {
    console.log(message);
}

// Can combine default and named
export default class Logger { /* ... */ }
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];
```

```javascript
// Importing
// Named imports
import { add, subtract } from './math.js';
import { add as sum, subtract as minus } from './math.js';

// Import all as namespace
import * as math from './math.js';
math.add(1, 2);
math.PI;

// Default import
import Logger from './logger.js';

// Default + named
import Logger, { LOG_LEVELS } from './logger.js';

// Side effect import (just execute module)
import './polyfills.js';

// Dynamic import (returns Promise)
const module = await import('./heavy-module.js');
```

### Technical Specifications

| Feature | ES Modules |
|---------|------------|
| Loading | Asynchronous |
| Evaluation | Compile-time (static) |
| Exports | `export`, `export default` |
| Imports | `import`, `import()` |
| File extension | `.js`, `.mjs` |
| Top-level `this` | `undefined` |
| Strict mode | Always enabled |
| Top-level await | Supported (ES2022) |

### ES Modules vs CommonJS Comparison

| Feature | CommonJS | ES Modules |
|---------|----------|------------|
| Syntax | `require()`, `module.exports` | `import`, `export` |
| Loading | Synchronous | Asynchronous |
| Parsing | Runtime | Compile-time |
| Structure | Dynamic | Static |
| Tree shaking | No | Yes |
| Top-level await | No | Yes |
| Browser support | No (needs bundler) | Yes (native) |
| `this` value | `module.exports` | `undefined` |
| Strict mode | Optional | Always |
| Circular deps | Partial exports | Live bindings |

### Live Bindings vs Value Copying

```javascript
// CommonJS - exports are COPIED values
// counter.cjs
let count = 0;
module.exports = {
    count,
    increment() { count++; }
};

// main.cjs
const counter = require('./counter.cjs');
console.log(counter.count);  // 0
counter.increment();
console.log(counter.count);  // 0 (still! value was copied)
```

```javascript
// ES Modules - exports are LIVE BINDINGS
// counter.mjs
export let count = 0;
export function increment() { count++; }

// main.mjs
import { count, increment } from './counter.mjs';
console.log(count);  // 0
increment();
console.log(count);  // 1 (live binding updated!)
```

### Dynamic Imports

```javascript
// Dynamic import returns a Promise
async function loadModule() {
    const { default: Logger, LOG_LEVELS } = await import('./logger.js');
    const logger = new Logger();
    logger.log('Loaded dynamically');
}

// Conditional loading
async function loadFeature(featureName) {
    try {
        const module = await import(`./features/${featureName}.js`);
        return module.default;
    } catch (error) {
        console.error(`Feature ${featureName} not found`);
        return null;
    }
}

// Lazy loading for code splitting
button.addEventListener('click', async () => {
    const { heavyFunction } = await import('./heavy-module.js');
    heavyFunction();
});
```

### Limitations & Caveats

1. **File extensions are required in browsers**:
   ```javascript
   // ❌ Browser requires extension
   import { add } from './math';
   
   // ✅ Include extension
   import { add } from './math.js';
   
   // Node.js with "type": "module" may allow extensionless
   ```

2. **No `__dirname` or `__filename`**:
   ```javascript
   // ❌ Not available in ES Modules
   console.log(__dirname);  // ReferenceError
   
   // ✅ Use import.meta.url
   import { fileURLToPath } from 'url';
   import { dirname } from 'path';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   ```

3. **Cannot require() in ES Modules**:
   ```javascript
   // ❌ In ES Module
   const fs = require('fs');  // Error
   
   // ✅ Use import
   import fs from 'fs';
   import { readFile } from 'fs/promises';
   
   // ✅ Or createRequire for CommonJS modules
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
   const cjsModule = require('./legacy.cjs');
   ```

4. **Import statements are hoisted**:
   ```javascript
   // This works (imports are hoisted)
   console.log(add(1, 2));
   import { add } from './math.js';
   
   // But it's confusing - always put imports at top
   ```

5. **Cannot import JSON directly (without flag/assertion)**:
   ```javascript
   // ❌ Doesn't work by default
   import config from './config.json';
   
   // ✅ Node.js 17.5+: Import assertions
   import config from './config.json' assert { type: 'json' };
   
   // ✅ Or use fs
   import { readFileSync } from 'fs';
   const config = JSON.parse(readFileSync('./config.json', 'utf8'));
   
   // ✅ Or dynamic import
   const config = await import('./config.json', { assert: { type: 'json' } });
   ```

6. **Circular dependencies with default exports**:
   ```javascript
   // Can cause issues with default exports
   // Use named exports for circular dependencies
   ```

---

## AMD (Asynchronous Module Definition)

### Professional Definition

**AMD** was designed for browsers where synchronous loading isn't practical. It uses asynchronous loading with a `define()` function. RequireJS is the most popular AMD loader.

### Simple Explanation

Like ordering food delivery - you place your order (define dependencies) and continue with your day. When the food arrives (module loads), you're notified and can use it.

### Syntax

```javascript
// Defining a module
// math.js
define('math', [], function() {
    return {
        add: function(a, b) { return a + b; },
        subtract: function(a, b) { return a - b; }
    };
});

// With dependencies
// calculator.js
define('calculator', ['math', 'logger'], function(math, logger) {
    return {
        calculate: function(a, b) {
            logger.log('Calculating...');
            return math.add(a, b);
        }
    };
});

// Anonymous module (filename becomes module name)
define(['dependency'], function(dep) {
    return { /* ... */ };
});
```

```javascript
// Using modules
require(['calculator'], function(calculator) {
    console.log(calculator.calculate(1, 2));
});

// Configuration
require.config({
    baseUrl: '/js',
    paths: {
        'jquery': 'lib/jquery-3.6.0',
        'lodash': 'lib/lodash.min'
    }
});
```

### Limitations & Caveats

1. **Verbose syntax**:
   ```javascript
   // AMD is more verbose than ES Modules
   define(['dep1', 'dep2'], function(dep1, dep2) {
       // Must match order of dependencies
   });
   
   // vs ES Modules
   import dep1 from 'dep1';
   import dep2 from 'dep2';
   ```

2. **Mostly obsolete** - ES Modules have replaced AMD for new projects

---

## UMD (Universal Module Definition)

### Professional Definition

**UMD** is a pattern that allows modules to work in multiple environments (CommonJS, AMD, and browser globals). It's useful for libraries that need to support all module systems.

### Implementation

```javascript
// UMD wrapper
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['dependency'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory(require('dependency'));
    } else {
        // Browser global
        root.MyLibrary = factory(root.Dependency);
    }
}(typeof self !== 'undefined' ? self : this, function(dependency) {
    // Module code
    return {
        doSomething: function() {
            return dependency.helper();
        }
    };
}));
```

### When to Use UMD

- Publishing libraries that need to support all environments
- Legacy browser support without bundlers
- Gradually migrating from globals to modules

---

## Node.js Module Resolution

### Professional Definition

Node.js has a specific algorithm for resolving module paths. Understanding it helps debug "module not found" errors and optimize module loading.

### Resolution Algorithm

```javascript
require('module-name');

// 1. Is it a core module? (fs, path, http)
//    → Return core module

// 2. Does it start with './' or '../' or '/'?
//    → Resolve as file or directory

// 3. Otherwise, search node_modules
//    → Start from current directory, go up to root

// File resolution order:
// 1. Exact file: module-name
// 2. With extension: module-name.js, module-name.json, module-name.node
// 3. As directory: module-name/package.json "main" field
// 4. As directory: module-name/index.js, index.json, index.node
```

### package.json Module Fields

```json
{
    "name": "my-package",
    "version": "1.0.0",
    
    // CommonJS entry point
    "main": "./dist/index.cjs",
    
    // ES Module entry point
    "module": "./dist/index.mjs",
    
    // Modern exports field (Node.js 12.7+)
    "exports": {
        ".": {
            "import": "./dist/index.mjs",
            "require": "./dist/index.cjs",
            "types": "./dist/index.d.ts"
        },
        "./utils": {
            "import": "./dist/utils.mjs",
            "require": "./dist/utils.cjs"
        }
    },
    
    // Specify module type for .js files
    "type": "module",  // or "commonjs" (default)
    
    // Browser-specific entry
    "browser": "./dist/browser.js",
    
    // TypeScript types
    "types": "./dist/index.d.ts"
}
```

### Conditional Exports

```json
{
    "exports": {
        ".": {
            "node": {
                "import": "./dist/node.mjs",
                "require": "./dist/node.cjs"
            },
            "browser": "./dist/browser.js",
            "default": "./dist/index.js"
        }
    }
}
```

---

## Module Bundlers

### Professional Definition

**Module bundlers** are tools that combine multiple modules into one or more bundles for browser consumption. They resolve dependencies, transform code, and optimize output. Popular bundlers include **Webpack**, **Rollup**, **esbuild**, and **Vite**.

### Why Bundle?

| Problem | Solution |
|---------|----------|
| Many HTTP requests | Combine into fewer files |
| Browser compatibility | Transpile modern syntax |
| Module system support | Convert to browser-compatible format |
| Optimization | Minification, tree shaking |
| Asset handling | Import CSS, images, etc. |

### Webpack (Most Popular)

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    }
};
```

### Rollup (Library-focused)

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/bundle.cjs.js',
            format: 'cjs'
        },
        {
            file: 'dist/bundle.esm.js',
            format: 'esm'
        },
        {
            file: 'dist/bundle.umd.js',
            format: 'umd',
            name: 'MyLibrary'
        }
    ],
    plugins: [
        resolve(),
        commonjs(),
        terser()
    ]
};
```

### Vite (Modern, Fast)

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.js',
            name: 'MyLibrary',
            formats: ['es', 'cjs', 'umd']
        },
        rollupOptions: {
            external: ['react'],
            output: {
                globals: {
                    react: 'React'
                }
            }
        }
    }
});
```

### esbuild (Fastest)

```javascript
// build.js
const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: 'dist/bundle.js',
    format: 'esm',
    target: ['es2020']
}).catch(() => process.exit(1));
```

---

## Tree Shaking

### Professional Definition

**Tree shaking** is a dead code elimination technique that removes unused exports from the final bundle. It relies on the static structure of ES Modules to determine what code is actually used.

### Simple Explanation

Like shaking a tree to remove dead leaves. Only the live (used) code stays; dead (unused) code falls away.

### How It Works

```javascript
// utils.js
export function used() {
    return 'I am used';
}

export function unused() {
    return 'I am never imported';
}

export const USED_CONSTANT = 'used';
export const UNUSED_CONSTANT = 'unused';

// app.js
import { used, USED_CONSTANT } from './utils.js';

console.log(used());
console.log(USED_CONSTANT);

// After tree shaking, bundle only contains:
// - used()
// - USED_CONSTANT
// unused() and UNUSED_CONSTANT are removed
```

### Requirements for Tree Shaking

1. **Use ES Modules** (not CommonJS):
   ```javascript
   // ✅ Can be tree-shaken
   import { specific } from 'library';
   
   // ❌ Cannot be tree-shaken (CommonJS)
   const { specific } = require('library');
   ```

2. **Side-effect-free code**:
   ```javascript
   // package.json
   {
       "sideEffects": false
       // or specify files with side effects
       "sideEffects": ["*.css", "./src/polyfills.js"]
   }
   ```

3. **Avoid namespace imports for tree shaking**:
   ```javascript
   // ❌ Imports everything
   import * as utils from './utils.js';
   utils.specific();
   
   // ✅ Only imports what's used
   import { specific } from './utils.js';
   specific();
   ```

### Limitations & Caveats

1. **CommonJS modules can't be tree-shaken**:
   ```javascript
   // lodash (CommonJS) - imports entire library
   import _ from 'lodash';
   _.map([1, 2], x => x * 2);
   
   // lodash-es (ES Modules) - only imports map
   import { map } from 'lodash-es';
   map([1, 2], x => x * 2);
   ```

2. **Side effects prevent tree shaking**:
   ```javascript
   // This code has side effects - can't be removed
   export const config = {
       init() {
           window.myGlobal = 'set';  // Side effect!
       }
   };
   config.init();  // Executed on import
   ```

3. **Class methods can't be individually tree-shaken**:
   ```javascript
   // If you import the class, all methods are included
   class Utils {
       methodA() {}  // Included
       methodB() {}  // Included even if unused
   }
   export { Utils };
   
   // ✅ Use individual functions for better tree shaking
   export function methodA() {}
   export function methodB() {}
   ```

---

## Code Splitting

### Professional Definition

**Code splitting** divides your code into multiple bundles that can be loaded on demand. This reduces initial load time by only loading code when it's needed.

### Dynamic Import for Code Splitting

```javascript
// Route-based splitting
const routes = {
    '/': () => import('./pages/Home.js'),
    '/about': () => import('./pages/About.js'),
    '/dashboard': () => import('./pages/Dashboard.js')
};

async function navigate(path) {
    const loadPage = routes[path];
    if (loadPage) {
        const module = await loadPage();
        module.default.render();
    }
}

// Feature-based splitting
async function loadEditor() {
    const { Editor } = await import('./features/Editor.js');
    return new Editor();
}

// Component-based splitting (React example)
const LazyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Webpack Code Splitting

```javascript
// webpack.config.js
module.exports = {
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                },
                common: {
                    minChunks: 2,
                    name: 'common',
                    chunks: 'all'
                }
            }
        }
    }
};

// Magic comments for naming chunks
import(/* webpackChunkName: "editor" */ './Editor.js');
```

---

## Interoperability

### Using CommonJS in ES Modules

```javascript
// In ES Module (.mjs or "type": "module")

// Import default export from CommonJS
import cjsModule from './commonjs-module.cjs';

// Import named exports (if supported)
import { named } from './commonjs-module.cjs';

// Use createRequire for require()
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cjs = require('./commonjs-module.cjs');
```

### Using ES Modules in CommonJS

```javascript
// In CommonJS file

// Dynamic import (returns Promise)
async function loadESM() {
    const esm = await import('./es-module.mjs');
    return esm.default;
}

// Top-level await workaround
(async () => {
    const { namedExport } = await import('./es-module.mjs');
    console.log(namedExport);
})();
```

### Dual Package Publishing

```json
// package.json for dual CJS/ESM package
{
    "name": "my-library",
    "exports": {
        ".": {
            "import": "./dist/index.mjs",
            "require": "./dist/index.cjs"
        }
    },
    "main": "./dist/index.cjs",
    "module": "./dist/index.mjs",
    "types": "./dist/index.d.ts"
}
```

---

## Best Practices

### 1. Prefer ES Modules

```javascript
// ✅ Modern, static, tree-shakeable
import { specific } from './module.js';
export function myFunction() {}

// ❌ Legacy, dynamic, no tree shaking
const { specific } = require('./module');
module.exports = { myFunction };
```

### 2. Use Named Exports Over Default

```javascript
// ✅ Named exports - explicit, refactorable
export function processData() {}
export class DataProcessor {}

// ❌ Default exports - can be renamed on import
export default function() {}  // Anonymous
```

### 3. Keep Modules Focused

```javascript
// ❌ Kitchen sink module
// utils.js - everything in one file
export function formatDate() {}
export function formatCurrency() {}
export function validateEmail() {}
export function calculateTax() {}

// ✅ Focused modules
// date-utils.js
export function formatDate() {}

// currency-utils.js  
export function formatCurrency() {}

// validators.js
export function validateEmail() {}
```

### 4. Avoid Circular Dependencies

```javascript
// ❌ Circular dependency
// a.js
import { b } from './b.js';
export const a = 'A' + b;

// b.js
import { a } from './a.js';
export const b = 'B' + a;

// ✅ Extract shared code to third module
// shared.js
export const shared = 'shared';

// a.js
import { shared } from './shared.js';
export const a = 'A' + shared;

// b.js
import { shared } from './shared.js';
export const b = 'B' + shared;
```

### 5. Use Barrel Files Carefully

```javascript
// components/index.js (barrel file)
export { Button } from './Button.js';
export { Input } from './Input.js';
export { Modal } from './Modal.js';

// ✅ Convenient imports
import { Button, Input } from './components';

// ⚠️ But can hurt tree shaking if not configured properly
// Some bundlers import everything from barrel files
```

---

## Key Takeaways

| Module System | Use Case | Status |
|---------------|----------|--------|
| **ES Modules** | New projects, browsers | Standard |
| **CommonJS** | Legacy Node.js | Still common |
| **AMD** | Legacy browser async | Obsolete |
| **UMD** | Universal library distribution | Legacy |

### Quick Reference

| Task | ES Modules | CommonJS |
|------|------------|----------|
| Named export | `export { x }` | `exports.x = x` |
| Default export | `export default x` | `module.exports = x` |
| Named import | `import { x } from 'mod'` | `const { x } = require('mod')` |
| Default import | `import x from 'mod'` | `const x = require('mod')` |
| Dynamic import | `await import('mod')` | `require('mod')` |
| All imports | `import * as mod` | `const mod = require('mod')` |

---

> 💡 **Professional Tip**: When publishing a library, provide both ESM and CJS builds using the `exports` field in package.json. This ensures compatibility with all consumers while enabling tree shaking for ESM users. Use tools like tsup, unbuild, or Rollup to generate multiple formats from a single source.

