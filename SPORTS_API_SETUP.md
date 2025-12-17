# Sports News API Setup (Optional)

The sports widget currently uses the MLB API (which is free and doesn't require a key) for Padres game information. For news articles, you have a few options:

## Option 1: NewsAPI (Recommended for News)

1. Sign up for a free account at [newsapi.org](https://newsapi.org)
2. Get your API key from the dashboard
3. Add to your `.env.local`:
   ```
   NEXT_PUBLIC_NEWS_API_KEY=your_api_key_here
   ```

4. Update `components/SportsWidget.tsx` to use NewsAPI:
   ```typescript
   const newsResponse = await fetch(
     `https://newsapi.org/v2/everything?q=San+Diego+Padres&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}&sortBy=publishedAt&pageSize=5`
   );
   ```

## Option 2: ESPN API (If Available)

ESPN has an API but it may require approval. Check their developer portal.

## Option 3: RSS Feeds

You can use RSS feeds from sports news sites:
- San Diego Union-Tribune Sports RSS
- ESPN RSS feeds
- MLB.com RSS feeds

## Current Implementation

The current implementation uses:
- **MLB Stats API** (free, no key needed) for game scores and schedules
- **Mock news data** as placeholder

To add real news, integrate one of the options above in the `fetchSportsData` function in `components/SportsWidget.tsx`.

