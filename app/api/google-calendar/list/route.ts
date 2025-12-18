import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = searchParams.get('accessToken');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      );
    }

    // Fetch user's calendar list
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching calendar list:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch calendar list', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract calendar IDs and names
    const calendars = (data.items || []).map((calendar: any) => ({
      id: calendar.id,
      summary: calendar.summary || calendar.id,
      primary: calendar.primary || false,
      accessRole: calendar.accessRole, // 'owner', 'reader', 'writer', etc.
    }));

    // Filter to only include calendars the user can read
    const readableCalendars = calendars.filter((cal: any) => 
      cal.accessRole === 'owner' || cal.accessRole === 'reader'
    );

    return NextResponse.json({ calendars: readableCalendars });
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

