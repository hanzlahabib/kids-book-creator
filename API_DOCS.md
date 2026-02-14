# 📡 API Documentation — Kids Book Creator

Base URL: `http://localhost:3003/api`

All endpoints return JSON. Authenticated endpoints require a valid NextAuth session cookie.

---

## Authentication

### POST `/auth/signup`
Register a new account.

**Rate Limit**: 5 req/min per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "John Doe"
}
```

**Validation Rules:**
- `email` — required, must be valid email
- `password` — required, minimum 6 characters
- `name` — optional

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Error Responses:**
- `400` — Invalid input (e.g., short password, bad email)
- `409` — Email already exists
- `429` — Rate limited

---

## Books

### GET `/books`
List all user's books with pages.

**Response (200):**
```json
{
  "books": [
    {
      "id": "clx...",
      "title": "Animal Coloring Book",
      "theme": "animals",
      "ageGroup": "4-6",
      "status": "draft",
      "pageCount": 10,
      "pages": [...]
    }
  ]
}
```

### POST `/books`
Create a new book.

**Request Body:**
```json
{
  "title": "My Coloring Book",
  "theme": "animals",
  "ageGroup": "4-6",
  "description": "A fun coloring book for kids"
}
```

**Validation:**
- `title` — required, 1-200 chars
- `theme` — required, min 1 char
- `ageGroup` — optional
- `description` — optional, max 1000 chars

**Response (200):**
```json
{ "book": { "id": "clx...", "title": "My Coloring Book", ... } }
```

### GET `/books/:id`
Get a single book with all its pages.

**Response (200):**
```json
{ "book": { "id": "clx...", "title": "...", "pages": [...] } }
```

**Error:** `404` — Book not found

### PUT `/books/:id`
Update book properties.

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "status": "ready"
}
```

### DELETE `/books/:id`
Delete a book and all its pages.

**Response (200):** `{ "success": true }`

---

## Pages

### POST `/books/:id/pages`
Add pages to a book.

**Request Body:**
```json
{
  "pages": [
    { "imagePath": "/images/page-1.png", "prompt": "cute cat", "theme": "animals" }
  ]
}
```

### PUT `/books/:id/pages`
Reorder pages.

**Request Body:**
```json
{
  "pageOrder": ["page-id-3", "page-id-1", "page-id-2"]
}
```

### GET `/pages/:id`
Get a single page.

### PUT `/pages/:id`
Update a page (pageNumber, prompt).

### DELETE `/pages/:id`
Delete a page. Automatically renumbers remaining pages and cleans up the image file.

---

## AI Generation

### POST `/generate`
Generate AI images for activity book pages.

**Rate Limit**: 10 req/min per user

**Request Body:**
```json
{
  "theme": "animals",
  "subject": "cute cat playing with yarn",
  "ageGroup": "4-6",
  "quantity": 1,
  "style": "coloring",
  "provider": "openai",
  "mode": "credits"
}
```

**Validation:**
- `theme` — required (animals, dinosaurs, unicorns, vehicles, ocean, nature, alphabet, numbers, islamic)
- `ageGroup` — required (2-4, 4-6, 6-8)
- `quantity` — 1-100, default 1
- `style` — coloring | tracing | educational | drawing
- `provider` — openai | replicate | stability | fal
- `mode` — credits | byok

