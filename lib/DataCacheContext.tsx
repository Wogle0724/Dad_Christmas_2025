'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  location: string;
  timestamp: number;
}

interface Game {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  date: string;
  eventId?: string;
}

interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  image?: string;
}

interface TeamRecord {
  wins: number;
  losses: number;
  ties?: number;
  displayValue?: string;
}

interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  logo?: string;
  sport: string;
  league: string;
  leagueName: string;
  type: 'pro' | 'college';
  color?: string;
  alternateColor?: string;
  record?: TeamRecord;
  game?: Game;
  news?: NewsItem[];
}

interface SportsData {
  teams: TeamData[];
  timestamp: number;
}

interface TeamPreferences {
  selectedTeams: string[];
  favoriteTeams: string[];
}

interface AppearancePreferences {
  darkMode: boolean;
  showWeather: boolean;
  showSports: boolean;
  showNotes: boolean;
  showMotivation: boolean;
  showConcerts: boolean;
  showCalendar: boolean;
  dashboardName: string;
  widgetOrder: string[]; // Order of widgets: ['weather', 'sports', 'concerts', 'motivation']
  leftPanelOrder: string[]; // Order of left panel widgets: ['calendar', 'notes']
}

interface ConcertPreferences {
  favoriteArtists: string[];
  favoriteGenres: string[];
  location: {
    city?: string;
    stateCode?: string;
    lat?: number;
    lon?: number;
  };
}

interface CalendarPreferences {
  calendarIds: string[]; // Array of calendar IDs the user wants to display
  accessToken?: string; // OAuth access token
  refreshToken?: string; // OAuth refresh token
  tokenExpiry?: number; // Timestamp when token expires
}

interface DataCacheContextType {
  weather: WeatherData | null;
  sports: SportsData | null;
  teamPreferences: TeamPreferences;
  appearancePreferences: AppearancePreferences;
  concertPreferences: ConcertPreferences;
  calendarPreferences: CalendarPreferences;
  setWeather: (data: WeatherData) => void;
  setSports: (data: SportsData) => void;
  setTeamPreferences: (prefs: TeamPreferences) => void;
  setAppearancePreferences: (prefs: AppearancePreferences) => void;
  setConcertPreferences: (prefs: ConcertPreferences) => void;
  setCalendarPreferences: (prefs: CalendarPreferences) => void;
  refreshWeather: () => Promise<void>;
  refreshSports: () => Promise<void>;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [weather, setWeatherState] = useState<WeatherData | null>(null);
  const [sports, setSportsState] = useState<SportsData | null>(null);
  const [teamPreferences, setTeamPreferencesState] = useState<TeamPreferences>({
    selectedTeams: [],
    favoriteTeams: [],
  });
  const [appearancePreferences, setAppearancePreferencesState] = useState<AppearancePreferences>({
    darkMode: false,
    showWeather: true,
    showSports: true,
    showNotes: true,
    showMotivation: true,
    showConcerts: true,
    showCalendar: true,
    dashboardName: 'Dad Dashboard',
    widgetOrder: ['weather', 'sports', 'concerts', 'motivation'],
    leftPanelOrder: ['calendar', 'notes'],
  });
  const [concertPreferences, setConcertPreferencesState] = useState<ConcertPreferences>({
    favoriteArtists: [],
    favoriteGenres: [],
    location: {},
  });
  const [calendarPreferences, setCalendarPreferencesState] = useState<CalendarPreferences>({
    calendarIds: [],
  });

