'use client';

import { useEffect, useState, useCallback } from 'react';
import { Music, Calendar, MapPin, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDataCache } from '@/lib/DataCacheContext';

interface ConcertEvent {
  id: string;
  name: string;
  artist: string;
  genre: string;
  url: string;
  image?: string;
  venue: {
    name: string;
    city: string;
    state: string;
    address: string;
  };
  date: string;
  timeZone?: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

interface ConcertsData {
  events: ConcertEvent[];
  timestamp: number;
}

const CACHE_STALENESS_DURATION = 60 * 60 * 1000; // 1 hour for concerts

export default function ConcertsWidget() {
  const { concertPreferences } = useDataCache();
  const [loading, setLoading] = useState(true);
  const [concerts, setConcerts] = useState<ConcertsData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchConcerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Use location from preferences or geolocation
      if (concertPreferences.location.lat && concertPreferences.location.lon) {
        params.append('lat', concertPreferences.location.lat.toString());
        params.append('lon', concertPreferences.location.lon.toString());
        params.append('radius', '50');
      } else if (concertPreferences.location.city) {
        params.append('city', concertPreferences.location.city);
        if (concertPreferences.location.stateCode) {
          params.append('stateCode', concertPreferences.location.stateCode);
        }
      } else {
        // Default to San Diego
        params.append('city', 'San Diego');
        params.append('stateCode', 'CA');
      }
      
      params.append('size', '50'); // Fetch more to have enough for filtering

      // Fetch all concerts
      const allEvents: ConcertEvent[] = [];
      
      // First, fetch concerts for favorite artists
      if (concertPreferences.favoriteArtists.length > 0) {
        for (const artist of concertPreferences.favoriteArtists) {
          const artistParams = new URLSearchParams(params);
          artistParams.append('keyword', artist);
          
          try {
            const response = await fetch(`/api/ticketmaster?${artistParams.toString()}`, { cache: 'no-store' });
            if (!response.ok) {
              console.error(`[ConcertsWidget] Error fetching concerts for artist ${artist}: ${response.status} ${response.statusText}`);
              continue;
            }
            const data = await response.json();
            if (data.error) {
              console.error(`[ConcertsWidget] API error for artist ${artist}:`, data.error);
              continue;
            }
            if (data.events && data.events.length > 0) {
              console.log(`[ConcertsWidget] Found ${data.events.length} concerts for artist ${artist}`);
              allEvents.push(...data.events);
            } else {
              console.log(`[ConcertsWidget] No concerts found for artist ${artist}`);
            }
          } catch (err) {
            console.error(`[ConcertsWidget] Error fetching concerts for artist ${artist}:`, err);
          }
        }
      }
      
      // Also fetch general concerts to fill in the rest
      try {
        const response = await fetch(`/api/ticketmaster?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) {
          console.error(`[ConcertsWidget] Error fetching general concerts: ${response.status} ${response.statusText}`);
        } else {
          const data = await response.json();
          if (data.error) {
            console.error(`[ConcertsWidget] API error for general concerts:`, data.error);
          } else if (data.events && data.events.length > 0) {
            console.log(`[ConcertsWidget] Found ${data.events.length} general concerts`);
            allEvents.push(...data.events);
          } else {
            console.log(`[ConcertsWidget] No general concerts found`);
          }
        }
      } catch (err) {
        console.error('[ConcertsWidget] Error fetching general concerts:', err);
      }
      
      if (allEvents.length === 0) {
        setError('No concerts found');
        setConcerts({ events: [], timestamp: Date.now() });
        setLoading(false);
        return;
      }
      
      // Remove duplicates
      const uniqueEvents = Array.from(
        new Map(allEvents.map(event => [event.id, event])).values()
      );
      
      // Filter out past concerts - only show future concerts
      const now = new Date();
      const upcomingEvents = uniqueEvents.filter(event => {
        try {
          const eventDate = new Date(event.date);
          // Include events that are today or in the future (with 1 hour buffer for timezone issues)
          return eventDate.getTime() >= (now.getTime() - 60 * 60 * 1000);
        } catch {
          // If date parsing fails, include it (better to show than hide)
          return true;
        }
      });
      
      console.log(`[ConcertsWidget] Filtered ${uniqueEvents.length - upcomingEvents.length} past concerts, ${upcomingEvents.length} upcoming`);
      
      // Sort and prioritize: favorite artists first, then favorite genres, then everything else
      const favoriteArtistsLower = concertPreferences.favoriteArtists.map(a => a.toLowerCase());
      const favoriteGenresLower = concertPreferences.favoriteGenres.map(g => g.toLowerCase());
      
      // Calculate priority for each event (lower number = higher priority)
      const getEventPriority = (event: ConcertEvent): number => {
        const artistMatch = favoriteArtistsLower.some(artist =>
          event.artist.toLowerCase().includes(artist) || event.name.toLowerCase().includes(artist)
        );
        const genreMatch = favoriteGenresLower.some(genre =>
          event.genre.toLowerCase().includes(genre)
        );
        
        if (artistMatch) return 1; // Highest priority - favorite artists
        if (genreMatch) return 2;  // Second priority - favorite genres
        return 3; // Lowest priority - everything else
      };
      
      const sortedEvents = upcomingEvents.sort((a, b) => {
        const aPriority = getEventPriority(a);
        const bPriority = getEventPriority(b);
        
        // First, sort by priority (favorite artists/genres first)
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If same priority, sort by date (upcoming first)
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      setConcerts({ events: sortedEvents, timestamp: Date.now() });
    } catch (err) {
      console.error('Error fetching concerts:', err);
      setError('Failed to load concerts');
      setConcerts({ events: [], timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  }, [concertPreferences]);

  useEffect(() => {
    // Check if this is a page reload
    const lastLoadTime = sessionStorage.getItem('last_page_load');
    const isPageReload = lastLoadTime !== null;
    
    // On page reload, clear cache and fetch fresh data
    if (isPageReload) {
      console.log('[ConcertsWidget] Page reload detected - clearing cache for fresh data');
      localStorage.removeItem('cached_concerts');
      fetchConcerts();
      return;
    }
    
    // Check cache first (only on initial load, not reload)
    const cached = localStorage.getItem('cached_concerts');
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      if (age < CACHE_STALENESS_DURATION) {
        // Also filter out any past concerts from cached data
        const now = new Date();
        const upcomingEvents = (data.events || []).filter((event: ConcertEvent) => {
          try {
            const eventDate = new Date(event.date);
            return eventDate.getTime() >= (now.getTime() - 60 * 60 * 1000);
          } catch {
            return true;
          }
        });
        
        if (upcomingEvents.length > 0) {
          setConcerts({ ...data, events: upcomingEvents });
          setLoading(false);
          return;
        }
        // If all cached events are past, fetch fresh
      }
    }
    
    fetchConcerts();
  }, [fetchConcerts]);

  // Save to cache when concerts update
  useEffect(() => {
    if (concerts) {
      localStorage.setItem('cached_concerts', JSON.stringify(concerts));
    }
  }, [concerts]);

  const nextConcert = () => {
    if (!concerts) return;
    setCurrentIndex((prev) => (prev + 1) % concerts.events.length);
  };

  const prevConcert = () => {
    if (!concerts) return;
    setCurrentIndex((prev) => (prev - 1 + concerts.events.length) % concerts.events.length);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl shadow-md p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <div className="animate-pulse">
          <div className="h-5 bg-white/30 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-white/30 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl shadow-md p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4" />
          <h2 className="text-lg font-semibold">Concerts</h2>
        </div>
        <p className="text-sm opacity-90">{error}</p>
        {error.includes('API key') && (
          <p className="text-xs opacity-75 mt-2">
            Please configure TICKETMASTER_API_KEY in your environment variables.
          </p>
        )}
      </div>
    );
  }

  if (!concerts || concerts.events.length === 0) {
    return (
      <div className="rounded-xl shadow-md p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4" />
          <h2 className="text-lg font-semibold">Concerts</h2>
        </div>
        <p className="text-sm opacity-90">No upcoming concerts found. Check your location settings.</p>
      </div>
    );
  }

  const currentConcert = concerts.events[currentIndex];

  return (
    <div className="rounded-xl shadow-md p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4" />
          <h2 className="text-lg font-semibold">Concerts</h2>
        </div>
        {concerts.events.length > 1 && (
          <div className="flex gap-1">
            <button
              onClick={prevConcert}
              className="p-1 rounded transition-colors opacity-80 hover:opacity-100"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
              aria-label="Previous concert"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextConcert}
              className="p-1 rounded transition-colors opacity-80 hover:opacity-100"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
              aria-label="Next concert"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-lg mb-1">{currentConcert.name}</h3>
          {currentConcert.artist && currentConcert.artist !== currentConcert.name && (
            <p className="text-sm opacity-90 mb-2">{currentConcert.artist}</p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold">{formatDate(currentConcert.date)}</div>
              {formatTime(currentConcert.date) && (
                <div className="opacity-80">{formatTime(currentConcert.date)}</div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold">{currentConcert.venue.name}</div>
              <div className="opacity-80">
                {currentConcert.venue.city}
                {currentConcert.venue.state && `, ${currentConcert.venue.state}`}
              </div>
            </div>
          </div>

          {currentConcert.priceRange && (
            <div className="opacity-90">
              <span className="font-semibold">Tickets: </span>
              {currentConcert.priceRange.currency === 'USD' ? '$' : currentConcert.priceRange.currency}
              {currentConcert.priceRange.min}
              {currentConcert.priceRange.max !== currentConcert.priceRange.min &&
                ` - $${currentConcert.priceRange.max}`}
            </div>
          )}

          {currentConcert.genre && (
            <div className="opacity-80 text-xs">
              <span className="font-semibold">Genre: </span>
              {currentConcert.genre}
            </div>
          )}
        </div>

        <a
          href={currentConcert.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
        >
          Get Tickets
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {concerts.events.length > 1 && (
        <div className="flex justify-center gap-1 mt-4 pt-3 border-t border-white/20">
          {concerts.events.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to concert ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

