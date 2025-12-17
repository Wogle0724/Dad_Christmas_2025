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

    let url: string;
    
    if (teamId) {
      // Team-specific news
      url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/news?limit=${limit}`;
    } else {
      // General league news
      url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news?limit=${limit}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to a consistent format
    const articles = data.articles?.map((article: any) => ({
      title: article.headline,
      description: article.description,
      url: article.links?.web?.href || article.link || `https://www.espn.com${article.links?.web?.href}`,
      publishedAt: article.published,
      image: article.images?.[0]?.url,
      byline: article.byline,
    })) || [];

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching ESPN news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', articles: [] },
      { status: 500 }
    );
  }
}