  useEffect(() => {
    // Detect page reload using sessionStorage
    const lastLoadTime = sessionStorage.getItem('last_page_load');
    const currentTime = Date.now();
    const isPageReload = lastLoadTime !== null;
    
    // Update session storage with current load time
    sessionStorage.setItem('last_page_load', currentTime.toString());
    
    // On page reload, clear cached data to force fresh API calls
    if (isPageReload) {
      console.log('[DataCache] Page reload detected - clearing cache for fresh data');
      localStorage.removeItem('cached_weather');
      localStorage.removeItem('cached_sports');
      localStorage.removeItem('cached_concerts');
      // Keep preferences (team selections, appearance, etc.) but clear data cache
      // Set state to null to force widgets to fetch fresh data
      setWeatherState(null);
      setSportsState(null);
    } else {
      // First load - load cached data if available
      const cachedWeather = localStorage.getItem('cached_weather');
      const cachedSports = localStorage.getItem('cached_sports');

      if (cachedWeather) {
        const data = JSON.parse(cachedWeather);
        const age = Date.now() - data.timestamp;
        if (age < CACHE_DURATION) {
          setWeatherState(data);
        }
      }

      if (cachedSports) {
        const data = JSON.parse(cachedSports);
        const age = Date.now() - data.timestamp;
        if (age < CACHE_DURATION) {
          setSportsState(data);
        }
      }
    }

    // Load preferences from server (universal across devices)
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user-data');
        if (response.ok) {
          const userData = await response.json();
          
          // Load team preferences
          if (userData.teamPreferences) {
            const prefs = userData.teamPreferences;
            // Migrate old format if needed
            const needsMigration = prefs.selectedTeams?.some((id: string) => !id.includes('-'));
            if (needsMigration) {
              const migratedPrefs: TeamPreferences = {
                selectedTeams: [],
                favoriteTeams: [],
              };
              setTeamPreferencesState(migratedPrefs);
              // Save migrated prefs back to server
              await fetch('/api/user-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section: 'teamPreferences', data: migratedPrefs }),
              });
            } else {
              setTeamPreferencesState(prefs);
            }
          } else {
            // Default: San Diego Padres
            const defaultPrefs: TeamPreferences = {
              selectedTeams: ['25-baseball-mlb'],
              favoriteTeams: ['25-baseball-mlb'],
            };
            setTeamPreferencesState(defaultPrefs);
            await fetch('/api/user-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ section: 'teamPreferences', data: defaultPrefs }),
            });
          }
          
          // Load appearance preferences
          if (userData.appearancePreferences) {
            const prefs = userData.appearancePreferences;
            setAppearancePreferencesState({
              darkMode: prefs.darkMode || false,
              showWeather: prefs.showWeather !== undefined ? prefs.showWeather : true,
              showSports: prefs.showSports !== undefined ? prefs.showSports : true,
              showNotes: prefs.showNotes !== undefined ? prefs.showNotes : true,
              showMotivation: prefs.showMotivation !== undefined ? prefs.showMotivation : true,
              showConcerts: prefs.showConcerts !== undefined ? prefs.showConcerts : true,
              showCalendar: prefs.showCalendar !== undefined ? prefs.showCalendar : true,
              dashboardName: prefs.dashboardName || 'Dad Dashboard',
              widgetOrder: prefs.widgetOrder || ['weather', 'sports', 'concerts', 'motivation'],
              leftPanelOrder: prefs.leftPanelOrder || (prefs.calendarNotesOrder === 'notes-first' ? ['notes', 'calendar'] : ['calendar', 'notes']),
            });
          }
          
          // Load concert preferences
          if (userData.concertPreferences) {
            setConcertPreferencesState(userData.concertPreferences);
          }
          
          // Load calendar preferences
          if (userData.calendarPreferences) {
            setCalendarPreferencesState(userData.calendarPreferences);
          }
        } else {
          // Fallback to localStorage for migration
          const cachedTeamPrefs = localStorage.getItem('team_preferences');
          const cachedAppearancePrefs = localStorage.getItem('appearance_preferences');
          const cachedConcertPrefs = localStorage.getItem('concert_preferences');
          const cachedCalendarPrefs = localStorage.getItem('calendar_preferences');
          
          if (cachedTeamPrefs) {
            const prefs = JSON.parse(cachedTeamPrefs);
            setTeamPreferencesState(prefs);
            // Migrate to server
            await fetch('/api/user-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ section: 'teamPreferences', data: prefs }),
            });
          }
          
