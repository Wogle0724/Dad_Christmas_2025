'use client';

import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { useDataCache } from '@/lib/DataCacheContext';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
  isAllDay: boolean;
  calendarId?: string;
}

export default function CalendarWidget() {
  const { calendarPreferences, setCalendarPreferences } = useDataCache();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset loading state when preferences change
    setLoading(true);
    setError(null);
    
    if (calendarPreferences.calendarIds.length > 0) {
      console.log('[CalendarWidget] Preferences changed, fetching events...', {
        calendarIds: calendarPreferences.calendarIds.length,
        hasAccessToken: !!calendarPreferences.accessToken,
        hasRefreshToken: !!calendarPreferences.refreshToken,
      });
      fetchCalendarEvents();
      // Refresh every 5 minutes
      const interval = setInterval(fetchCalendarEvents, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setError('No calendars configured. Add calendars in Settings → Calendar.');
    }
  }, [calendarPreferences.calendarIds, calendarPreferences.accessToken, calendarPreferences.refreshToken]);

  const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/google-oauth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.access_token;
    } catch (err) {
      console.error('Error refreshing token:', err);
      return null;
    }
  };

  const fetchCalendarEvents = async () => {
    if (calendarPreferences.calendarIds.length === 0) {
      setLoading(false);
      setError('No calendars configured');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[CalendarWidget] Fetching events...', {
        calendarIds: calendarPreferences.calendarIds,
        hasAccessToken: !!calendarPreferences.accessToken,
        tokenExpiry: calendarPreferences.tokenExpiry,
        currentTime: Date.now(),
        isExpired: calendarPreferences.tokenExpiry ? Date.now() >= calendarPreferences.tokenExpiry : false,
      });
      
      let accessToken = calendarPreferences.accessToken;
      
      // Check if token is expired and refresh if needed
      if (accessToken && calendarPreferences.tokenExpiry && Date.now() >= calendarPreferences.tokenExpiry) {
        console.log('[CalendarWidget] Token expired, refreshing...');
        if (calendarPreferences.refreshToken) {
          const newToken = await refreshAccessToken(calendarPreferences.refreshToken);
          if (newToken) {
            console.log('[CalendarWidget] Token refreshed successfully');
            accessToken = newToken;
            // Update preferences with new token
            const newExpiry = Date.now() + (3600 * 1000); // 1 hour
            setCalendarPreferences({
              ...calendarPreferences,
              accessToken: newToken,
              tokenExpiry: newExpiry,
            });
          } else {
            console.error('[CalendarWidget] Token refresh failed');
            // Refresh failed, user needs to reconnect
            setError('Session expired. Please reconnect your Google account in Settings → Calendar.');
            setLoading(false);
            return;
          }
        } else {
          console.error('[CalendarWidget] No refresh token available');
          setError('Session expired. Please reconnect your Google account in Settings → Calendar.');
          setLoading(false);
          return;
        }
      }
      
      const calendarIdsParam = encodeURIComponent(JSON.stringify(calendarPreferences.calendarIds));
      const url = accessToken 
        ? `/api/google-calendar?calendarIds=${calendarIdsParam}&accessToken=${encodeURIComponent(accessToken)}`
        : `/api/google-calendar?calendarIds=${calendarIdsParam}`;
      
      console.log('[CalendarWidget] Fetching from:', url.replace(accessToken || '', 'TOKEN_HIDDEN'));
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401 && accessToken) {
          // Token invalid, try to refresh
          if (calendarPreferences.refreshToken) {
            const newToken = await refreshAccessToken(calendarPreferences.refreshToken);
            if (newToken) {
              // Retry with new token
              const retryUrl = `/api/google-calendar?calendarIds=${calendarIdsParam}&accessToken=${encodeURIComponent(newToken)}`;
              const retryResponse = await fetch(retryUrl);
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                setEvents(retryData.events || []);
                setLoading(false);
                return;
              }
            }
          }
          throw new Error('Authentication failed. Please reconnect your Google account.');
        }
        throw new Error(data.error || 'Failed to fetch calendar events');
      }

      const data = await response.json();
      const fetchedEvents = data.events || [];
      console.log('[CalendarWidget] Fetched events:', fetchedEvents.length);
      setEvents(fetchedEvents);
      
      if (data.errors && data.errors.length > 0) {
        console.warn('[CalendarWidget] Some calendars failed to load:', data.errors);
      }
      
      if (fetchedEvents.length === 0 && calendarPreferences.calendarIds.length > 0) {
        console.warn('[CalendarWidget] No events found but calendars are configured');
      }
    } catch (err) {
      console.error('[CalendarWidget] Error fetching calendar:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string, isAllDay: boolean) => {
    const date = new Date(dateString);
    if (isAllDay) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isUpcoming = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date >= now;
  };

  // Filter to show only upcoming events
  const upcomingEvents = events
    .filter(event => isUpcoming(event.start))
    .slice(0, 10); // Show up to 10 events

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full flex flex-col min-h-[400px]">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Calendar</h2>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="animate-pulse w-full max-w-md space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || calendarPreferences.calendarIds.length === 0) {
    const hasNoCalendars = calendarPreferences.calendarIds.length === 0;
    const hasNoOAuth = !calendarPreferences.accessToken;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full flex flex-col min-h-[400px]">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Calendar</h2>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="text-center max-w-md space-y-4">
            <CalendarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto" />
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                {hasNoCalendars ? 'No Calendars Configured' : 'Calendar Setup Required'}
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3 text-left bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                {hasNoCalendars ? (
                  <>
                    <p className="font-medium">To get started:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Go to <strong>Settings → Calendar</strong></li>
                      <li>Connect your Google account</li>
                    </ol>
                  </>
                ) : hasNoOAuth ? (
                  <>
                    <p className="font-medium">Connect your Google account to access private calendars:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Go to <strong>Settings → Calendar</strong></li>
                      <li>Click &quot;Connect Google Account&quot;</li>
                      <li>Sign in and grant calendar access</li>
                      <li>You&apos;ll be redirected back to see your events</li>
                    </ol>
                    <p className="text-xs mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <strong>Note:</strong> Public calendars can work without OAuth, but connecting your account is recommended for full access.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Unable to load calendar events.</p>
                    <p className="text-xs">{error}</p>
                    <p className="text-xs mt-2">Try reconnecting your Google account in Settings → Calendar.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full flex flex-col min-h-[400px]">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Calendar</h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {upcomingEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming events</p>
              <p className="text-xs mt-2">Events from the next 30 days will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border ${
                  isToday(event.start)
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 flex-1">
                    {event.title}
                  </h3>
                  {isToday(event.start) && (
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-1 rounded">
                      Today
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {event.isAllDay 
                        ? formatDate(event.start, true)
                        : `${formatDate(event.start, false)} - ${formatTime(event.end)}`
                      }
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

