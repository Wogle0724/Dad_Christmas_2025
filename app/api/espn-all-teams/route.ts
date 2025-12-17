import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Fetch all teams from multiple ESPN leagues
 * Returns teams organized by sport/league
 */
export async function GET() {
  try {
    const leagues = [
      { sport: 'baseball', league: 'mlb', name: 'MLB', type: 'pro' },
      { sport: 'football', league: 'nfl', name: 'NFL', type: 'pro' },
      { sport: 'basketball', league: 'nba', name: 'NBA', type: 'pro' },
      { sport: 'hockey', league: 'nhl', name: 'NHL', type: 'pro' },
      { sport: 'football', league: 'college-football', name: 'NCAA Football', type: 'college' },
      { sport: 'basketball', league: 'mens-college-basketball', name: 'NCAA Basketball', type: 'college' },
    ];

    const allTeams: any[] = [];

    for (const { sport, league, name, type } of leagues) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const teams = data.sports?.[0]?.leagues?.[0]?.teams?.map((team: any) => {
            const teamData = {
              id: team.team?.id,
              name: team.team?.displayName || team.team?.name,
              abbreviation: team.team?.abbreviation,
              location: team.team?.location,
              logo: team.team?.logo,
              color: team.team?.color,
              alternateColor: team.team?.alternateColor,
              slug: team.team?.slug,
              sport,
              league,
              leagueName: name,
              type, // 'pro' or 'college'
            };
            
            return teamData;
          }) || [];

          allTeams.push(...teams);
        }
      } catch (error) {
        console.error(`Error fetching ${league} teams:`, error);
        // Continue with other leagues
      }
    }

    // Organize by city
    const teamsByCity: Record<string, any[]> = {};
    allTeams.forEach(team => {
      const city = team.location || 'Unknown';
      if (!teamsByCity[city]) {
        teamsByCity[city] = [];
      }
      teamsByCity[city].push(team);
    });

    return NextResponse.json({
      teams: allTeams,
      teamsByCity,
      total: allTeams.length,
    });
  } catch (error) {
    console.error('Error fetching all teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams', teams: [], teamsByCity: {} },
      { status: 500 }
    );
  }
}

