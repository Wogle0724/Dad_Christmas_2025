# Dad Dashboard 🎄

A personalized dashboard for Dad to stay organized and up to date on everything important.

## Features

- 🔐 **Secure Login** - Password-protected dashboard
- 🌤️ **Weather Updates** - Real-time San Diego weather
- ⚾ **MLB/Padres Updates** - Latest San Diego Padres game information
- 📝 **Sticky Notes** - Add colorful notes and reminders that look like real sticky notes
- 💬 **Messages** - Public message form for friends and family to send messages
- 💪 **Daily Motivation** - Inspiring daily messages to start the day right

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add:
   - `DASHBOARD_PASSWORD` - Set your desired login password
   - (Optional) Supabase credentials if you want to use a database

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup (Optional)

The app works with localStorage by default, but you can set up Supabase for persistent storage:

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the SQL from `supabase-schema.sql`
4. Go to Settings > API and copy your URL and anon key
5. Add them to your `.env.local` file

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel's project settings
4. Deploy!

## Usage

### For Dad (Logged In):
- Visit the site and click "Login"
- Enter the password set in `DASHBOARD_PASSWORD`
- View weather, sports, notes, and messages
- Add sticky notes with different colors
- View and manage messages from friends and family

### For Friends/Family (Not Logged In):
- Visit the site and click "Send a Message"
- Enter your name and message
- Message will appear in Dad's dashboard under the Messages tab

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** (Optional) - Database
- **Lucide React** - Icons

## Project Structure

```
├── app/
│   ├── dashboard/     # Main dashboard page
│   ├── login/         # Login page
│   ├── send-message/  # Public message form
│   └── page.tsx       # Home page
├── components/        # React components
│   ├── WeatherWidget.tsx
│   ├── SportsWidget.tsx
│   ├── StickyNotes.tsx
│   ├── MessagesTab.tsx
│   └── DailyMotivation.tsx
└── lib/              # Utilities
    ├── auth.ts       # Authentication helpers
    └── supabase.ts   # Database client
```

## Customization

- **Change the password**: Update `DASHBOARD_PASSWORD` in `.env.local`
- **Modify daily motivations**: Edit the `MOTIVATIONS` array in `components/DailyMotivation.tsx`
- **Change colors**: Update Tailwind classes in components
- **Add more widgets**: Create new components and add them to the dashboard

## Notes

- The app uses localStorage as a fallback if Supabase isn't configured
- Weather data comes from wttr.in (free, no API key needed)
- MLB data comes from the official MLB Stats API
- All data persists between sessions when using Supabase

## License

Made with ❤️ for Dad

