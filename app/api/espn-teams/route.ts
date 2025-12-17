import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ESPN Teams API Proxy
 * Fetches all teams from ESPN API for various sports/leagues
 * 
 * Usage:
 * GET /api/espn-teams?sport=baseball&league=mlb
 * GET /api/espn-teams?sport=football&league=nfl
 * GET /api/espn-teams?sport=basketball&league=ncaam (college)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport') || 'baseball';
    const league = searchParams.get('league') || 'mlb';

    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform teams to a consistent format
    const teams = data.sports?.[0]?.leagues?.[0]?.teams?.map((team: any) => ({
      id: team.team?.id,
      name: team.team?.displayName || team.team?.name,
      abbreviation: team.team?.abbreviation,
      location: team.team?.location,
      logo: team.team?.logo,
      color: team.team?.color,
      alternateColor: team.team?.alternateColor,
      slug: team.team?.slug,
    })) || [];

    return NextResponse.json({ teams, sport, league });
  } catch (error) {
    console.error('Error fetching ESPN teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams', teams: [] },
      { status: 500 }
    );
  }
}

