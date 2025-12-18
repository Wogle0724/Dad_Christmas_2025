import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  description?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const calendarIdsParam = searchParams.get('calendarIds');
    const accessToken = searchParams.get('accessToken');
    
    if (!calendarIdsParam) {
      return NextResponse.json(
        { error: 'No calendar IDs provided' },
        { status: 400 }
      );
    }

    const calendarIds = JSON.parse(calendarIdsParam) as string[];
    
    if (!Array.isArray(calendarIds) || calendarIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid calendar IDs' },
        { status: 400 }
      );
    }

    // Use OAuth token if provided, otherwise fall back to API key
    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    const useOAuth = !!accessToken;

    if (!useOAuth && !apiKey) {
      return NextResponse.json(
        { error: 'No authentication method configured. Please connect your Google account or configure an API key.' },
        { status: 500 }
      );
    }

    // Get current date and 30 days ahead
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch events from all specified calendars
    const fetchPromises = calendarIds.map(async (calendarId) => {
      try {
        let url: string;
        let headers: HeadersInit = {};
        
        if (useOAuth) {
          // Use OAuth token
          url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`;
          headers = {
            'Authorization': `Bearer ${accessToken}`,
          };
        } else {
          // Use API key (for public calendars)
          url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`;
        }
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching calendar ${calendarId}:`, errorText);
          return { calendarId, events: [], error: errorText };
        }

        const data = await response.json();
        
        // Transform events to a simpler format
        const events = (data.items || []).map((event: CalendarEvent) => ({
          id: `${calendarId}-${event.id}`, // Make IDs unique across calendars
          title: event.summary || 'No Title',
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          location: event.location || '',
          description: event.description || '',
          isAllDay: !event.start.dateTime,
          calendarId, // Track which calendar this event came from
        }));

        return { calendarId, events, error: null };
      } catch (error) {
        console.error(`Error fetching calendar ${calendarId}:`, error);
        return { 
          calendarId, 
          events: [], 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Combine all events and sort by start time
    const allEvents = results.flatMap(result => result.events);
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Get errors for calendars that failed
    const errors = results
      .filter(result => result.error)
      .map(result => ({ calendarId: result.calendarId, error: result.error }));

    return NextResponse.json({ 
      events: allEvents.slice(0, 50), // Limit total events
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

