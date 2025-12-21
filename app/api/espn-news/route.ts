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
    const limit = searchParams.get('limit') || '100';

    console.log(`[ESPN News API] Fetching news for sport=${sport}, league=${league}, teamId=${teamId}, limit=${limit}`);

    // Get team info if teamId is provided (to filter articles)
    let teamInfo: any = null;
    let teamSearchTerms: string[] = [];
    
    if (teamId) {
      try {
        const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}`;
        const teamResponse = await fetch(teamUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
          },
        });

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          teamInfo = teamData.team;
          
          // Build search terms from team info
          if (teamInfo) {
            if (teamInfo.displayName) teamSearchTerms.push(teamInfo.displayName);
            if (teamInfo.name) teamSearchTerms.push(teamInfo.name);
            if (teamInfo.shortDisplayName) teamSearchTerms.push(teamInfo.shortDisplayName);
            if (teamInfo.location) teamSearchTerms.push(teamInfo.location);
            if (teamInfo.abbreviation) teamSearchTerms.push(teamInfo.abbreviation);
            // Add common variations (e.g., "Padres" from "San Diego Padres")
            if (teamInfo.displayName) {
              const parts = teamInfo.displayName.split(' ');
              parts.forEach((part: string) => {
                if (part.length > 3) teamSearchTerms.push(part);
              });
            }
          }
          
          console.log(`[ESPN News API] Team info loaded:`, {
            displayName: teamInfo?.displayName,
            abbreviation: teamInfo?.abbreviation,
            searchTerms: teamSearchTerms,
          });
        }
      } catch (error) {
        console.log(`[ESPN News API] Error fetching team info:`, error);
        // Continue without team info - will just return all league news
      }
    }

    // Fetch league-wide news (this is the only endpoint that works)
    let data: any = null;
    let lastError: Error | null = null;
    
    const leagueEndpoints = [
      `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news`, // No limit - get all available articles
    ];

    for (const url of leagueEndpoints) {
      try {
        console.log(`[ESPN News API] Fetching league-wide news from: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
          },
        });

        if (!response.ok) {
          console.log(`[ESPN News API] League endpoint returned status ${response.status}: ${url}`);
          continue;
        }

        const leagueData = await response.json();
        console.log(`[ESPN News API] Successfully fetched league-wide news from: ${url}`);
        console.log(`[ESPN News API] Response keys:`, Object.keys(leagueData));
        
        // Check for articles
        const hasArticles = leagueData.articles || leagueData.headlines || leagueData.items || 
                           (Array.isArray(leagueData) && leagueData.length > 0);
        
        if (hasArticles) {
          const articleCount = leagueData.articles?.length || leagueData.headlines?.length || 
                             leagueData.items?.length || (Array.isArray(leagueData) ? leagueData.length : 0);
          console.log(`[ESPN News API] Found ${articleCount} league-wide articles`);
          data = leagueData;
          break;
        }
      } catch (error) {
        console.log(`[ESPN News API] Error with league endpoint ${url}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    if (!data) {
      throw lastError || new Error('Failed to fetch league news');
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

    // Helper function to check if article is about the team
    const isArticleAboutTeam = (article: any): boolean => {
      if (teamSearchTerms.length === 0) return false;
      
      // Build comprehensive search text from all article fields
      const searchText = [
        article.headline || '',
        article.title || '',
        article.name || '',
        article.description || '',
        article.summary || '',
        article.byline || '',
      ].join(' ').toLowerCase();
      
      // Check if any team search term appears in the article
      // Use word boundaries for better matching (avoid partial matches)
      return teamSearchTerms.some(term => {
        const lowerTerm = term.toLowerCase().trim();
        if (lowerTerm.length < 2) return false;
        
        // Check for exact word match or phrase match
        // For longer terms (like "San Diego Padres"), check for phrase
        // For shorter terms (like "SD"), check for word boundary
        if (lowerTerm.length >= 5) {
          // Longer terms: check for phrase match
          return searchText.includes(lowerTerm);
        } else {
          // Shorter terms: check for word boundary match
          const regex = new RegExp(`\\b${lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return regex.test(searchText);
        }
      });
    };

    // Separate articles into team-related and other
    const teamArticles: any[] = [];
    const otherArticles: any[] = [];
    
    articles.forEach((article: any) => {
      if (isArticleAboutTeam(article)) {
        teamArticles.push(article);
      } else {
        otherArticles.push(article);
      }
    });

    console.log(`[ESPN News API] Filtered articles: ${teamArticles.length} team-related, ${otherArticles.length} other`);
    
    // Log first few team articles for verification
    if (teamArticles.length > 0) {
      console.log(`[ESPN News API] First team article:`, teamArticles[0].headline || teamArticles[0].title);
    }
    if (otherArticles.length > 0) {
      console.log(`[ESPN News API] First other article:`, otherArticles[0].headline || otherArticles[0].title);
    }

    // Combine: team articles first, then others (no limit - return all articles)
    const prioritizedArticles = [
      ...teamArticles,
      ...otherArticles
    ];
    
    console.log(`[ESPN News API] Final prioritized articles: ${prioritizedArticles.length} total (${teamArticles.length} team-first, ${otherArticles.length} other)`);

    // Transform the data to a consistent format
    const transformedArticles = prioritizedArticles.map((article: any, index: number) => {
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

