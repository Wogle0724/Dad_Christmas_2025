# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, React, TypeScript, Tailwind CSS, and other dependencies.

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Dashboard Password (change this!)
DASHBOARD_PASSWORD=dad2025

# Optional: Supabase Configuration
# If you want to use a database, sign up at https://supabase.com
# and add your credentials here:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Google Calendar Integration
# See GOOGLE_CALENDAR_SETUP.md for detailed instructions
# GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
# GOOGLE_CALENDAR_ID=primary
```

**Important:** Change the `DASHBOARD_PASSWORD` to something secure!

## Step 3: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: (Optional) Set Up Supabase Database

The app works with localStorage by default, but for persistent storage across devices:

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to the SQL Editor
4. Copy and paste the contents of `supabase-schema.sql`
5. Run the SQL
6. Go to Settings > API
7. Copy your Project URL and anon public key
8. Add them to your `.env.local` file

## That's It!

- Visit the homepage to see "Login" and "Send a Message" options
- Use the password you set in `DASHBOARD_PASSWORD` to log in
- Start adding notes, checking weather, and viewing messages!

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables in the project settings
4. Deploy!

The TypeScript errors you see before running `npm install` are normal - they'll be resolved once dependencies are installed.

