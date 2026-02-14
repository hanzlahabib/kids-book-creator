# 📚 Kids Book Creator

> AI-powered children's activity book creation platform for **Amazon KDP**

[![CI](https://github.com/hanzlahabib/kids-book-creator/actions/workflows/ci.yml/badge.svg)](https://github.com/hanzlahabib/kids-book-creator/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 What is Kids Book Creator?

Kids Book Creator lets you **generate, assemble, and export** children's activity books using AI — ready to publish on Amazon KDP. Create coloring books, tracing books, activity books, and workbooks in minutes instead of weeks.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| 🤖 **AI Image Generation** | Generate coloring pages, tracing sheets & activities using DALL-E, Stability AI, Replicate, or Fal.ai |
| 📖 **Book Assembly** | Drag-and-drop page ordering, multi-book management |
| 📄 **KDP-Ready PDF Export** | Interior + cover PDFs with correct trim sizes, margins, bleed — ready to upload |
| 📐 **Templates Library** | 10+ pre-built templates (animals, alphabet, dinosaurs, unicorns, vehicles, etc.) |
| 🔑 **BYOK (Bring Your Own Key)** | Use your own API keys for OpenAI, Stability AI, Replicate, or Fal.ai |
| 💳 **Subscription & Credits** | Stripe-powered plans (Free → Starter → Pro → Unlimited) with monthly credits |
| 👤 **Auth & User Management** | Email/password + Google OAuth via NextAuth v5 |
| 🛡️ **Admin Dashboard** | User management, analytics, MRR tracking |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────┐
│                    Frontend                        │
│  Next.js 16 App Router + React 19 + shadcn/ui     │
│  Pages: Dashboard, Generate, Books, Templates,    │
│         Export, Settings, Admin                    │
├────────────────────────────────────────────────────┤
│                    API Layer                       │
│  23 REST endpoints with Zod validation            │
│  Rate limiting · NextAuth v5 sessions             │
├──────────────┬──────────┬──────────────────────────┤
│  AI Providers│ Payments │     Database             │
│  OpenAI      │ Stripe   │     SQLite + Prisma 7    │
│  Replicate   │ Webhooks │     (libSQL adapter)     │
│  Stability   │ Plans    │                          │
│  Fal.ai      │ Credits  │                          │
└──────────────┴──────────┴──────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + shadcn/ui + Tailwind CSS v4 |
| Database | SQLite via Prisma 7 + libSQL adapter |
| Auth | NextAuth v5 (credentials + Google OAuth) |
| Payments | Stripe (subscriptions, webhooks, customer portal) |
| AI | OpenAI DALL-E, Stability AI, Replicate, Fal.ai |
| PDF | pdf-lib (interior + cover generation) |
| Drag & Drop | @dnd-kit |
| Validation | Zod |
| Testing | Vitest 4 + Testing Library |
| CI | GitHub Actions |

---

## 📋 Feature Details

### 1. AI Image Generation

Generate high-quality activity book pages using multiple AI providers. Each provider is abstracted behind a common interface for seamless switching.

- **Providers**: OpenAI DALL-E 3, Stability AI, Replicate, Fal.ai
- **Styles**: Coloring (thick outlines), tracing, educational, drawing
- **Themes**: Animals, dinosaurs, unicorns, vehicles, ocean, nature, alphabet, numbers, Islamic patterns
- **Age Groups**: 2-4, 4-6, 6-8
- **Batch Generation**: Generate up to 100 images at once (Pro plan)
- **Smart Prompts**: Auto-generates age-appropriate prompts per theme
- **Credits Mode**: Uses platform credits (deducted per generation)
- **BYOK Mode**: Uses your own API key (no credit deduction)

### 2. Book Management

Create and manage multiple activity books with full CRUD operations.

- Create books with title, theme, and age group
- Add generated images as pages
- **Drag-and-drop page reordering** via @dnd-kit
- View page thumbnails in a responsive grid
- Track book status: `draft` → `ready` → `exported`

### 3. KDP-Ready PDF Export

Export books as Amazon KDP-compliant PDFs with proper specifications.

- **Trim Sizes**: 8.5×11", 8×10", 6×9"
- **Interior PDF**: Pages with correct margins, bleed area, page numbers
- **Cover PDF**: Front cover with title/author, spine (auto-calculated from page count), back cover
- **ZIP Package**: Interior PDF + Cover PDF + README with KDP upload instructions
- **Single-sided printing**: Blank backs for coloring books

### 4. Templates Library

10 pre-built templates covering popular activity book categories:

| Template | Category | Age | Pages |
|----------|---------|-----|-------|
| Animals Coloring (2-4) | Coloring | 2-4 | 50 |
| Animals Coloring (4-6) | Coloring | 4-6 | 50 |
| Alphabet Tracing | Tracing | 3-5 | 26 |
| Numbers 1-20 | Educational | 3-5 | 40 |
| Dinosaurs | Coloring | 4-7 | 50 |
| Unicorns & Fairies | Coloring | 3-6 | 50 |
| Vehicles | Coloring | 3-6 | 50 |
| Ocean Animals | Coloring | 4-7 | 50 |
| Flowers & Nature | Coloring | 4-8 | 50 |
| Islamic Patterns | Coloring | 5-10 | 40 |

### 5. BYOK (Bring Your Own Key)

Use your own AI provider API keys for image generation:

- **Supported providers**: OpenAI, Stability AI, Replicate, Fal.ai
- **AES-256 encryption**: Keys encrypted at rest with `ENCRYPTION_KEY`
- **Key validation**: Tests connection before saving
- **Usage tracking**: Per-key usage count and last-used timestamps
- **Duplicate detection**: Prevents adding the same key twice

### 6. Subscription & Credits System

Stripe-powered SaaS subscription model:

| Plan | Price | Credits/mo | Books | Batch | Cover Designer |
|------|------:|:----------:|:-----:|:-----:|:--------------:|
| Free | $0 | 10 | 1 | ❌ | ❌ |
| Starter | $9 | 100 | 10 | ❌ | ❌ |
| Pro | $29 | 500 | ∞ | 50/batch | ✅ |
| Unlimited | $79 | ∞ | ∞ | 100/batch | ✅ |

- Stripe Checkout for payment
- Stripe Customer Portal for plan management
- Webhook handling for subscription lifecycle events
- Credit balance tracking with usage history

### 7. Authentication

- **Email/Password**: Registration with bcrypt hashing (12 rounds)
- **Google OAuth**: One-click sign in
- **Session Management**: NextAuth v5 with JWT strategy
- **Role-based Access**: `user` and `admin` roles

### 8. Admin Dashboard

- **User Management**: List, search, view details, update roles/credits/plans
- **Analytics**: Total users, new users (7d/30d), users by plan, MRR
- **Generation Stats**: Total generations, 30-day trend
- **Usage Breakdown**: By provider, credit consumption

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/hanzlahabib/kids-book-creator.git
cd kids-book-creator

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Initialize database
npx prisma generate
npx prisma db push

# Seed plans and templates
npx prisma db seed

# Start development server
pnpm dev
```

The app runs at **http://localhost:3003**.

### Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | SQLite file path (e.g., `file:./prisma/data/app.db`) |
| `NEXTAUTH_SECRET` | ✅ | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | App URL (e.g., `http://localhost:3003`) |
| `ENCRYPTION_KEY` | ✅ | 32-char key for BYOK encryption (`openssl rand -hex 16`) |
| `OPENAI_API_KEY` | 📋 | For AI generation (or use BYOK) |
| `STRIPE_SECRET_KEY` | 📋 | For subscriptions |
| `STRIPE_PUBLISHABLE_KEY` | 📋 | For Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | 📋 | For webhook verification |
| `GOOGLE_CLIENT_ID` | ⬜ | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ⬜ | For Google OAuth |

✅ = Required, 📋 = Recommended, ⬜ = Optional

---

## 📡 API Reference

The app exposes **23 REST API endpoints** across 9 resource groups. All endpoints return JSON. See [API_DOCS.md](API_DOCS.md) for full request/response details.

### Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/auth/signup` | — | Register new account |
| `*` | `/api/auth/[...nextauth]` | — | NextAuth handlers |
| `GET` | `/api/books` | ✅ | List all books |
| `POST` | `/api/books` | ✅ | Create a book |
| `GET` | `/api/books/:id` | ✅ | Get book details |
| `PUT` | `/api/books/:id` | ✅ | Update a book |
| `DELETE` | `/api/books/:id` | ✅ | Delete a book |
| `POST` | `/api/books/:id/pages` | ✅ | Add pages to book |
| `PUT` | `/api/books/:id/pages` | ✅ | Reorder pages |
| `GET` | `/api/pages/:id` | ✅ | Get page details |
| `PUT` | `/api/pages/:id` | ✅ | Update a page |
| `DELETE` | `/api/pages/:id` | ✅ | Delete a page |
| `POST` | `/api/generate` | ✅ | Generate AI images |
| `GET` | `/api/generate` | ✅ | Generation history |
| `POST` | `/api/export` | ✅ | Export book as PDF |
| `GET` | `/api/templates` | — | List templates |
| `GET` | `/api/plans` | — | List pricing plans |
| `GET` | `/api/stats` | ✅ | Dashboard statistics |
| `GET` | `/api/credits` | ✅ | Credit balance |
| `POST` | `/api/credits` | ✅ | Deduct credits |
| `GET` | `/api/keys` | ✅ | List API keys |
| `POST` | `/api/keys` | ✅ | Add API key |
| `DELETE` | `/api/keys/:id` | ✅ | Delete API key |
| `GET` | `/api/subscription` | ✅ | Current subscription |
| `PATCH` | `/api/subscription` | ✅ | Update preferences |
| `POST` | `/api/subscription/checkout` | ✅ | Stripe checkout |
| `POST` | `/api/subscription/portal` | ✅ | Stripe portal |
| `GET` | `/api/admin/users` | 🔒 | List users (admin) |
| `GET` | `/api/admin/users/:id` | 🔒 | User details (admin) |
| `PUT` | `/api/admin/users/:id` | 🔒 | Update user (admin) |
| `GET` | `/api/admin/analytics` | 🔒 | Analytics (admin) |

🔒 = Admin only

Interactive API docs available at `/api-docs` (Swagger UI).

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

**13 tests** across 4 suites:
- Auth signup API (4 tests)
- Books CRUD API (3 tests)
- Stats API (1 test)
- Rate limiting utility (5 tests)

---

## 🔒 Security

- **Rate Limiting**: In-memory per-user rate limiting on critical endpoints
  - `/api/generate`: 10 req/min
  - `/api/auth/signup`: 5 req/min
  - `/api/export`: 5 req/min
- **Input Validation**: Zod schemas on all POST/PUT endpoints
- **Environment Validation**: Startup checks prevent dev secrets in production
- **API Key Encryption**: AES-256 encryption for stored BYOK keys
- **Password Hashing**: bcrypt with 12 salt rounds
- **CSRF Protection**: Built-in via NextAuth

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Sign in/up pages
│   ├── (dashboard)/     # All dashboard pages
│   │   ├── admin/       # Admin dashboard
│   │   ├── books/       # Book list, editor, new
│   │   ├── dashboard/   # Main dashboard
│   │   ├── export/      # PDF export
│   │   ├── generate/    # AI generation
│   │   ├── settings/    # API keys, preferences
│   │   └── templates/   # Template browser
│   └── api/             # 23 REST endpoints
├── components/
│   ├── book-editor/     # Page grid, sortable, add-pages dialog
│   ├── layout/          # Sidebar, topbar
│   └── ui/              # shadcn/ui primitives
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Prisma client
│   ├── encryption.ts    # AES-256 for BYOK keys
│   ├── env.ts           # Env validation
│   ├── features.ts      # Plan feature gating
│   ├── rate-limit.ts    # Rate limiter
│   ├── stripe.ts        # Stripe client
│   ├── utils.ts         # Utilities
│   └── validations.ts   # Zod schemas
├── services/
│   ├── ai/              # AI providers + prompt builder
│   │   └── providers/   # OpenAI, Replicate, Stability, Fal
│   └── pdf/             # PDF generation (interior + cover)
└── types/               # Shared TypeScript types
```

---

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | ESLint |
| `npx prisma db seed` | Seed plans and templates |
| `npx prisma db push` | Push schema to database |
| `npx prisma studio` | Open Prisma Studio |

---

## 📄 License

MIT © [Hanzla Habib](https://github.com/hanzlahabib)
