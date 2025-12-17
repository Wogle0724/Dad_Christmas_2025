import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ESPN Scoreboard API Proxy
 * Fetches scoreboard data from ESPN API
 * 
 * Usage:
 * GET /api/espn-scoreboard?sport=baseball&league=mlb&dates=20241215
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport') || 'baseball';
    const league = searchParams.get('league') || 'mlb';
    const dates = searchParams.get('dates');
    
    let url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
    
    if (dates) {
      url += `?dates=${dates}`;
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
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ESPN scoreboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scoreboard', events: [] },
      { status: 500 }
    );
  }
}

