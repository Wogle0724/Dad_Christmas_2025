import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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
    await ensureUserDataFile();
    const filePath = getUserDataFilePath();
    const data = await fs.readFile(filePath, 'utf-8');
    const userData = JSON.parse(data);
    
    // Get specific section if requested
    const section = request.nextUrl.searchParams.get('section');
    if (section) {
      // Handle dailyMotivation specially (combine motivation and date)
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
    
    // Return all data (but exclude sensitive tokens in response)
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
    await ensureUserDataFile();
    const filePath = getUserDataFilePath();
    
    const body = await request.json();
    const { section, data: sectionData } = body;
    
    if (!section) {
      return NextResponse.json(
        { error: 'Section parameter required' },
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
    
    // Update the specific section
    if (section === 'dailyMotivation' && sectionData && typeof sectionData === 'object' && sectionData.motivation) {
      // Handle dailyMotivation as an object with motivation and date
      userData.dailyMotivation = sectionData.motivation;
      userData.dailyMotivationDate = sectionData.date;
      userData.dailyMotivationData = sectionData;
    } else {
      userData[section] = sectionData;
    }
    
    // Write back to file
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

