import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ESPN News API Proxy
 * Fetches news from ESPN API to avoid CORS issues
 * 
 * Usage:
 * GET /api/espn-news?sport=baseball&league=mlb&teamId=25
 * GET /api/espn-news?sport=football&league=nfl&teamId=24
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport') || 'baseball';
    const league = searchParams.get('league') || 'mlb';
    const teamId = searchParams.get('teamId');
    const limit = searchParams.get('limit') || '5';

    console.log(`[ESPN News API] Fetching news for sport=${sport}, league=${league}, teamId=${teamId}, limit=${limit}`);

    // Try multiple endpoint formats
    const endpoints: string[] = [];
    
    if (teamId) {
      // Try team-specific endpoints first, but fallback to league-wide
      endpoints.push(
        `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/news?limit=${limit}`,
        `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/news`
      );
    }
    
    // Always include league-wide news as fallback (this endpoint actually works)
    endpoints.push(
      `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news?limit=${limit}`,
      `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news`
    );

    let data: any = null;
    let lastError: Error | null = null;
    let successfulUrl: string | null = null;

    // Try each endpoint until one works
    for (const url of endpoints) {
      try {
        console.log(`[ESPN News API] Trying endpoint: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
          },
        });

        if (!response.ok) {
          console.log(`[ESPN News API] Endpoint returned status ${response.status}: ${url}`);
          continue;
        }

        data = await response.json();
        successfulUrl = url;
        console.log(`[ESPN News API] Successfully fetched from: ${url}`);
        console.log(`[ESPN News API] Response keys:`, Object.keys(data));
        
        // Check for articles in various possible locations
        const hasArticles = data.articles || data.headlines || data.items || (Array.isArray(data) && data.length > 0);
        
        if (hasArticles) {
          // Check if response is empty object (team-specific endpoints often return {})
          if (Object.keys(data).length === 0) {
            console.log(`[ESPN News API] Empty response from: ${url}, trying next endpoint`);
            continue;
          }
          
          const articleCount = data.articles?.length || data.headlines?.length || data.items?.length || (Array.isArray(data) ? data.length : 0);
          console.log(`[ESPN News API] Found ${articleCount} articles in response`);
          if (articleCount > 0) {
            console.log(`[ESPN News API] First article sample:`, JSON.stringify(
              data.articles?.[0] || data.headlines?.[0] || data.items?.[0] || data[0],
              null, 2
            ).substring(0, 500));
          }
          break;
        } else {
          console.log(`[ESPN News API] No articles found in response from: ${url}`);
          // If it's an empty object, log that
          if (Object.keys(data).length === 0) {
            console.log(`[ESPN News API] Response is empty object {}`);
          } else {
            console.log(`[ESPN News API] Response structure:`, JSON.stringify(data, null, 2).substring(0, 500));
          }
        }
      } catch (error) {
        console.log(`[ESPN News API] Error with endpoint ${url}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    if (!data) {
      throw lastError || new Error('All endpoints failed');
    }

    // Try to extract articles from various possible response structures
    let articles: any[] = [];
    
    // Structure 1: data.articles
    if (data.articles && Array.isArray(data.articles)) {
      console.log(`[ESPN News API] Found ${data.articles.length} articles in data.articles`);
      articles = data.articles;
    }
    // Structure 2: data.headlines
    else if (data.headlines && Array.isArray(data.headlines)) {
      console.log(`[ESPN News API] Found ${data.headlines.length} articles in data.headlines`);
      articles = data.headlines;
    }
    // Structure 3: data.items
    else if (data.items && Array.isArray(data.items)) {
      console.log(`[ESPN News API] Found ${data.items.length} articles in data.items`);
      articles = data.items;
    }
    // Structure 4: data is an array
    else if (Array.isArray(data)) {
      console.log(`[ESPN News API] Response is an array with ${data.length} items`);
      articles = data;
    }
    // Structure 5: Check nested structures
    else if (data.sports?.[0]?.leagues?.[0]?.teams?.[0]?.news) {
      console.log(`[ESPN News API] Found articles in nested structure`);
      articles = data.sports[0].leagues[0].teams[0].news;
    }
    // Structure 6: Check for team.news
    else if (data.team?.news) {
      console.log(`[ESPN News API] Found articles in team.news`);
      articles = data.team.news;
    }

    console.log(`[ESPN News API] Extracted ${articles.length} articles`);
    if (articles.length > 0) {
      console.log(`[ESPN News API] First article sample:`, JSON.stringify(articles[0], null, 2));
    }

    // Transform the data to a consistent format
    const transformedArticles = articles.map((article: any, index: number) => {
      // Log the structure of each article to understand the format
      if (index === 0) {
        console.log(`[ESPN News API] Article structure (first article):`, {
          keys: Object.keys(article),
          headline: article.headline,
          title: article.title,
          name: article.name,
          description: article.description,
          link: article.link,
          links: article.links,
          url: article.url,
          published: article.published,
          publishedAt: article.publishedAt,
          images: article.images,
        });
      }

      // Try multiple possible field names for title (headline is the primary field from ESPN)
      const title = article.headline || article.title || article.name || 'Untitled';
      
      // Try multiple possible field names for URL (links.web.href is the primary field from ESPN)
      let url = article.url;
      if (!url && article.links) {
        url = article.links.web?.href || article.links.web || article.links.espn?.href || article.links.espn;
      }
      if (!url && article.link) {
        url = article.link;
      }
      if (!url && article.href) {
        url = article.href;
      }
      // If URL is relative, make it absolute
      if (url && !url.startsWith('http')) {
        url = `https://www.espn.com${url.startsWith('/') ? url : '/' + url}`;
      }
      // Ensure we have a valid URL - construct from article ID if available
      if (!url && article.id) {
        url = `https://www.espn.com/${sport}/${league}/story/_/id/${article.id}`;
      }

      // Try multiple possible field names for published date (published is the primary field from ESPN)
      const publishedAt = article.published || article.publishedAt || article.date || article.createdAt || article.lastModified || new Date().toISOString();

      // Try multiple possible field names for image
      let image: string | undefined;
      if (article.images && Array.isArray(article.images) && article.images.length > 0) {
        image = article.images[0].url || article.images[0].href;
      } else if (article.image) {
        image = article.image.url || article.image.href || article.image;
      } else if (article.thumbnail) {
        image = article.thumbnail.url || article.thumbnail.href || article.thumbnail;
      }

      return {
        title,
        description: article.description || article.summary || '',
        url: url || '#',
        publishedAt,
        image,
        byline: article.byline || '',
      };
    });

    console.log(`[ESPN News API] Returning ${transformedArticles.length} transformed articles`);
    console.log(`[ESPN News API] Sample transformed article:`, transformedArticles[0]);

    return NextResponse.json({ articles: transformedArticles });
  } catch (error) {
    console.error('[ESPN News API] Error fetching ESPN news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', articles: [] },
      { status: 500 }
    );
  }
}

