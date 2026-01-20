# Infinity Tournament Manager - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name:** infinity-tournament (or whatever you want)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to you
4. Click "Create new project" and wait for setup (~2 minutes)

---

## Step 2: Run Database Migration

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **+ New query**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the ENTIRE contents of that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)

You should see "Success. No rows returned" - this is expected.

### Verify Tables Created

Go to **Table Editor** in the sidebar. You should see these tables:
- users
- tournaments
- registrations
- rounds
- matches

---

## Step 3: Get Your API Keys

1. In Supabase dashboard, go to **Settings** (gear icon) → **API**
2. You'll see:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

---

## Step 4: Configure Environment

1. In the project folder, copy the example file:

```bash
cp .env.local.example .env.local
```

Or on Windows:
```cmd
copy .env.local.example .env.local
```

2. Edit `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-key-here
```

---

## Step 5: Run the App

```bash
npm run dev
```

Open http://localhost:3000

---

## Step 6: Create a Test Account

1. Go to http://localhost:3000/register
2. Create an account with any email/password

### Make Yourself a Tournament Organizer

To create tournaments, you need the "to" role. In Supabase:

1. Go to **Table Editor** → **users**
2. Find your user row
3. Click to edit and change `role` from `player` to `to`
4. Save

Now you can access `/to` and create tournaments!

---

## Troubleshooting

### "Invalid API key" or auth errors
- Double-check your `.env.local` values have no extra spaces
- Make sure you're using the **anon** key, not the service_role key
- Restart the dev server after changing `.env.local`

### SQL migration fails
- Make sure you copied the ENTIRE file contents
- Run it in a fresh SQL Editor tab
- Check for any error messages in red

### Tables not showing up
- Refresh the Supabase dashboard
- Check the **Table Editor** section specifically

### Can't create tournaments
- Verify your user has `role: to` in the users table
- Log out and back in after changing the role

---

## Optional: Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

---

## Project Structure Quick Reference

```
src/app/
├── (auth)/login, register     # Auth pages
├── (public)/events/           # Browse tournaments
├── dashboard/                 # Player dashboard
└── to/                        # Tournament Organizer pages

Key files:
- supabase/migrations/001_initial_schema.sql  # Database schema
- .env.local                                   # Your API keys (create this)
- src/lib/supabase/                           # Supabase client setup
```
