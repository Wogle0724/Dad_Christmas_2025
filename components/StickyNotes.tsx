'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase, Note } from '@/lib/supabase';

const COLORS = ['yellow', 'pink', 'blue', 'green'] as const;

export default function StickyNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<typeof COLORS[number]>('yellow');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      // For now, using localStorage as fallback if Supabase isn't configured
      const stored = localStorage.getItem('sticky-notes');
      if (stored) {
        setNotes(JSON.parse(stored));
      } else {
        // Try Supabase
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setNotes(data);
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      // Save to localStorage as fallback
      localStorage.setItem('sticky-notes', JSON.stringify(updatedNotes));
      
      // Also try to save to Supabase if configured
      const { error } = await supabase
        .from('notes')
        .upsert(updatedNotes);

      if (error) {
        console.error('Supabase error (using localStorage):', error);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: newNoteContent,
      color: newNoteColor,
      position_x: Math.random() * 100,
      position_y: Math.random() * 100,
      created_at: new Date().toISOString(),
      user_id: 'dad', // In production, use actual user ID
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setNewNoteContent('');
    setShowAddForm(false);
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Notes & Reminders</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write your note here..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewNoteColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newNoteColor === color
                      ? 'border-gray-800 dark:border-gray-200 scale-110'
                      : 'border-gray-300 dark:border-gray-600'
                  } sticky-note-${color}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewNoteContent('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative min-h-[400px]">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No notes yet. Click &quot;Add Note&quot; to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`sticky-note sticky-note-${note.color} p-4 rounded-lg relative group dark:opacity-90`}
              >
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-gray-800 dark:text-gray-900 whitespace-pre-wrap break-words pr-6">
                  {note.content}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-700 mt-2 opacity-70">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