**Success Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "imagePath": "/images/gen-abc123.png",
      "prompt": "...",
      "estimatedCost": 0.04
    }
  ],
  "generated": 1,
  "failed": 0,
  "provider": "openai",
  "mode": "credits",
  "credits": 9
}
```

**Error Responses:**
- `400` — Invalid input
- `402` — Insufficient credits
- `403` — Batch generation requires Pro plan
- `429` — Rate limited

### GET `/generate?limit=50&theme=animals`
Get generation history.

---

## Export

### POST `/export`
Export a book as a KDP-ready ZIP package (interior PDF + cover PDF + README).

**Rate Limit**: 5 req/min per user

**Request Body:**
```json
{
  "bookId": "clx...",
  "trimSize": "8.5x11",
  "includePageNumbers": true,
  "includeCover": true,
  "coverTitle": "My Animal Coloring Book",
  "coverAuthor": "John Doe",
  "coverBackText": "50 amazing coloring pages!"
}
```

**Validation:**
- `bookId` — required
- `trimSize` — 8.5x11 | 8x10 | 6x9 (default: 8.5x11)
- `includePageNumbers` — boolean, default true
- `includeCover` — boolean, default true
- `coverAuthor` — max 100 chars, default "Activity Books"
- `coverBackText` — max 500 chars

**Response:** ZIP file (Content-Type: application/zip)

---

## Templates

### GET `/templates`
List all active templates.

**Response (200):**
```json
{
  "templates": [
    {
      "id": "clx...",
      "name": "Animals Coloring (Ages 2-4)",
      "category": "coloring",
      "theme": "animals",
      "ageGroup": "2-4",
      "description": "..."
    }
  ]
}
```

### POST `/templates/seed`
Seed the default 10 templates (admin or setup).

---

## Plans

### GET `/plans`
List all active subscription plans.

**Response (200):**
```json
{
  "plans": [
    { "name": "Free", "slug": "free", "price": 0, "credits": 10, "features": [...], "limits": {...} },
    { "name": "Starter", "slug": "starter", "price": 900, "credits": 100, ... },
    { "name": "Pro", "slug": "pro", "price": 2900, "credits": 500, ... },
    { "name": "Unlimited", "slug": "unlimited", "price": 7900, "credits": 99999, ... }
  ]
}
```

---

## Credits

### GET `/credits?history=true&limit=50`
Get credit balance and optional usage history.

**Response (200):**
```json
{
  "credits": 45,
  "creditsUsed": 55,
  "maxCredits": 100,
  "planName": "Starter",
  "billingCycleStart": "2026-02-01T00:00:00Z",
  "history": [
    { "action": "generate", "creditsUsed": 1, "provider": "openai", "createdAt": "..." }
  ]
}
```

### POST `/credits`
Deduct credits (internal).

**Request Body:**
```json
{ "amount": 1, "action": "generate", "provider": "credits" }
```

---

## API Keys (BYOK)

### GET `/keys`
List user's saved API keys (masked).

**Response (200):**
```json
{
  "keys": [
    { "id": "clx...", "provider": "openai", "keyLast4": "Ab3f", "maskedKey": "****...Ab3f", "isValid": true }
  ]
}
```

### POST `/keys`
Add a new API key. Validates the key by testing the provider connection.

**Request Body:**
```json
{
  "provider": "openai",
  "key": "sk-...",
  "label": "My OpenAI Key"
}
```

**Validation:**
- `provider` — openai | replicate | stability | fal
- `key` — required, max 500 chars
- `label` — optional, max 100 chars

**Error Responses:**
- `400` — Invalid key (connection test failed)
- `409` — Key already exists

### DELETE `/keys/:id`
Delete a saved API key.

---

## Subscription

### GET `/subscription`
Get current subscription details.

### PATCH `/subscription`
Update preferences (e.g., BYOK preference).

```json
{ "preferByok": true }
```

### POST `/subscription/checkout`
Create a Stripe Checkout session.

```json
{ "planSlug": "starter" }
```

**Response:** `{ "url": "https://checkout.stripe.com/..." }`

### POST `/subscription/portal`
Create a Stripe Customer Portal session.

**Response:** `{ "url": "https://billing.stripe.com/..." }`

### POST `/webhooks/stripe`
Stripe webhook handler (not for direct use).

---

## Stats

### GET `/stats`
Dashboard statistics.

**Response (200):**
```json
{
  "stats": { "totalBooks": 5, "totalPages": 45, "totalGenerations": 60, "exportedBooks": 2 },
  "recentBooks": [...]
}
```

---

## Admin (🔒 Admin Only)

### GET `/admin/users?page=1&limit=20&search=`
Paginated user list with counts.

### GET `/admin/users/:id`
Full user details with books, usage records, and API keys.

### PUT `/admin/users/:id`
Update user role, credits, or plan.

```json
{ "role": "admin", "credits": 100, "planId": "..." }
```

### GET `/admin/analytics`
Platform analytics: users, generations, books, MRR, usage by provider.

---

## Error Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "details": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

Common HTTP status codes:
- `400` — Validation error
- `401` — Not authenticated
- `402` — Insufficient credits
- `403` — Forbidden (wrong role)
- `404` — Resource not found
- `409` — Conflict (duplicate)
- `429` — Rate limited
- `500` — Internal server error
- `503` — Service unavailable (e.g., Stripe not configured)