          if (cachedAppearancePrefs) {
            const prefs = JSON.parse(cachedAppearancePrefs);
            setAppearancePreferencesState({
              darkMode: prefs.darkMode || false,
              showWeather: prefs.showWeather !== undefined ? prefs.showWeather : true,
              showSports: prefs.showSports !== undefined ? prefs.showSports : true,
              showNotes: prefs.showNotes !== undefined ? prefs.showNotes : true,
              showMotivation: prefs.showMotivation !== undefined ? prefs.showMotivation : true,
              showConcerts: prefs.showConcerts !== undefined ? prefs.showConcerts : true,
              showCalendar: prefs.showCalendar !== undefined ? prefs.showCalendar : true,
              dashboardName: prefs.dashboardName || 'Dad Dashboard',
              widgetOrder: prefs.widgetOrder || ['weather', 'sports', 'concerts', 'motivation'],
              leftPanelOrder: prefs.leftPanelOrder || (prefs.calendarNotesOrder === 'notes-first' ? ['notes', 'calendar'] : ['calendar', 'notes']),
            });
            // Migrate to server
            await fetch('/api/user-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ section: 'appearancePreferences', data: prefs }),
            });
          }
          
          if (cachedConcertPrefs) {
            const prefs = JSON.parse(cachedConcertPrefs);
            setConcertPreferencesState(prefs);
            await fetch('/api/user-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ section: 'concertPreferences', data: prefs }),
            });
          }
          
          if (cachedCalendarPrefs) {
            const prefs = JSON.parse(cachedCalendarPrefs);
            setCalendarPreferencesState(prefs);
            await fetch('/api/user-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ section: 'calendarPreferences', data: prefs }),
            });
          }
        }
      } catch (error) {
        console.error('Error loading preferences from server:', error);
        // Fallback to localStorage if server fails
        const cachedTeamPrefs = localStorage.getItem('team_preferences');
        const cachedAppearancePrefs = localStorage.getItem('appearance_preferences');
        const cachedConcertPrefs = localStorage.getItem('concert_preferences');
        const cachedCalendarPrefs = localStorage.getItem('calendar_preferences');
        
        if (cachedTeamPrefs) {
          setTeamPreferencesState(JSON.parse(cachedTeamPrefs));
        }
        if (cachedAppearancePrefs) {
          setAppearancePreferencesState(JSON.parse(cachedAppearancePrefs));
        }
        if (cachedConcertPrefs) {
          setConcertPreferencesState(JSON.parse(cachedConcertPrefs));
        }
        if (cachedCalendarPrefs) {
          setCalendarPreferencesState(JSON.parse(cachedCalendarPrefs));
        }
      }
    };
    
    loadPreferences();
  }, []);

  const setWeather = (data: WeatherData) => {
    setWeatherState(data);
    localStorage.setItem('cached_weather', JSON.stringify(data));
  };

  const setSports = (data: SportsData) => {
    setSportsState(data);
    localStorage.setItem('cached_sports', JSON.stringify(data));
  };

  const setTeamPreferences = (prefs: TeamPreferences | ((prev: TeamPreferences) => TeamPreferences)) => {
    const newPrefs = typeof prefs === 'function' ? prefs(teamPreferences) : prefs;
    setTeamPreferencesState(newPrefs);
    // Save to server (universal across devices) - fire and forget
    fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'teamPreferences', data: newPrefs }),
    }).catch((error) => {
      console.error('Error saving team preferences:', error);
      // Fallback to localStorage
      localStorage.setItem('team_preferences', JSON.stringify(newPrefs));
    });
  };

  const setAppearancePreferences = (prefs: AppearancePreferences | ((prev: AppearancePreferences) => AppearancePreferences)) => {
    const newPrefs = typeof prefs === 'function' ? prefs(appearancePreferences) : prefs;
    setAppearancePreferencesState(newPrefs);
    // Apply dark mode immediately
    if (typeof document !== 'undefined') {
      if (newPrefs.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Save to server (universal across devices) - fire and forget
    fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'appearancePreferences', data: newPrefs }),
    }).catch((error) => {
      console.error('Error saving appearance preferences:', error);
      // Fallback to localStorage
      localStorage.setItem('appearance_preferences', JSON.stringify(newPrefs));
    });
  };

  const setConcertPreferences = (prefs: ConcertPreferences | ((prev: ConcertPreferences) => ConcertPreferences)) => {
    const newPrefs = typeof prefs === 'function' ? prefs(concertPreferences) : prefs;
    setConcertPreferencesState(newPrefs);
    // Save to server (universal across devices) - fire and forget
    fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'concertPreferences', data: newPrefs }),
    }).catch((error) => {
      console.error('Error saving concert preferences:', error);
      // Fallback to localStorage
      localStorage.setItem('concert_preferences', JSON.stringify(newPrefs));
    });
  };

  const setCalendarPreferences = (prefs: CalendarPreferences | ((prev: CalendarPreferences) => CalendarPreferences)) => {
    const newPrefs = typeof prefs === 'function' ? prefs(calendarPreferences) : prefs;
    setCalendarPreferencesState(newPrefs);
    // Save to server (universal across devices) - fire and forget
    fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'calendarPreferences', data: newPrefs }),
    }).catch((error) => {
      console.error('Error saving calendar preferences:', error);
      // Fallback to localStorage
      localStorage.setItem('calendar_preferences', JSON.stringify(newPrefs));
    });
  };

  const refreshWeather = async () => {
    // This will be implemented in WeatherWidget
  };

  const refreshSports = async () => {
    // This will be implemented in SportsWidget
  };

  // Apply dark mode on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (appearancePreferences.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [appearancePreferences.darkMode]);

  return (
    <DataCacheContext.Provider
      value={{
        weather,
        sports,
        teamPreferences,
        appearancePreferences,
        concertPreferences,
        calendarPreferences,
        setWeather,
        setSports,
        setTeamPreferences,
        setAppearancePreferences,
        setConcertPreferences,
        setCalendarPreferences,
        refreshWeather,
        refreshSports,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
}

