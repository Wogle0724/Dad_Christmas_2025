// Simple authentication - in production, use NextAuth.js or similar
// For now, we'll use a simple password check
// You should replace this with proper authentication

function getStoredPassword(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dashboard_password');
    if (stored) {
      return stored;
    }
    // Initialize with default password on first use
    const defaultPassword = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'dad2025';
    localStorage.setItem('dashboard_password', defaultPassword);
    return defaultPassword;
  }
  // Default password from env or fallback (server-side)
  return process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'dad2025';
}

export async function verifyPassword(password: string): Promise<boolean> {
  const correctPassword = getStoredPassword();
  return password === correctPassword;
}

export function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  return new Promise((resolve) => {
    const correctPassword = getStoredPassword();
    if (currentPassword === correctPassword) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard_password', newPassword);
      }
      resolve(true);
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

