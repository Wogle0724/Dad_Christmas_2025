import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  getUserPreferences,
  createDefaultPreferences,
  updateUserPreferencesSection,
  isSupabaseConfigured,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get user data file path
function getUserDataFilePath(): string {
  return path.join(process.cwd(), 'data', 'user-data.json');
}

// Initialize user data file if it doesn't exist
async function ensureUserDataFile(): Promise<void> {
  const filePath = getUserDataFilePath();
  const dir = path.dirname(filePath);
  
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  try {
    await fs.access(filePath);
  } catch {
    // File doesn't exist, create it with default structure
    const defaultData = {
      password: process.env.DASHBOARD_PASSWORD || process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'dad2025',
      teamPreferences: {
        selectedTeams: ['25-baseball-mlb'],
        favoriteTeams: ['25-baseball-mlb'],
      },
      appearancePreferences: {
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
      concertPreferences: {
        favoriteArtists: [],
        favoriteGenres: [],
        location: {},
      },
      calendarPreferences: {
        calendarIds: [],
      },
      messages: [],
      notes: [],
      dailyMotivation: null,
      dailyMotivationDate: null,
      dailyMotivationData: null, // Store both motivation and date together
    };
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

// GET: Retrieve all user data or specific section
export async function GET(request: NextRequest) {
  try {
    // Try Supabase first if configured
    if (isSupabaseConfigured()) {
      let prefs = await getUserPreferences();
      
      // Create default preferences if they don't exist
      if (!prefs) {
        prefs = await createDefaultPreferences();
      }
      
      const section = request.nextUrl.searchParams.get('section');
      
      if (section) {
        if (section === 'password') {
          return NextResponse.json({ password: prefs.password });
        }
        
        if (section === 'dailyMotivation') {
          return NextResponse.json({
            dailyMotivation: prefs.daily_motivation || null,
            dailyMotivationDate: prefs.daily_motivation_date || null,
          });
        }
        
        // Map section names to database column names
        const sectionMap: Record<string, keyof typeof prefs> = {
          teamPreferences: 'team_preferences',
          appearancePreferences: 'appearance_preferences',
          concertPreferences: 'concert_preferences',
          calendarPreferences: 'calendar_preferences',
          messages: 'messages',
          notes: 'notes',
        };
        
        const dbColumn = sectionMap[section] || section;
        const value = prefs[dbColumn as keyof typeof prefs];
        return NextResponse.json({ [section]: value || null });
      }
      
      // Return all data (but exclude sensitive tokens in response)
      const { password, calendar_preferences, ...publicData } = prefs;
      const safeCalendarPrefs = {
        ...calendar_preferences,
        accessToken: calendar_preferences?.accessToken ? '***' : undefined,
        refreshToken: calendar_preferences?.refreshToken ? '***' : undefined,
      };
      
      return NextResponse.json({
        teamPreferences: publicData.team_preferences,
        appearancePreferences: publicData.appearance_preferences,
        concertPreferences: publicData.concert_preferences,
        calendarPreferences: safeCalendarPrefs,
        messages: publicData.messages,
        notes: publicData.notes,
        dailyMotivation: publicData.daily_motivation,
        dailyMotivationDate: publicData.daily_motivation_date,
      });
    }
    
    // Fallback to JSON file if Supabase not configured
    await ensureUserDataFile();
    const filePath = getUserDataFilePath();
    const data = await fs.readFile(filePath, 'utf-8');
    const userData = JSON.parse(data);
    
    const section = request.nextUrl.searchParams.get('section');
    if (section) {
      if (section === 'dailyMotivation') {
        const motivation = userData.dailyMotivation || userData.dailyMotivationData?.motivation || null;
        const date = userData.dailyMotivationDate || userData.dailyMotivationData?.date || null;
        return NextResponse.json({
          dailyMotivation: motivation,
          dailyMotivationDate: date,
        });
      }
      return NextResponse.json({ [section]: userData[section] || null });
    }
    
    const { password, calendarPreferences, ...publicData } = userData;
    const safeCalendarPrefs = {
      ...calendarPreferences,
      accessToken: calendarPreferences?.accessToken ? '***' : undefined,
      refreshToken: calendarPreferences?.refreshToken ? '***' : undefined,
    };
    
    return NextResponse.json({
      ...publicData,
      calendarPreferences: safeCalendarPrefs,
    });
  } catch (error) {
    console.error('Error reading user data:', error);
    return NextResponse.json(
      { error: 'Failed to read user data' },
      { status: 500 }
    );
  }
}

// POST: Update specific section of user data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, data: sectionData } = body;
    
    if (!section) {
      return NextResponse.json(
        { error: 'Section parameter required' },
        { status: 400 }
      );
    }
    
    // Try Supabase first if configured
    if (isSupabaseConfigured()) {
      try {
        let prefs = await getUserPreferences();
        
        // Create default preferences if they don't exist
        if (!prefs) {
          prefs = await createDefaultPreferences();
        }
        
        // Map section names to database column names
        const sectionMap: Record<string, string> = {
          password: 'password',
          teamPreferences: 'team_preferences',
          appearancePreferences: 'appearance_preferences',
          concertPreferences: 'concert_preferences',
          calendarPreferences: 'calendar_preferences',
          messages: 'messages',
          notes: 'notes',
        };
        
        // Handle dailyMotivation specially
        if (section === 'dailyMotivation' && sectionData && typeof sectionData === 'object') {
          await updateUserPreferencesSection('daily_motivation', sectionData.motivation);
          await updateUserPreferencesSection('daily_motivation_date', sectionData.date);
        } else {
          const dbColumn = sectionMap[section] || section;
          await updateUserPreferencesSection(dbColumn as any, sectionData);
        }
        
        return NextResponse.json({ success: true });
      } catch (dbError) {
        console.error('Supabase update failed, falling back to JSON:', dbError);
        // Fall through to JSON file fallback
      }
    }
    
    // Fallback to JSON file
    await ensureUserDataFile();
    const filePath = getUserDataFilePath();
    
    let userData: any = {};
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      userData = JSON.parse(existing);
    } catch {
      // File doesn't exist, will be created
    }
    
    if (section === 'dailyMotivation' && sectionData && typeof sectionData === 'object' && sectionData.motivation) {
      userData.dailyMotivation = sectionData.motivation;
      userData.dailyMotivationDate = sectionData.date;
      userData.dailyMotivationData = sectionData;
    } else {
      userData[section] = sectionData;
    }
    
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}

// PATCH: Update specific fields within a section
export async function PATCH(request: NextRequest) {
  try {
    await ensureUserDataFile();
    const filePath = getUserDataFilePath();
    
    const body = await request.json();
    const { section, updates } = body;
    
    if (!section || !updates) {
      return NextResponse.json(
        { error: 'Section and updates parameters required' },
        { status: 400 }
      );
    }
    
    // Read existing data
    let userData: any = {};
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      userData = JSON.parse(existing);
    } catch {
      // File doesn't exist, will be created
    }
    
    // Merge updates into the section
    if (!userData[section]) {
      userData[section] = {};
    }
    userData[section] = { ...userData[section], ...updates };
    
    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error patching user data:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}

