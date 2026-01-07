# Forms, Validation & Input Handling

> "Make it easy to do the right thing and hard to do the wrong thing." — Pit of Success Principle

Forms are the primary way users interact with applications. Mastering controlled vs uncontrolled inputs, validation patterns, and form libraries is essential for building robust React applications.

---

## Controlled vs Uncontrolled Components

| Aspect | Controlled | Uncontrolled |
|--------|------------|--------------|
| State Location | React state (`useState`) | DOM (accessed via refs) |
| Value Access | Immediate (state variable) | On submit (refs or FormData) |
| Validation | Real-time, per-keystroke | On blur or submit |
| Re-renders | Every input change | Minimal |
| Use Case | Complex forms, validation, dependent fields | Simple forms, large forms, file inputs |

### Controlled Component

```tsx
function ControlledForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      console.log("Submit:", formData);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Uncontrolled Component

```tsx
function UncontrolledForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Access values via refs
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    // Or use FormData API
    const formData = new FormData(formRef.current!);
    const data = Object.fromEntries(formData);

    console.log("Submit:", data);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          defaultValue=""
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          defaultValue=""
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Hybrid Approach (Best of Both)

```tsx
function HybridForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Real-time validation for email only
  function validateEmail(value: string) {
    if (!value) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email";
    return "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Validate controlled field
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    // Get uncontrolled fields from FormData
    const data = {
      email,
      password: formData.get("password"),
      name: formData.get("name"),
    };

    console.log("Submit:", data);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Controlled - needs validation */}
      <input
        name="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError(validateEmail(e.target.value));
        }}
      />
      {emailError && <span className="error">{emailError}</span>}

      {/* Uncontrolled - simple fields */}
      <input name="name" defaultValue="" />
      <input name="password" type="password" defaultValue="" />

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## FormData API (Modern Approach)

```tsx
function ModernForm() {
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    // Convert to object
    const data = Object.fromEntries(formData);
    // { email: "test@test.com", password: "123456" }

    // Handle multiple values (checkboxes, multi-select)
    const hobbies = formData.getAll("hobbies");
    // ["reading", "coding", "gaming"]

    // Send to API
    await fetch("/api/submit", {
      method: "POST",
      body: formData, // Can send FormData directly
    });

    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />

      <fieldset>
        <legend>Hobbies</legend>
        <label>
          <input type="checkbox" name="hobbies" value="reading" /> Reading
        </label>
        <label>
          <input type="checkbox" name="hobbies" value="coding" /> Coding
        </label>
        <label>
          <input type="checkbox" name="hobbies" value="gaming" /> Gaming
        </label>
      </fieldset>

      <button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

---

## Validation Strategies

### 1. HTML5 Native Validation

```tsx
function NativeValidation() {
  return (
    <form>
      <input
        type="email"
        required
        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
        title="Please enter a valid email"
      />
      <input
        type="password"
        required
        minLength={8}
        maxLength={100}
      />
      <input
        type="tel"
        pattern="[0-9]{10}"
        title="10 digit phone number"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 2. Custom Validation with useReducer

```tsx
type FormState = {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
};

type FormAction =
  | { type: "SET_VALUE"; field: string; value: string }
  | { type: "SET_ERROR"; field: string; error: string }
  | { type: "SET_TOUCHED"; field: string }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "RESET" };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_VALUE":
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: "" },
      };
    case "SET_ERROR":
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };
    case "SET_TOUCHED":
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const initialState: FormState = {
  values: { email: "", password: "" },
  errors: {},
  touched: {},
  isSubmitting: false,
};

