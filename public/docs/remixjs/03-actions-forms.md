# Remix Actions & Forms

> "Forms are the backbone of web applications." — Remix Philosophy

Remix embraces the web's native form handling while providing modern enhancements. Actions handle mutations (POST, PUT, PATCH, DELETE), and forms work without JavaScript while progressively enhancing when JS is available.

---

## Professional Definition

| Concept | Definition | Senior Consideration |
|---------|------------|---------------------|
| Actions | Server functions handling non-GET requests | Mutations are colocated with UI, no separate API layer |
| `<Form>` | Remix's enhanced form component | Works without JS, adds pending states with JS |
| `useFetcher` | Interact with routes without navigation | For mutations that shouldn't change URL |
| Progressive Enhancement | Base functionality without JS | Forms submit, pages load; JS adds UX improvements |
| Optimistic UI | Update UI before server confirms | Instant feedback using `fetcher.formData` |

---

## Action Function Fundamentals

Actions handle form submissions and non-GET requests:

```tsx
// app/routes/contacts.new.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";

// Action handles POST/PUT/PATCH/DELETE
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  // Extract form values
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  
  // Validate
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";
  if (email && !isValidEmail(email.toString())) {
    errors.email = "Invalid email format";
  }
  
  // Return errors if validation failed
  if (Object.keys(errors).length > 0) {
    return json({ errors, values: { name, email, phone } }, { status: 400 });
  }
  
  // Create the record
  const contact = await createContact({ name, email, phone });
  
  // Redirect on success
  return redirect(`/contacts/${contact.id}`);
}

export default function NewContact() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <Form method="post">
      <div>
        <label>
          Name:
          <input
            type="text"
            name="name"
            defaultValue={actionData?.values?.name ?? ""}
          />
        </label>
        {actionData?.errors?.name && (
          <span className="error">{actionData.errors.name}</span>
        )}
      </div>
      
      <div>
        <label>
          Email:
          <input
            type="email"
            name="email"
            defaultValue={actionData?.values?.email ?? ""}
          />
        </label>
        {actionData?.errors?.email && (
          <span className="error">{actionData.errors.email}</span>
        )}
      </div>
      
      <div>
        <label>
          Phone:
          <input
            type="tel"
            name="phone"
            defaultValue={actionData?.values?.phone ?? ""}
          />
        </label>
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Contact"}
      </button>
    </Form>
  );
}
```

---

## Form Methods & Request Handling

```tsx
export async function action({ request }: ActionFunctionArgs) {
  // Check the HTTP method
  const method = request.method;
  
  switch (method) {
    case "POST":
      return handleCreate(request);
    case "PUT":
      return handleUpdate(request);
    case "PATCH":
      return handlePartialUpdate(request);
    case "DELETE":
      return handleDelete(request);
    default:
      return json({ error: "Method not allowed" }, { status: 405 });
  }
}

// In the component, specify method:
<Form method="post">...</Form>
<Form method="put">...</Form>
<Form method="delete">...</Form>
```

### Using Intent Pattern for Multiple Actions

```tsx
export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  switch (intent) {
    case "update":
      const title = formData.get("title");
      await updatePost(params.id, { title });
      return json({ success: true });
      
    case "publish":
      await publishPost(params.id);
      return redirect(`/posts/${params.id}`);
      
    case "delete":
      await deletePost(params.id);
      return redirect("/posts");
      
    default:
      return json({ error: "Invalid intent" }, { status: 400 });
  }
}

export default function PostEditor() {
  return (
    <div>
      {/* Update form */}
      <Form method="post">
        <input type="hidden" name="intent" value="update" />
        <input type="text" name="title" />
        <button type="submit">Save</button>
      </Form>
      
      {/* Publish button */}
      <Form method="post">
        <input type="hidden" name="intent" value="publish" />
        <button type="submit">Publish</button>
      </Form>
      
      {/* Delete button */}
      <Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">Delete</button>
      </Form>
    </div>
  );
}
```

---

## Form vs fetcher: When to Use Each

### Use `<Form>` when:
- Navigation should occur (URL changes)
- Creating new records (redirect to new page)
- Form submission is the primary action
- You want browser history

### Use `useFetcher` when:
- Staying on the same page
- Updating individual items in a list
- Background submissions
- Multiple independent forms on one page

