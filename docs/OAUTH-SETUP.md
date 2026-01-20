# OAuth Setup Guide

## Google OAuth

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API

### 2. Create OAuth Credentials
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: Web application
4. Authorized redirect URIs:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`

### 3. Configure Supabase
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Enter Client ID and Client Secret from Google

### 4. Environment Variables
No additional env vars needed - Supabase handles OAuth internally.

## Discord OAuth

(To be added in C-002)

## Testing OAuth

1. Start dev server: `npm run dev`
2. Go to login page
3. Click "Sign in with Google"
4. Verify redirect and login work
