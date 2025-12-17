# ESPN API Endpoints Guide

ESPN provides public APIs that don't require authentication. These are **unofficial/undocumented** APIs, so they may change without notice. Use with caution.

## Base URL
```
https://site.api.espn.com/apis/site/v2/sports/
```

## MLB/Baseball Endpoints

### 1. Scoreboard (Today's Games)
**Endpoint:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard
```

**Query Parameters:**
- `dates` - Date range (e.g., `20241201-20241231`)
- `limit` - Number of results

**Example Response Structure:**
```json
{
  "events": [
    {
      "id": "401570123",
      "name": "Padres at Dodgers",
      "date": "2024-12-15T19:10Z",
      "competitions": [
        {
          "competitors": [
            {
              "id": "25",
              "team": {
                "id": "25",
                "abbreviation": "SD",
                "displayName": "San Diego Padres",
                "logo": "https://a.espncdn.com/i/teamlogos/mlb/500/sd.png"
              },
              "score": "5",
              "homeAway": "away"
            },
            {
              "id": "19",
              "team": {
                "id": "19",
                "abbreviation": "LAD",
                "displayName": "Los Angeles Dodgers",
                "logo": "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png"
              },
              "score": "3",
              "homeAway": "home"
            }
          ],
          "status": {
            "type": {
              "completed": true,
              "description": "Final"
            },
            "period": 9
          }
        }
      ]
    }
  ]
}
```

### 2. Team Schedule
**Endpoint:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/{teamId}/schedule
```

**Team IDs:**
- San Diego Padres: `25`
- Los Angeles Chargers (NFL): `24`

**Example:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/25/schedule
```

### 3. Team Information
**Endpoint:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/{teamId}
```

**Example Response:**
```json
{
  "team": {
    "id": "25",
    "uid": "s:1~l:10~t:25",
    "slug": "san-diego-padres",
    "abbreviation": "SD",
    "displayName": "San Diego Padres",
    "shortDisplayName": "Padres",
    "name": "Padres",
    "location": "San Diego",
    "color": "2F2419",
    "alternateColor": "FFC425",
    "logo": "https://a.espncdn.com/i/teamlogos/mlb/500/sd.png",
    "record": {
      "items": [
        {
          "summary": "82-80",
          "stats": [
            {
              "name": "wins",
              "value": 82
            },
            {
              "name": "losses",
              "value": 80
            }
          ]
        }
      ]
    }
  }
}
```

### 4. Game Summary (Detailed)
**Endpoint:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event={eventId}
```

**Example:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=401570123
```

## News Endpoints

### 1. MLB News
**Endpoint:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news
```

**Query Parameters:**
- `limit` - Number of articles (default: 50)

**Example Response:**
```json
{
  "articles": [
    {
      "headline": "Padres clinch playoff berth with walk-off win",
      "description": "The San Diego Padres secured their playoff spot...",
      "link": "https://www.espn.com/mlb/story/_/id/...",
      "images": [
        {
          "url": "https://a.espncdn.com/...",
          "width": 1200,
          "height": 675
        }
      ],
      "published": "2024-12-15T10:30:00Z",
      "byline": "ESPN News Services"
    }
  ]
}
```

### 2. Team-Specific News
**Endpoint:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/{teamId}/news
```

**Example:**
```
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/25/news
```

## NFL Endpoints (for Chargers)

### 1. NFL Scoreboard
```
https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
```

### 2. Team Schedule
```
https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/24/schedule
```

### 3. Team News
```
https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/24/news
```

## Implementation Example

Here's how you could integrate ESPN API into your SportsWidget:

```typescript
// Fetch Padres news from ESPN
const fetchPadresNews = async () => {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/25/news?limit=5'
    );
    const data = await response.json();
    
    return data.articles?.map((article: any) => ({
      title: article.headline,
      url: article.links?.web?.href || article.link,
      publishedAt: article.published,
      image: article.images?.[0]?.url,
    })) || [];
  } catch (error) {
    console.error('Error fetching ESPN news:', error);
    return [];
  }
};

// Fetch Padres schedule
const fetchPadresSchedule = async () => {
  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${today}`
    );
    const data = await response.json();
    
    // Find Padres game
    const padresGame = data.events?.find((event: any) => 
      event.competitions?.[0]?.competitors?.some((comp: any) => 
        comp.team?.abbreviation === 'SD'
      )
    );
    
    return padresGame;
  } catch (error) {
    console.error('Error fetching Padres schedule:', error);
    return null;
  }
};
```

## Important Notes

1. **No Authentication Required** - These endpoints are publicly accessible
2. **Rate Limiting** - Be respectful with requests; don't spam the API
3. **Unofficial** - These APIs are not officially documented and may change
4. **CORS** - You may need to use a proxy or make requests from your backend
5. **Error Handling** - Always wrap API calls in try-catch blocks

## CORS Workaround - Using Next.js API Routes

I've created API routes in this project to handle ESPN API calls and avoid CORS issues:

### 1. News API Route
**File:** `app/api/espn-news/route.ts`

**Usage:**
```typescript
// Fetch Padres news
const response = await fetch('/api/espn-news?sport=baseball&league=mlb&teamId=25&limit=5');
const { articles } = await response.json();

// Fetch Chargers news
const response = await fetch('/api/espn-news?sport=football&league=nfl&teamId=24&limit=5');
const { articles } = await response.json();
```

### 2. Scoreboard API Route
**File:** `app/api/espn-scoreboard/route.ts`

**Usage:**
```typescript
// Fetch today's MLB games
const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
const response = await fetch(`/api/espn-scoreboard?sport=baseball&league=mlb&dates=${today}`);
const { events } = await response.json();
```

### Example Integration in SportsWidget

Here's how you could update your `SportsWidget.tsx` to use ESPN news:

```typescript
// Fetch Padres news from ESPN via API route
const fetchPadresNews = async () => {
  try {
    const response = await fetch('/api/espn-news?sport=baseball&league=mlb&teamId=25&limit=5');
    const { articles } = await response.json();
    
    return articles.map((article: any) => ({
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  } catch (error) {
    console.error('Error fetching Padres news:', error);
    return [];
  }
};

// In your fetchSportsData function:
const news = await fetchPadresNews();

teams.push({
  name: 'San Diego Padres',
  game: gameData || undefined,
  news,
});
```