```tsx
import { Form, useFetcher } from "@remix-run/react";

function ProductList({ products }) {
  return (
    <div>
      {/* Form: Creates new product, navigates to its page */}
      <Form method="post" action="/products/new">
        <input type="text" name="name" placeholder="New product name" />
        <button type="submit">Add Product</button>
      </Form>
      
      {/* Fetcher: Updates each product inline, no navigation */}
      {products.map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductItem({ product }) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== "idle";
  
  return (
    <div style={{ opacity: isDeleting ? 0.5 : 1 }}>
      <span>{product.name}</span>
      
      <fetcher.Form method="post" action={`/products/${product.id}`}>
        <input type="hidden" name="intent" value="delete" />
        <button type="submit" disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </fetcher.Form>
    </div>
  );
}
```

---

## useFetcher Deep Dive

```tsx
import { useFetcher } from "@remix-run/react";

function NewsletterSignup() {
  const fetcher = useFetcher<typeof action>();
  
  // fetcher.state: "idle" | "submitting" | "loading"
  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;
  const error = fetcher.data?.error;
  
  if (isSuccess) {
    return <p>Thanks for subscribing!</p>;
  }
  
  return (
    <fetcher.Form method="post" action="/api/newsletter">
      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        aria-describedby={error ? "error" : undefined}
      />
      {error && <p id="error" className="error">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Subscribing..." : "Subscribe"}
      </button>
    </fetcher.Form>
  );
}
```

### Fetcher for Loading Data

```tsx
function CitySearch() {
  const fetcher = useFetcher<typeof citySearchLoader>();
  
  return (
    <div>
      <fetcher.Form method="get" action="/api/cities">
        <input
          type="text"
          name="q"
          onChange={(e) => {
            fetcher.submit(e.currentTarget.form);
          }}
          placeholder="Search cities..."
        />
      </fetcher.Form>
      
      {fetcher.state === "loading" && <Spinner />}
      
      {fetcher.data && (
        <ul>
          {fetcher.data.cities.map((city) => (
            <li key={city.id}>{city.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Fetcher with Key (Shared State)

```tsx
// Multiple components can share the same fetcher
function AddToCartButton({ productId }) {
  const fetcher = useFetcher({ key: "add-to-cart" });
  return (
    <fetcher.Form method="post" action="/cart">
      <input type="hidden" name="productId" value={productId} />
      <button type="submit">Add to Cart</button>
    </fetcher.Form>
  );
}

function CartCount() {
  // Access the same fetcher's state
  const fetcher = useFetcher({ key: "add-to-cart" });
  const pendingItems = fetcher.formData
    ? parseInt(fetcher.formData.get("quantity") as string) || 1
    : 0;
  
  return <span>Cart: {baseCount + pendingItems}</span>;
}
```

---

## Optimistic UI

Update the UI immediately before the server responds:

```tsx
function ToggleFavorite({ project }) {
  const fetcher = useFetcher();
  
  // Optimistic value: use form data if submitting, otherwise use server state
  const isFavorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : project.isFavorite;
  
  return (
    <fetcher.Form method="post">
      <input
        type="hidden"
        name="favorite"
        value={isFavorite ? "false" : "true"}
      />
      <button
        type="submit"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
}
```

### Optimistic Delete with Rollback

```tsx
function TodoItem({ todo }) {
  const fetcher = useFetcher();
  
  // Hide immediately when deleting
  if (fetcher.formData?.get("intent") === "delete") {
    return null; // Optimistically removed
  }
  
  // Show error if delete failed
  if (fetcher.data?.error) {
    return (
      <li className="error">
        {todo.title} - Failed to delete: {fetcher.data.error}
      </li>
    );
  }
  
  return (
    <li>
      <span>{todo.title}</span>
      <fetcher.Form method="post">
        <input type="hidden" name="id" value={todo.id} />
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">Delete</button>
      </fetcher.Form>
    </li>
  );
}
```

---

## useNavigation for Pending UI

```tsx
import { Form, useNavigation } from "@remix-run/react";

function SubmitButton() {
  const navigation = useNavigation();
  
  // Check if THIS form is being submitted
  const isSubmitting = navigation.state === "submitting";
  
  // More specific: check the action URL
  const isSubmittingHere = 
    navigation.state === "submitting" &&
    navigation.formAction === "/current-route";
  
  return (
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : "Save"}
    </button>
  );
}

function GlobalPendingIndicator() {
  const navigation = useNavigation();
  
  // Show spinner for any navigation
  if (navigation.state === "loading") {
    return <div className="global-spinner" />;
  }
  
  return null;
}
```

### Navigation State Machine

```
navigation.state values:

idle → submitting → loading → idle
      (action)     (loaders)

idle → loading → idle
      (link click, no action)
