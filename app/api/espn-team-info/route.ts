import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ESPN Team Info API Proxy
 * Fetches detailed team information including record and schedule
 * 
 * Usage:
 * GET /api/espn-team-info?sport=baseball&league=mlb&teamId=25
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport');
    const league = searchParams.get('league');
    const teamId = searchParams.get('teamId');

    if (!sport || !league || !teamId) {
      return NextResponse.json(
        { error: 'Missing required parameters', team: null },
        { status: 400 }
      );
    }

    // Fetch team info
    const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}`;
    const teamResponse = await fetch(teamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
      },
    });

    if (!teamResponse.ok) {
      throw new Error(`ESPN API error: ${teamResponse.status}`);
    }

    const teamData = await teamResponse.json();

    // Fetch schedule for upcoming games
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const startDate = today.toISOString().split('T')[0].replace(/-/g, '');
    const endDate = nextWeek.toISOString().split('T')[0].replace(/-/g, '');

    const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule?dates=${startDate}-${endDate}`;
    const scheduleResponse = await fetch(scheduleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
      },
    });

    let schedule = null;
    if (scheduleResponse.ok) {
      schedule = await scheduleResponse.json();
    }

    return NextResponse.json({
      team: teamData.team,
      schedule,
    });
  } catch (error) {
    console.error('Error fetching ESPN team info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info', team: null, schedule: null },
      { status: 500 }
    );
  }
}

