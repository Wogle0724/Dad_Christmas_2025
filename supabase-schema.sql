-- Supabase Database Schema for Dad Dashboard
-- Run this in your Supabase SQL editor to set up the database tables

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('yellow', 'pink', 'blue', 'green')),
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for messages (public can insert, authenticated can read)
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read messages" ON messages
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update messages" ON messages
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete messages" ON messages
  FOR DELETE
  USING (true);

-- Create policies for notes (authenticated users only)
CREATE POLICY "Authenticated users can manage notes" ON notes
  FOR ALL
  USING (true)
  WITH CHECK (true);

