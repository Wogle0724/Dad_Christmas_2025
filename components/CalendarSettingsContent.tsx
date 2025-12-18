'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, X, AlertCircle, CheckCircle, LogOut, Copy, Check } from 'lucide-react';
import { useDataCache } from '@/lib/DataCacheContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CalendarSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { calendarPreferences, setCalendarPreferences } = useDataCache();
  const [newCalendarId, setNewCalendarId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUserCalendars = async (accessToken: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/google-calendar/list?accessToken=${encodeURIComponent(accessToken)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendars');
      }

      const data = await response.json();
      // Return calendar IDs, prioritizing primary calendar
      const calendars = data.calendars || [];
      const primaryCalendar = calendars.find((cal: any) => cal.primary);
      const otherCalendars = calendars.filter((cal: any) => !cal.primary);
      
      // Return primary first, then others
      const calendarIds = primaryCalendar 
        ? [primaryCalendar.id, ...otherCalendars.map((cal: any) => cal.id)]
        : calendars.map((cal: any) => cal.id);
      
      return calendarIds;
    } catch (error) {
      console.error('Error fetching user calendars:', error);
      return [];
    }
  };

  const handleConnectGoogle = () => {
    setIsConnecting(true);
    window.location.href = '/api/google-oauth/authorize';
  };

  const handleDisconnectGoogle = () => {
    setCalendarPreferences({
      ...calendarPreferences,
      accessToken: undefined,
      refreshToken: undefined,
      tokenExpiry: undefined,
      // Optionally clear calendar IDs on disconnect, or keep them
      // calendarIds: [],
    });
  };

  // Handle OAuth callback
  useEffect(() => {
    const oauthSuccess = searchParams.get('oauth_success');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const expiresIn = searchParams.get('expires_in');
    const oauthError = searchParams.get('oauth_error');

    if (oauthError) {
      setError(`OAuth error: ${oauthError}`);
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('oauth_error');
      router.replace(newUrl.pathname + newUrl.search);
      return;
    }

    if (oauthSuccess && accessToken) {
      const expiryTime = Date.now() + (parseInt(expiresIn || '3600') * 1000);
      
      // Fetch user's calendars automatically
      fetchUserCalendars(accessToken).then((calendarIds) => {
        setCalendarPreferences({
          ...calendarPreferences,
          accessToken,
          refreshToken: refreshToken || calendarPreferences.refreshToken,
          tokenExpiry: expiryTime,
          calendarIds: calendarIds.length > 0 ? calendarIds : calendarPreferences.calendarIds,
        });
      }).catch((err) => {
        console.error('Error fetching calendars:', err);
        // Still save the token even if calendar fetch fails
        setCalendarPreferences({
          ...calendarPreferences,
          accessToken,
          refreshToken: refreshToken || calendarPreferences.refreshToken,
          tokenExpiry: expiryTime,
        });
      });
      
      // Clean up URL - remove OAuth params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('oauth_success');
      newUrl.searchParams.delete('access_token');
      newUrl.searchParams.delete('refresh_token');
      newUrl.searchParams.delete('expires_in');
      router.replace(newUrl.pathname + newUrl.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isConnected = !!calendarPreferences.accessToken;
  const isTokenExpired = calendarPreferences.tokenExpiry 
    ? Date.now() >= calendarPreferences.tokenExpiry 
    : false;

  const handleAddCalendar = () => {
    const trimmedId = newCalendarId.trim();
    
    if (!trimmedId) {
      setError('Please enter a calendar ID');
      return;
    }

    if (calendarPreferences.calendarIds.includes(trimmedId)) {
      setError('This calendar is already added');
      return;
    }

    setCalendarPreferences({
      calendarIds: [...calendarPreferences.calendarIds, trimmedId],
    });
    
    setNewCalendarId('');
    setError(null);
  };

  const handleRemoveCalendar = (calendarId: string) => {
    setCalendarPreferences({
      calendarIds: calendarPreferences.calendarIds.filter(id => id !== calendarId),
    });
  };

  const handleCopyCalendarId = async (calendarId: string) => {
    try {
      await navigator.clipboard.writeText(calendarId);
      setCopiedId(calendarId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar Integration
        </h3>

        {/* OAuth Connection Status */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">Google Account Connected</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isTokenExpired ? 'Token expired - please reconnect' : 'Access to private calendars enabled'}
                    </div>
                    {calendarPreferences.calendarIds.length > 0 && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ {calendarPreferences.calendarIds.length} calendar{calendarPreferences.calendarIds.length !== 1 ? 's' : ''} automatically added
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">Not Connected</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Connect to access private calendars
                    </div>
                  </div>
                </>
              )}
            </div>
            {isConnected ? (
              <button
                onClick={handleDisconnectGoogle}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Connect Google Account'}
              </button>
            )}
          </div>
          {!isConnected && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Connecting your Google account allows access to private calendars. Without connection, only public calendars can be accessed.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Configured Calendars ({calendarPreferences.calendarIds.length})
          </h4>
          
          {calendarPreferences.calendarIds.length === 0 ? (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center text-sm text-gray-500 dark:text-gray-400">
              No calendars added yet. Add a calendar ID above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {calendarPreferences.calendarIds.map((calendarId) => (
                <div
                  key={calendarId}
                  className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 min-w-0"
                >
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-mono break-all min-w-0 flex-1">
                    {calendarId}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleCopyCalendarId(calendarId)}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                      title="Copy calendar ID"
                    >
                      {copiedId === calendarId ? (
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveCalendar(calendarId)}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove calendar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

