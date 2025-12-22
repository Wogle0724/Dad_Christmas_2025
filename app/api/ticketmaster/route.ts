import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Ticketmaster Discovery API Proxy
 * Fetches concerts/events from Ticketmaster API to avoid CORS issues
 * 
 * Usage:
 * GET /api/ticketmaster?city=San Diego&stateCode=CA&size=10
 * GET /api/ticketmaster?lat=32.7157&lon=-117.1611&radius=50&size=10
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const stateCode = searchParams.get('stateCode');
    const countryCode = searchParams.get('countryCode') || 'US';
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius') || '50'; // miles
    const size = searchParams.get('size') || '20';
    const keyword = searchParams.get('keyword'); // For artist/genre search
    const classificationName = searchParams.get('classificationName'); // e.g., "music", "sports"
    
    const apiKey = process.env.TICKETMASTER_API_KEY;
    
    if (!apiKey) {
      console.error('[Ticketmaster API] No API key found in environment variables');
      return NextResponse.json(
        { error: 'Ticketmaster API key not configured', events: [] },
        { status: 500 }
      );
    }

    // Build URL with query parameters
    const baseUrl = 'https://app.ticketmaster.com/discovery/v2/events.json';
    
    // Get current date for filtering (we'll filter client-side to be safe)
    const now = new Date();
    
    const params = new URLSearchParams({
      apikey: apiKey,
      size: size,
      sort: 'date,asc', // Sort by date, ascending (upcoming first)
    });
    
    // Note: startDateTime parameter can be unreliable with Ticketmaster API
    // We'll filter past events client-side instead for better reliability

    // Add location parameters
    if (lat && lon) {
      params.append('latlong', `${lat},${lon}`);
      params.append('radius', radius);
      params.append('unit', 'miles');
    } else if (city) {
      params.append('city', city);
      if (stateCode) {
        params.append('stateCode', stateCode);
      }
      params.append('countryCode', countryCode);
    }

    // Add keyword/artist search
    if (keyword) {
      params.append('keyword', keyword);
    }

    // Filter for music events
    if (classificationName) {
      params.append('classificationName', classificationName);
    } else {
      // Default to music events
      params.append('classificationName', 'music');
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log(`[Ticketmaster API] Fetching events from: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DadDashboard/1.0)',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Ticketmaster API] Error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `Ticketmaster API error: ${response.status}`, events: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log(`[Ticketmaster API] Response structure:`, {
      hasEmbedded: !!data._embedded,
      hasEvents: !!data._embedded?.events,
      eventCount: data._embedded?.events?.length || 0,
      pageInfo: data.page,
    });
    
    // Check if API returned an error
    if (data.errors) {
      console.error(`[Ticketmaster API] API returned errors:`, data.errors);
    }

    // Transform the data to a consistent format and filter out past events
    // Reuse the `now` variable declared earlier
    const events = (data._embedded?.events || [])
      .map((event: any) => {
      // Get venue information
      const venue = event._embedded?.venues?.[0];
      const venueName = venue?.name || 'TBD';
      const venueCity = venue?.city?.name || '';
      const venueState = venue?.state?.stateCode || '';
      const venueAddress = venue?.address?.line1 || '';
      
      // Get date/time
      const startDate = event.dates?.start?.dateTime || event.dates?.start?.localDate || '';
      const timeZone = event.dates?.timezone || event.dates?.start?.timezone || '';
      
      // Get image
      const image = event.images?.find((img: any) => img.width > 200 && img.ratio === '16_9')?.url 
        || event.images?.[0]?.url 
        || '';

      // Get classifications (genre)
      const classifications = event.classifications || [];
      const genre = classifications.find((c: any) => c.primary)?.genre?.name 
        || classifications.find((c: any) => c.primary)?.segment?.name 
        || 'Music';

      // Get attractions (artists)
      const attractions = event._embedded?.attractions || [];
      const artist = attractions.find((a: any) => a.classifications?.[0]?.primary)?.name 
        || attractions[0]?.name 
        || event.name;

      return {
        id: event.id,
        name: event.name,
        artist: artist,
        genre: genre,
        url: event.url,
        image: image,
        venue: {
          name: venueName,
          city: venueCity,
          state: venueState,
          address: venueAddress,
        },
        date: startDate,
        timeZone: timeZone,
        priceRange: event.priceRanges?.[0] 
          ? {
              min: event.priceRanges[0].min,
              max: event.priceRanges[0].max,
              currency: event.priceRanges[0].currency || 'USD',
            }
          : undefined,
      };
    })
    .filter((event: any) => {
      // Double-check: filter out any past events that might have slipped through
      try {
        const eventDate = new Date(event.date);
        // Include events that are today or in the future (with 1 hour buffer for timezone issues)
        return eventDate.getTime() >= (now.getTime() - 60 * 60 * 1000);
      } catch {
        // If date parsing fails, include it (better to show than hide)
        return true;
      }
    });

    console.log(`[Ticketmaster API] Returning ${events.length} transformed events (past events filtered out)`);

    return NextResponse.json({ events, total: data.page?.totalElements || events.length });
  } catch (error) {
    console.error('[Ticketmaster API] Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', events: [] },
      { status: 500 }
    );
  }
}

