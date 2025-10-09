# Quick GitHub OAuth Setup

## The Problem
GitHub OAuth shows 404 error because the GitHub OAuth app isn't configured.

## Quick Fix (5 minutes)

### Step 1: Create GitHub OAuth App
1. Go to [GitHub.com](https://github.com) → Settings → Developer settings → OAuth Apps
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** `Water Tracker`
   - **Homepage URL:** `https://prjmobrshmcyqnhcqlvt.supabase.co`
   - **Authorization callback URL:** `https://prjmobrshmcyqnhcqlvt.supabase.co/auth/v1/callback`
4. Click **"Register application"**
5. **Copy the Client ID and Client Secret**

### Step 2: Configure Supabase
1. Go to [Supabase Dashboard](https://supabase.com) → Your Project
2. Go to **Authentication** → **Providers**
3. Find **GitHub** and toggle **"Enable GitHub provider"**
4. Enter:
   - **Client ID:** (from GitHub)
   - **Client Secret:** (from GitHub)
5. Click **Save**

### Step 3: Test
1. Restart your app
2. Click **"GitHub OAuth (Not Configured)"** button
3. Should redirect to GitHub and work!

## Alternative: Use Email Auth
The email authentication works immediately - just enter any email/password and sign in!

## Need Help?
- Check console logs for specific errors
- Verify URLs match exactly
- Make sure GitHub OAuth app is created
- Ensure Supabase GitHub provider is enabled
