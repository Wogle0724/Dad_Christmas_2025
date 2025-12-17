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
  dashboardName: string;
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

interface DataCacheContextType {
  weather: WeatherData | null;
  sports: SportsData | null;
  teamPreferences: TeamPreferences;
  appearancePreferences: AppearancePreferences;
  concertPreferences: ConcertPreferences;
  setWeather: (data: WeatherData) => void;
  setSports: (data: SportsData) => void;
  setTeamPreferences: (prefs: TeamPreferences) => void;
  setAppearancePreferences: (prefs: AppearancePreferences) => void;
  setConcertPreferences: (prefs: ConcertPreferences) => void;
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
    dashboardName: 'Dad Dashboard',
  });
  const [concertPreferences, setConcertPreferencesState] = useState<ConcertPreferences>({
    favoriteArtists: [],
    favoriteGenres: [],
    location: {},
  });

  useEffect(() => {
    // Load cached data on mount
    const cachedWeather = localStorage.getItem('cached_weather');
    const cachedSports = localStorage.getItem('cached_sports');
    const cachedTeamPrefs = localStorage.getItem('team_preferences');
    const cachedAppearancePrefs = localStorage.getItem('appearance_preferences');
    const cachedConcertPrefs = localStorage.getItem('concert_preferences');

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

    if (cachedTeamPrefs) {
      const prefs = JSON.parse(cachedTeamPrefs);
      // Migrate old format (just IDs) to new format (composite keys)
      // If any team ID doesn't contain a dash, it's the old format
      const needsMigration = prefs.selectedTeams.some((id: string) => !id.includes('-'));
      if (needsMigration) {
        // Clear old preferences - user will need to reselect teams
        const migratedPrefs: TeamPreferences = {
          selectedTeams: [],
          favoriteTeams: [],
        };
        setTeamPreferencesState(migratedPrefs);
        localStorage.setItem('team_preferences', JSON.stringify(migratedPrefs));
      } else {
        setTeamPreferencesState(prefs);
      }
    } else {
      // Default: San Diego Padres (using composite key format)
      // Padres: ID 25, sport: baseball, league: mlb
      const defaultPrefs: TeamPreferences = {
        selectedTeams: ['25-baseball-mlb'],
        favoriteTeams: ['25-baseball-mlb'],
      };
      setTeamPreferencesState(defaultPrefs);
      localStorage.setItem('team_preferences', JSON.stringify(defaultPrefs));
    }

    if (cachedAppearancePrefs) {
      const prefs = JSON.parse(cachedAppearancePrefs);
      // Ensure all required fields exist
      setAppearancePreferencesState({
        darkMode: prefs.darkMode || false,
        showWeather: prefs.showWeather !== undefined ? prefs.showWeather : true,
        showSports: prefs.showSports !== undefined ? prefs.showSports : true,
        showNotes: prefs.showNotes !== undefined ? prefs.showNotes : true,
        showMotivation: prefs.showMotivation !== undefined ? prefs.showMotivation : true,
        showConcerts: prefs.showConcerts !== undefined ? prefs.showConcerts : true,
        dashboardName: prefs.dashboardName || 'Dad Dashboard',
      });
    }

    if (cachedConcertPrefs) {
      const prefs = JSON.parse(cachedConcertPrefs);
      setConcertPreferencesState(prefs);
    }
  }, []);

  const setWeather = (data: WeatherData) => {
    setWeatherState(data);
    localStorage.setItem('cached_weather', JSON.stringify(data));
  };

  const setSports = (data: SportsData) => {
    setSportsState(data);
    localStorage.setItem('cached_sports', JSON.stringify(data));
  };

  const setTeamPreferences = (prefs: TeamPreferences) => {
    setTeamPreferencesState(prefs);
    localStorage.setItem('team_preferences', JSON.stringify(prefs));
  };

  const setAppearancePreferences = (prefs: AppearancePreferences) => {
    setAppearancePreferencesState(prefs);
    localStorage.setItem('appearance_preferences', JSON.stringify(prefs));
    // Apply dark mode immediately
    if (typeof document !== 'undefined') {
      if (prefs.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const setConcertPreferences = (prefs: ConcertPreferences) => {
    setConcertPreferencesState(prefs);
    localStorage.setItem('concert_preferences', JSON.stringify(prefs));
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
        setWeather,
        setSports,
        setTeamPreferences,
        setAppearancePreferences,
        setConcertPreferences,
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

