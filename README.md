# 📚 Kids Book Creator

AI-powered platform for creating children's activity books (coloring, tracing, workbooks) ready for Amazon KDP publishing.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20%2B-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)

## ✨ Features

- **AI Page Generation** - Create coloring book pages using DALL-E 3 or BYOK providers
- **Multi-Provider Support** - OpenAI, Replicate, Stability AI, Fal.ai
- **Book Management** - Drag-and-drop page organization
- **KDP-Ready Export** - PDF generation with correct dimensions and bleeds
- **Template Library** - 10+ starter templates for quick book creation
- **Subscription System** - Credits-based with Stripe integration
- **BYOK Mode** - Bring Your Own Key for API providers

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm
- OpenAI API key (or use BYOK with other providers)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd kids-book-creator/app

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

### Configure Environment

Edit `.env` with your values:

```env
# Required
DATABASE_URL=file:./data/app.db
OPENAI_API_KEY=sk-your-openai-key
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3003

# Optional - Encryption for BYOK
ENCRYPTION_KEY=<run: openssl rand -hex 16>
```

### Initialize Database

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm prisma db push
```

### Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3003](http://localhost:3003) in your browser.

### Seed Initial Data

After first run, seed templates and plans:

```bash
# In browser or curl:
# POST http://localhost:3003/api/templates/seed
# POST http://localhost:3003/api/plans/seed
```

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Auth pages (signin, signup)
│   ├── (dashboard)/     # Main app pages
│   │   ├── generate/    # AI page generation
│   │   ├── books/       # Book management
│   │   ├── templates/   # Template browser
│   │   ├── settings/    # User settings
│   │   └── admin/       # Admin dashboard
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components
│   └── book-editor/     # Book editor components
├── services/
│   ├── ai/              # AI provider integrations
│   └── pdf/             # PDF generation
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma client
│   ├── encryption.ts    # Key encryption
│   └── stripe.ts        # Stripe integration
└── types/               # TypeScript definitions
```

## 🎨 Usage

### 1. Generate Pages
1. Go to "Generate" page
2. Select theme (Animals, Alphabet, Numbers, etc.)
3. Choose age group and quantity
4. Click "Generate Pages"
5. Download or add to book

### 2. Create a Book
1. Go to "Books" → "New Book"
2. Enter title and select theme
3. Add pages from generator
4. Drag to reorder pages
5. Preview the book

### 3. Export for KDP
1. Open your book
2. Select trim size (8.5x11, 8x10, 6x9)
3. Click "Export PDF"
4. Download ZIP with interior + cover PDFs

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path |
| `OPENAI_API_KEY` | Yes* | OpenAI API key (*or use BYOK) |
| `NEXTAUTH_SECRET` | Yes | Random 32-char secret |
| `NEXTAUTH_URL` | Yes | App URL (localhost:3003 for dev) |
| `ENCRYPTION_KEY` | For BYOK | 32-char hex for key encryption |
| `STRIPE_*` | For payments | Stripe keys and webhook secret |
| `GOOGLE_CLIENT_*` | Optional | Google OAuth credentials |

### Stripe Setup (Optional)

1. Create Stripe account
2. Create products/prices for each plan
3. Add price IDs to `.env`
4. Set up webhook endpoint: `/api/webhooks/stripe`
5. Seed plans: `POST /api/plans/seed`

## 📖 API Endpoints

### Public
- `POST /api/auth/signup` - Create account
- `POST /api/generate` - Generate images (with auth for tracking)

### Protected
- `GET/POST /api/books` - Book CRUD
- `GET/PUT/DELETE /api/books/:id` - Single book
- `POST /api/export` - Export PDF
- `GET/POST /api/keys` - API key management

### Admin
- `GET /api/admin/users` - User list
- `GET /api/admin/analytics` - Platform stats

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite + Prisma
- **Auth:** NextAuth v5
- **Payments:** Stripe
- **UI:** Tailwind CSS + shadcn/ui
- **AI:** OpenAI DALL-E 3 + multi-provider
- **PDF:** pdf-lib

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel
```

Set environment variables in Vercel dashboard.

### Docker

```bash
docker build -t kids-book-creator .
docker run -p 3003:3003 kids-book-creator
```

### Manual

```bash
pnpm build
pnpm start
```

## 📋 KDP Specifications

| Trim Size | Interior | Cover |
|-----------|----------|-------|
| 8.5" x 11" | Letter size | Calculated with spine |
| 8" x 10" | Standard | Calculated with spine |
| 6" x 9" | Trade | Calculated with spine |

- Spine width: `pageCount / 444` inches (white paper)
- Bleed: 0.125" on all sides
- Minimum 24 pages

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [OpenAI](https://openai.com/) - Image generation
- [pdf-lib](https://pdf-lib.js.org/) - PDF generation

---

**Made with ❤️ for creators and publishers**
