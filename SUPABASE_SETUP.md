# Supabase Setup Guide

Follow these steps to set up Supabase for your Dad Dashboard:

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

## Step 2: Create a New Project

1. Once logged in, click "New Project"
2. Fill in the project details:
   - **Name**: `dad-dashboard` (or any name you prefer)
   - **Database Password**: Create a strong password (save this - you'll need it!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is fine for this project
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be provisioned

## Step 3: Get Your API Keys

1. Once your project is ready, go to **Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public key**: Copy this (long string starting with `eyJ...`)
   - **service_role key**: Copy this too (keep this secret! Only for server-side use)

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase-schema.sql` from this project
4. Copy the **entire contents** of that file
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this means the tables were created!

## Step 5: Add Environment Variables

1. In your project root, open or create `.env.local` file
2. Add these lines (replace with your actual values from Step 3):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Dashboard Password (will be stored in database)
DASHBOARD_PASSWORD=dad2025
```

**Important Notes:**
- Replace `xxxxx` with your actual project ID
- Replace the `eyJ...` keys with your actual keys from Supabase
- The `SUPABASE_SERVICE_ROLE_KEY` should be kept secret - never commit it to git
- Change `DASHBOARD_PASSWORD` to your desired password

## Step 6: Verify Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```
2. The app should now use Supabase instead of the JSON file
3. Check the browser console for any errors
4. Try logging in - it should work with your password

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists in the project root
- Make sure all three Supabase variables are set
- Restart your dev server after adding variables

### "relation does not exist" error
- Make sure you ran the SQL schema in Step 4
- Check the SQL Editor to see if tables were created
- Look for a `user_preferences` table in the Table Editor

### Can't see tables in Supabase
- Go to **Table Editor** in the left sidebar
- You should see: `messages`, `notes`, and `user_preferences` tables

### Password not working
- The password is stored in the database now
- If you had a password in the JSON file, it won't be migrated automatically
- You can update it via the dashboard settings, or directly in Supabase Table Editor

## Next Steps

Once everything is working:
- Your data is now stored in Supabase (cloud database)
- It will sync across all devices automatically
- You can view/edit data in the Supabase dashboard
- The JSON file (`data/user-data.json`) will no longer be used

