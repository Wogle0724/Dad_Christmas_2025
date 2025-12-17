import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client only if credentials are provided
// Otherwise, create a mock client that will fail gracefully
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Create a mock client with dummy values to prevent build errors
  // The actual operations will fall back to localStorage
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };

// Database types
export interface Note {
  id: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green';
  position_x: number;
  position_y: number;
  created_at: string;
  user_id: string;
}

export interface Message {
  id: string;
  name: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface DailyMotivation {
  id: string;
  message: string;
  date: string;
}

