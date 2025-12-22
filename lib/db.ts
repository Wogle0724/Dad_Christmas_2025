import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables. Falling back to JSON file storage.');
}

// Create Supabase client for server-side operations
// Use service role key if available (for admin operations), otherwise use anon key
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  password: string;
  team_preferences: {
    selectedTeams: string[];
    favoriteTeams: string[];
  };
  appearance_preferences: {
    darkMode: boolean;
    showWeather: boolean;
    showSports: boolean;
    showNotes: boolean;
    showMotivation: boolean;
    showConcerts: boolean;
    showCalendar: boolean;
    dashboardName: string;
    widgetOrder: string[];
    leftPanelOrder: string[];
  };
  concert_preferences: {
    favoriteArtists: string[];
    favoriteGenres: string[];
    location: {
      city?: string;
      stateCode?: string;
      lat?: number;
      lon?: number;
    };
  };
  calendar_preferences: {
    calendarIds: string[];
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: number;
  };
  messages: any[];
  notes: any[];
  daily_motivation?: string | null;
  daily_motivation_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_USER_ID = 'default';

export async function getUserPreferences(): Promise<UserPreferences | null> {
  if (!supabase) {
    console.log('[DB] Supabase not configured - returning null');
    return null;
  }

  try {
    console.log('[DB] Fetching user preferences from Supabase...');
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return null to create default
        console.log('[DB] No user preferences found in database - will create defaults');
        return null;
      }
      console.error('[DB] Error fetching user preferences:', error);
      console.error('[DB] Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('[DB] Successfully fetched user preferences from Supabase');
    return data;
  } catch (error) {
    console.error('[DB] Exception in getUserPreferences:', error);
    return null;
  }
}

export async function createDefaultPreferences(): Promise<UserPreferences> {
  if (!supabase) {
    console.error('[DB] Cannot create default preferences - Supabase not configured');
    throw new Error('Supabase not configured');
  }

  console.log('[DB] Creating default user preferences in Supabase...');

  const defaultPrefs: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> = {
    user_id: DEFAULT_USER_ID,
    password: process.env.DASHBOARD_PASSWORD || process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'dad2025',
    team_preferences: {
      selectedTeams: ['25-baseball-mlb'],
      favoriteTeams: ['25-baseball-mlb'],
    },
    appearance_preferences: {
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
    },
    concert_preferences: {
      favoriteArtists: [],
      favoriteGenres: [],
      location: {},
    },
    calendar_preferences: {
      calendarIds: [],
    },
    messages: [],
    notes: [],
    daily_motivation: null,
    daily_motivation_date: null,
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .insert(defaultPrefs)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error creating default preferences:', error);
    console.error('[DB] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('[DB] Successfully created default user preferences');
  return data;
}

export async function updateUserPreferencesSection(
  section: keyof Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  data: any
): Promise<void> {
  if (!supabase) {
    console.error(`[DB] Cannot update ${section} - Supabase not configured`);
    throw new Error('Supabase not configured');
  }

  console.log(`[DB] Updating ${section} in Supabase...`);
  const updateData: any = {
    [section]: data,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_preferences')
    .update(updateData)
    .eq('user_id', DEFAULT_USER_ID);

  if (error) {
    console.error(`[DB] Error updating ${section}:`, error);
    console.error(`[DB] Error details:`, JSON.stringify(error, null, 2));
    throw error;
  }

  console.log(`[DB] Successfully updated ${section}`);
}

export async function getPassword(): Promise<string> {
  if (!supabase) {
    console.log('[DB] Supabase not configured - using env variable for password');
    return process.env.DASHBOARD_PASSWORD || process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'dad2025';
  }

  try {
    console.log('[DB] Fetching password from Supabase...');
    const prefs = await getUserPreferences();
    if (!prefs) {
      console.log('[DB] No preferences found - creating defaults');
      const defaultPrefs = await createDefaultPreferences();
      return defaultPrefs.password;
    }
    console.log('[DB] Successfully retrieved password from Supabase');
    return prefs.password;
  } catch (error) {
    console.error('[DB] Error getting password:', error);
    // Fallback to env variable
    return process.env.DASHBOARD_PASSWORD || process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'dad2025';
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  if (!supabase) {
    console.error('[DB] Cannot update password - Supabase not configured');
    throw new Error('Supabase not configured');
  }

  console.log('[DB] Updating password in Supabase...');
  await updateUserPreferencesSection('password', newPassword);
  console.log('[DB] Password successfully updated in Supabase');
}