```

---

## useActionData

Access data returned from the action:

```tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  try {
    const user = await createUser(formData);
    return redirect(`/users/${user.id}`);
  } catch (error) {
    if (error instanceof ValidationError) {
      return json({ errors: error.fieldErrors }, { status: 400 });
    }
    return json({ error: "Server error" }, { status: 500 });
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  
  return (
    <Form method="post">
      {actionData?.error && (
        <div className="alert alert-error">{actionData.error}</div>
      )}
      
      <input type="text" name="username" />
      {actionData?.errors?.username && (
        <span className="field-error">{actionData.errors.username}</span>
      )}
      
      <input type="email" name="email" />
      {actionData?.errors?.email && (
        <span className="field-error">{actionData.errors.email}</span>
      )}
      
      <button type="submit">Register</button>
    </Form>
  );
}
```

---

## Form Validation Patterns

### Server-Side Validation with Zod

```tsx
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  const result = ContactSchema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return json({ errors, values: data }, { status: 400 });
  }
  
  // Valid data
  await sendContactEmail(result.data);
  return redirect("/thank-you");
}
```

### Client-Side Enhancement with Conform

```tsx
import { useForm, conform } from "@conform-to/react";
import { parse } from "@conform-to/zod";

export default function ContactForm() {
  const lastSubmission = useActionData<typeof action>();
  
  const [form, { name, email, message }] = useForm({
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema: ContactSchema });
    },
  });
  
  return (
    <Form method="post" {...form.props}>
      <div>
        <label htmlFor={name.id}>Name</label>
        <input {...conform.input(name)} />
        {name.error && <span>{name.error}</span>}
      </div>
      
      <div>
        <label htmlFor={email.id}>Email</label>
        <input {...conform.input(email, { type: "email" })} />
        {email.error && <span>{email.error}</span>}
      </div>
      
      <div>
        <label htmlFor={message.id}>Message</label>
        <textarea {...conform.textarea(message)} />
        {message.error && <span>{message.error}</span>}
      </div>
      
      <button type="submit">Send</button>
    </Form>
  );
}
```

---

## File Uploads

```tsx
import { 
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
} from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 5_000_000, // 5MB
  });
  
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );
  
  const file = formData.get("avatar") as File;
  
  if (file && file.size > 0) {
    // Process the file
    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;
    await saveFile(fileName, Buffer.from(buffer));
    
    return json({ success: true, fileName });
  }
  
  return json({ error: "No file uploaded" }, { status: 400 });
}

export default function AvatarUpload() {
  return (
    <Form method="post" encType="multipart/form-data">
      <input type="file" name="avatar" accept="image/*" />
      <button type="submit">Upload</button>
    </Form>
  );
}
```

---

## Programmatic Form Submission

```tsx
import { useSubmit } from "@remix-run/react";

function AutoSaveForm() {
  const submit = useSubmit();
  
  return (
    <Form
      method="post"
      onChange={(e) => {
        // Auto-submit on change (debounce in production)
        submit(e.currentTarget, { replace: true });
      }}
    >
      <input type="text" name="title" />
      <textarea name="content" />
    </Form>
  );
}

function DeleteButton({ id }) {
  const submit = useSubmit();
  
  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      submit(
        { intent: "delete", id },
        { method: "post", action: "/items" }
      );
    }
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

---

## Senior Interview Focus Points

1. **Explain progressive enhancement in forms:**
   - HTML forms work natively without JavaScript
   - Remix's `<Form>` intercepts submissions when JS is available
   - Adds pending states, optimistic UI, client-side validation
   - Gracefully degrades on JS failure

2. **When do you use Form vs fetcher?**
   ```tsx
   // Form: URL should change (navigation)
   <Form method="post" action="/posts/new">
     → Creates post, redirects to /posts/123
   
   // fetcher: Stay on page
   <fetcher.Form method="post" action="/api/favorite">
     → Toggles favorite, stays on current page
   ```

3. **How do you handle multiple forms on one page?**
   - Use `intent` hidden field to distinguish actions
   - Use different `action` URLs
   - Use `useFetcher` for independent forms

4. **Explain optimistic UI:**
   ```tsx
   const isFavorite = fetcher.formData
     ? fetcher.formData.get("favorite") === "true"  // Optimistic
     : project.isFavorite;                          // Server truth
   ```
   - Read from `formData` during submission
   - Shows immediate feedback
   - Revalidation syncs with server on completion/error

5. **How do you handle form errors?**
   - Validate on server (always)
   - Return errors with status 400
   - Use `useActionData` to display errors
   - Preserve user input via `defaultValue`
   - Optionally add client-side validation for UX
