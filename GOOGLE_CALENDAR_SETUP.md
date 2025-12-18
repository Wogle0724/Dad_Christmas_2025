# Google Calendar Setup

This guide will help you set up Google Calendar integration for the dashboard.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in app name, user support email, and developer contact
   - Add scopes: `https://www.googleapis.com/auth/calendar.readonly`
   - Add test users if in testing mode
4. For OAuth client:
   - Application type: "Web application"
   - Name: "Dad Dashboard" (or your choice)
   - Authorized redirect URIs: `http://localhost:3000/api/google-oauth/callback` (for dev)
   - For production, add: `https://yourdomain.com/api/google-oauth/callback`
5. Click "Create" and copy the **Client ID** and **Client Secret**

## Step 3: (Optional) Create API Key for Public Calendars

If you want to support public calendars without OAuth:
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. (Optional but recommended) Click "Restrict Key" to:
   - Restrict to "Google Calendar API"
   - Add HTTP referrer restrictions for your domain

## Step 4: Add Credentials to Environment Variables

Add these to your `.env.local` file:

```bash
# Required for OAuth (private calendars)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-oauth/callback

# Optional: For public calendars only (without OAuth)
GOOGLE_CALENDAR_API_KEY=your_api_key_here
```

**Note:** 
- OAuth credentials are required for accessing private calendars
- API key is optional and only works for public calendars
- For production, update `GOOGLE_REDIRECT_URI` to your production domain

## Step 5: Add Calendar IDs in the Dashboard

1. Log into the dashboard
2. Click "Settings" in the top right
3. Go to the "Calendar" tab
4. Find your Calendar ID:
   - Go to [Google Calendar](https://calendar.google.com/)
   - Click the three dots (⋮) next to your calendar name
   - Select "Settings and sharing"
   - Scroll down to "Integrate calendar"
   - Copy the "Calendar ID" (usually your email address or `primary`)
5. Paste the Calendar ID into the input field and click "Add"
6. You can add multiple calendars - events from all of them will be displayed together

**Note:** 
- Use `primary` for your main calendar, or use a specific calendar ID
- For public calendars, you can use the calendar's public ID
- The calendar must be accessible (public or shared with the service account if using one)
- You can add multiple calendars and remove them at any time

## Step 6: Connect Google Account

1. Log into the dashboard
2. Go to Settings → Calendar
3. Click "Connect Google Account"
4. Sign in with your Google account and grant calendar access
5. You'll be redirected back to the dashboard

## Step 7: Test the Integration

1. Start your development server: `npm run dev`
2. Log into the dashboard
3. Go to Settings → Calendar and add at least one calendar ID
4. The calendar widget should appear and show your upcoming events from all configured calendars

## Troubleshooting

### "Google Calendar API key not configured"
- Make sure `GOOGLE_CALENDAR_API_KEY` is set in your `.env.local` file
- Restart your development server after adding environment variables

### "Failed to fetch calendar events"
- Verify your API key is correct
- Check that the Google Calendar API is enabled in your Google Cloud project
- Ensure your calendar ID is correct (try `primary` for your main calendar)
- Check that the calendar is accessible (not private/restricted)

### Events not showing
- Make sure you have upcoming events in your calendar
- The widget shows events for the next 30 days
- All-day events and timed events are both supported

## Security Notes

- **Never commit your API key to version control**
- The API key is used server-side only (in the API route)
- For production, consider using OAuth 2.0 for better security
- Restrict your API key to only the Google Calendar API and your domain

## Alternative: Using OAuth 2.0 (More Secure)

For production use, consider implementing OAuth 2.0 instead of API keys. This allows:
- User-specific calendar access
- Better security
- No need to share calendar access

This would require additional setup with Google OAuth 2.0 credentials.

