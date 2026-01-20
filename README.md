# Infinity Tournament Manager

A blazing-fast, offline-first tournament management platform for Infinity: The Game and other tabletop wargames.

## Features

- **Offline-First Architecture** - Works without internet, syncs when online
- **Real-Time Updates** - Live standings and match results
- **Hidden Information Tracking** - Track classifieds, hidden deployment, data trackers
- **Army List Validation** - Automatic parsing and validation of army lists
- **Player Statistics** - Career stats, faction breakdowns, head-to-head records
- **Spectator Mode** - Live page with OBS overlay support
- **Admin Dashboard** - Platform management and user administration
- **Push Notifications** - Get notified when pairings are posted

## Quick Start

### Windows

Double-click `setup.bat` or run:

```bash
node scripts/setup.js
```

### Manual Setup

```bash
# Install dependencies
pnpm install

# Build shared package
pnpm build:shared

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm** - `npm install -g pnpm`
- **Supabase Project** - [Create free project](https://supabase.com)

## Configuration

1. Copy `.env.local.example` to `.env.local`
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

Run these migrations in your Supabase SQL Editor (in order):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_game_systems.sql`
3. `supabase/migrations/003_list_validation.sql`
4. `supabase/migrations/004_admin_dashboard.sql`
5. `supabase/migrations/005_notifications.sql`

## Deployment

### Quick Deploy (Vercel)

```bash
# Windows
deploy.bat

# Or using npm scripts
pnpm deploy
```

### Manual Deployment

```bash
# Check environment
pnpm deploy:check

# Build application
pnpm deploy:build

# Deploy to Vercel
pnpm deploy:vercel
```

## Project Structure

```
infinity-tournament/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (public)/        # Public pages (events, standings)
│   │   ├── admin/           # Admin dashboard
│   │   ├── dashboard/       # Player dashboard
│   │   └── to/              # Tournament organizer pages
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and business logic
│   └── types/               # TypeScript types
├── packages/
│   └── shared/              # Shared business logic (offline sync, game systems)
├── public/                  # Static assets and service worker
├── supabase/
│   └── migrations/          # Database migrations
└── scripts/                 # Build and deploy scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm setup` | First-time setup wizard |
| `pnpm deploy` | Check and build for deployment |
| `pnpm deploy:vercel` | Deploy to Vercel |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Offline**: Dexie.js (IndexedDB)
- **Auth**: Supabase Auth

## Roadmap

- [x] Phase 0: Foundation (Offline-first + Game System Plugins)
- [x] Phase 1: Real-time & Polish
- [x] Phase 2: Hidden Information Tracking
- [x] Phase 3: List Validation
- [x] Phase 4: Player Statistics
- [x] Phase 5: Notifications
- [x] Phase 6: Spectator Mode
- [ ] Phase 7: Payment Processing (Stripe)
- [x] Phase 8: Admin Dashboard
- [ ] Phase 9: AI Chat Interface
- [ ] Phase 10: Testing & CI/CD
- [ ] Phase 11: Mobile App (Expo)

## License

Private - All rights reserved
