# Project Operational Guidelines

This file contains project-specific operational knowledge for the Infinity Tournament Manager.

## Project Info

- **Name:** Infinity Tournament Manager
- **Language:** TypeScript
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth

## Commands

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

### Lint
```bash
npm run lint
```

### Dev Server
```bash
npm run dev
```

### Type Check
```bash
npx tsc --noEmit
```

## Code Conventions

- **File naming:** kebab-case for files, PascalCase for components
- **Component location:** `src/components/` with subdirectories by domain
- **Route groups:** Use Next.js route groups `(auth)`, `(public)`, etc.
- **Import style:** Absolute imports from `@/` (maps to `src/`)
- **Form handling:** react-hook-form with zod validation
- **Data fetching:** Server components where possible, Supabase client for mutations

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (public)/          # Public routes (home, events)
│   ├── dashboard/         # Player dashboard
│   ├── to/                # TO management routes
│   └── api/               # API routes (if needed)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Auth-related components
│   ├── tournament/        # Tournament components
│   └── scoring/           # Score entry components
├── lib/
│   ├── supabase/          # Supabase client, helpers
│   ├── pairing/           # Swiss pairing algorithm
│   ├── scoring/           # ITS scoring calculations
│   └── utils.ts           # General utilities
└── types/                 # TypeScript type definitions
```

## Discovered Workflows

<!-- Add project-specific learnings here as you work -->

## Known Issues

<!-- Track issues that affect development -->

## Dependencies

| Package | Purpose |
|---------|---------|
| next | React framework with App Router |
| @supabase/supabase-js | Supabase client |
| @supabase/ssr | Server-side Supabase auth |
| tailwindcss | Utility-first CSS |
| shadcn/ui | Accessible UI components |
| react-hook-form | Form state management |
| zod | Schema validation |
| sonner | Toast notifications |