function FormWithReducer() {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const validators: Record<string, (value: string) => string> = {
    email: (value) => {
      if (!value) return "Email is required";
      if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email";
      return "";
    },
    password: (value) => {
      if (!value) return "Password is required";
      if (value.length < 8) return "Must be at least 8 characters";
      return "";
    },
  };

  function handleChange(field: string, value: string) {
    dispatch({ type: "SET_VALUE", field, value });
  }

  function handleBlur(field: string) {
    dispatch({ type: "SET_TOUCHED", field });
    const error = validators[field]?.(state.values[field]) ?? "";
    dispatch({ type: "SET_ERROR", field, error });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate all fields
    let hasErrors = false;
    for (const [field, validate] of Object.entries(validators)) {
      const error = validate(state.values[field]);
      if (error) {
        dispatch({ type: "SET_ERROR", field, error });
        hasErrors = true;
      }
    }

    if (hasErrors) return;

    dispatch({ type: "SET_SUBMITTING", isSubmitting: true });
    await submitForm(state.values);
    dispatch({ type: "RESET" });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={state.values.email}
        onChange={(e) => handleChange("email", e.target.value)}
        onBlur={() => handleBlur("email")}
      />
      {state.touched.email && state.errors.email && (
        <span className="error">{state.errors.email}</span>
      )}

      <input
        type="password"
        value={state.values.password}
        onChange={(e) => handleChange("password", e.target.value)}
        onBlur={() => handleBlur("password")}
      />
      {state.touched.password && state.errors.password && (
        <span className="error">{state.errors.password}</span>
      )}

      <button type="submit" disabled={state.isSubmitting}>
        {state.isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

### 3. Schema Validation with Zod

```tsx
import { z } from "zod";

// Define schema
const userSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string(),
  age: z.coerce.number().min(18, "Must be 18 or older"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userSchema>;

function ZodValidatedForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const result = userSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Valid data with correct types
    console.log("Valid:", result.data);
    setErrors({});
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input name="email" type="email" placeholder="Email" />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <input name="password" type="password" placeholder="Password" />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <div>
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
        />
        {errors.confirmPassword && (
          <span className="error">{errors.confirmPassword}</span>
        )}
      </div>

      <div>
        <input name="age" type="number" placeholder="Age" />
        {errors.age && <span className="error">{errors.age}</span>}
      </div>

      <button type="submit">Register</button>
    </form>
  );
}
```

---

## React Hook Form (Production Library)

```tsx
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "user", "guest"]),
  newsletter: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function ReactHookFormExample() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      role: "user",
      newsletter: false,
    },
  });

  // Watch specific field
  const role = watch("role");

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Submitted:", data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <span role="alert" className="error">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <span role="alert" className="error">
            {errors.password.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select id="role" {...register("role")}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="guest">Guest</option>
        </select>
        {role === "admin" && (
          <p className="warning">Admin role requires approval</p>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register("newsletter")} />
          Subscribe to newsletter
        </label>
      </div>

      <button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

### React Hook Form with Field Arrays

```tsx
import { useForm, useFieldArray } from "react-hook-form";

interface FormValues {
  users: { name: string; email: string }[];
}

function DynamicFieldsForm() {
  const { register, control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      users: [{ name: "", email: "" }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "users",
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      {fields.map((field, index) => (
        <div key={field.id} className="user-row">
          <input
            {...register(`users.${index}.name`)}
            placeholder="Name"
          />
          <input
            {...register(`users.${index}.email`)}
            placeholder="Email"
          />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
          {index > 0 && (
            <button type="button" onClick={() => move(index, index - 1)}>
              Move Up
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: "", email: "" })}
      >
        Add User
      </button>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## File Uploads

```tsx
function FileUploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("avatar") as File;

    if (!file || file.size === 0) {
      alert("Please select a file");
      return;
    }

    setUploading(true);

    try {
      // XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      alert("Upload successful!");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="avatar">Avatar</label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{ maxWidth: 200, maxHeight: 200 }}
        />
      )}

      {uploading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}

      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
```

---

## Debounced Input (Search)

```tsx
import { useDeferredValue, useState, useEffect } from "react";

// Custom hook for debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    async function search() {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${debouncedQuery}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }

    search();
    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <span>Loading...</span>}
      <ul>
        {results.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// React 18+ approach with useDeferredValue
function SearchWithDeferred() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <SearchResults query={deferredQuery} />
      </div>
    </div>
  );
}
```

---

## Form Accessibility

```tsx
function AccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus error summary for screen readers
      errorSummaryRef.current?.focus();
      return;
    }

    // Submit...
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Error Summary - announces errors to screen readers */}
      {Object.keys(errors).length > 0 && (
        <div
          ref={errorSummaryRef}
          role="alert"
          aria-live="polite"
          tabIndex={-1}
          className="error-summary"
        >
          <h2>There are {Object.keys(errors).length} errors</h2>
          <ul>
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <a href={`#${field}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="email">
          Email <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert" className="error">
            {errors.email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">
          Password <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-describedby="password-hint password-error"
        />
        <span id="password-hint" className="hint">
          Must be at least 8 characters
        </span>
        {errors.password && (
          <span id="password-error" role="alert" className="error">
            {errors.password}
          </span>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Best Practices

### 1. Choose the Right Approach

| Scenario | Recommendation |
|----------|----------------|
| Simple form, few fields | Uncontrolled + FormData |
| Real-time validation needed | Controlled |
| Large form with many fields | Uncontrolled or React Hook Form |
| Complex validation rules | Zod + React Hook Form |
| Dynamic fields (add/remove) | useFieldArray from RHF |

### 2. Validation Timing

```tsx
// Validate on blur (recommended for most cases)
<input onBlur={() => validateField("email")} />

// Validate on change (for UX, but after first blur)
const [touched, setTouched] = useState(false);
<input
  onBlur={() => setTouched(true)}
  onChange={(e) => {
    setValue(e.target.value);
    if (touched) validateField("email");
  }}
/>

// Validate on submit (simplest, but delayed feedback)
<form onSubmit={validateAllFields}>
```

### 3. Error Messages

```tsx
// ❌ Generic errors
"Invalid field"
"Error"

// ✅ Specific, actionable errors
"Email must be in format: example@domain.com"
"Password must contain at least one uppercase letter"
"Please select a date after today"
```

---

## Interview Questions

### Q1: When would you use controlled vs uncontrolled components?
**A:** Controlled for real-time validation, dependent fields, and when you need immediate access to values. Uncontrolled for simple forms, file inputs, and when minimizing re-renders is critical.

### Q2: How do you handle form validation in React?
**A:** Three approaches: HTML5 native validation for simple cases, custom validation with state for moderate complexity, and schema validation (Zod/Yup) with React Hook Form for complex forms. Schema validation provides type safety and reusable validation rules.

### Q3: What's the benefit of React Hook Form over controlled components?
**A:** RHF uses uncontrolled inputs internally, reducing re-renders. It provides built-in validation, field arrays, and form state management. The `register` function handles all the boilerplate.

### Q4: How do you make forms accessible?
**A:** Use proper labels with `htmlFor`, link errors with `aria-describedby`, set `aria-invalid` on error, announce errors with `role="alert"`, provide an error summary that can be focused, and ensure keyboard navigation works.

### Q5: How do you handle file uploads with progress?
**A:** Use XMLHttpRequest for progress events via `xhr.upload.onprogress`, or use libraries like axios with `onUploadProgress`. Validate file type and size before upload, show preview for images.
