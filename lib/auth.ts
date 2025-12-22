// Simple authentication - in production, use NextAuth.js or similar
// For now, we'll use a simple password check
// You should replace this with proper authentication

import { getPassword, updatePassword as updatePasswordDb } from '@/lib/db';

async function getStoredPassword(): Promise<string> {
  try {
    // Try to get from Supabase first
    const password = await getPassword();
    if (password) {
      return password;
    }
  } catch (error) {
    console.error('Error fetching password from database:', error);
  }
  
  // Fallback: try API route (which will use JSON file if Supabase not configured)
  try {
    const response = await fetch('/api/user-data?section=password');
    if (response.ok) {
      const data = await response.json();
      return data.password || process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'dad2025';
    }
  } catch (error) {
    console.error('Error fetching password from API:', error);
  }
  
  // Final fallback to env or default
  return process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'dad2025';
}

export async function verifyPassword(password: string): Promise<boolean> {
  const correctPassword = await getStoredPassword();
  return password === correctPassword;
}

export function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    const correctPassword = await getStoredPassword();
    if (currentPassword === correctPassword) {
      try {
        // Try Supabase first
        try {
          await updatePasswordDb(newPassword);
          resolve(true);
          return;
        } catch (dbError) {
          console.error('Error updating password in database:', dbError);
          // Fall through to API route
        }
        
        // Fallback to API route (which will use JSON file if Supabase not configured)
        const response = await fetch('/api/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'password',
            data: newPassword,
          }),
        });
        
        if (response.ok) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Error updating password:', error);
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
}

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export function setSession() {
  if (typeof window !== 'undefined') {
    const timestamp = Date.now();
    sessionStorage.setItem('authenticated', 'true');
    sessionStorage.setItem('session_timestamp', timestamp.toString());
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('session_timestamp');
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    const authenticated = sessionStorage.getItem('authenticated');
    const timestamp = sessionStorage.getItem('session_timestamp');
    
    if (authenticated !== 'true' || !timestamp) {
      return false;
    }
    
    // Check if session is still valid (within 30 minutes)
    const sessionTime = parseInt(timestamp, 10);
    const now = Date.now();
    const timeDiff = now - sessionTime;
    
    if (timeDiff > SESSION_DURATION) {
      // Session expired
      clearSession();
      return false;
    }
    
    return true;
  }
  return false;
}

