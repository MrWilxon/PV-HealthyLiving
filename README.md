# PV HealthyLiving - Calculator & Portfolio Management

A business management application for PV calculation and portfolio management.

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table
- React Hook Form + Zod
- Zustand (State Management)

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- npm or yarn

### Setup

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Configure database**
   
   Edit `backend/.env` with your PostgreSQL credentials:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/healthyliving"
   ```

3. **Setup database and seed data**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both backend (http://localhost:5000) and frontend (http://localhost:3000).

## Project Structure

```
PV HealthyLiving/
├── backend/                  # Express.js + Prisma
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed script
│   └── src/
│       ├── routes/           # API routes
│       ├── middleware/        # Error handling
│       └── utils/            # Calculations
├── frontend/                 # Next.js 15 + React 19
│   └── src/
│       ├── app/              # Pages (App Router)
│       ├── components/       # UI components
│       ├── stores/           # Zustand stores
│       ├── lib/              # API client, utils
│       └── types/            # TypeScript types
└── package.json              # Root workspace config
```

## Features

### Phase 1 (MVP) - Implemented
- [x] Product management (CRUD)
- [x] Category management
- [x] Product search and filtering
- [x] Portfolio creation
- [x] Add/remove products from portfolios
- [x] Quantity management with +/- controls
- [x] Automatic PV, DP, subtotal, VAT, and grand total calculations
- [x] Editable VAT percentage (0%, 10%, 13%, 15%, custom)
- [x] Portfolio save, edit, delete
- [x] Portfolio duplication
- [x] Dashboard with stats
- [x] Settings page

### Phase 2 (Planned)
- [ ] Import products from JSON/CSV/Excel
- [ ] Export portfolios to PDF/Excel/CSV
- [ ] Favorite products quick access
- [ ] Draft and archive portfolios
- [ ] Auto-save
- [ ] Undo/redo for portfolio changes

### Phase 3 (Future)
- [ ] User authentication and roles
- [ ] Cloud database synchronization
- [ ] Barcode/QR code product lookup
- [ ] Sales reports and analytics
- [ ] Mobile-responsive PWA
- [ ] Offline mode
- [ ] Multi-language support

## API Endpoints

### Products
- `GET /api/products` - List all (with filters)
- `GET /api/products/search?q=query` - Search products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PUT /api/products/:id/favorite` - Toggle favorite

### Categories
- `GET /api/categories` - List all
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `PUT /api/categories/:id/move` - Move products

### Portfolios
- `GET /api/portfolios` - List all
- `GET /api/portfolios/:id` - Get portfolio with items
- `POST /api/portfolios` - Create portfolio
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio
- `POST /api/portfolios/:id/duplicate` - Duplicate portfolio

### Portfolio Items
- `POST /api/portfolio/:portfolioId/items` - Add item
- `PUT /api/portfolio/items/:id` - Update item
- `DELETE /api/portfolio/items/:id` - Delete item

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Formulas

- **Product Total** = Quantity × DP
- **PV Total** = Quantity × PV
- **Subtotal** = Sum(Product Total)
- **VAT** = Subtotal × VAT%
- **Grand Total** = Subtotal + VAT

## Seed Data

The application comes pre-seeded with 29 products across 8 categories:
- Business Tools (2 products)
- Lips (6 products)
- Eyes (2 products)
- Face (3 products)
- Skin Formula 9 (9 products)
- Assure (3 products)
- Health Care (3 products)
- Consumables (3 products)
