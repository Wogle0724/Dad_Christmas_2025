'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SendMessagePage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try Supabase first
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            name: name.trim(),
            message: message.trim(),
            read: false,
          },
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Supabase error, using localStorage:', error);
      // Fallback to localStorage
      const existingMessages = JSON.parse(localStorage.getItem('messages') || '[]');
      const newMessage = {
        id: Date.now().toString(),
        name: name.trim(),
        message: message.trim(),
        read: false,
        created_at: new Date().toISOString(),
      };
      existingMessages.push(newMessage);
      localStorage.setItem('messages', JSON.stringify(existingMessages));
    }

    setSuccess(true);
    setName('');
    setMessage('');
    
    setTimeout(() => {
      router.push('/');
    }, 2000);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h2>
          <p className="text-gray-600 mb-6">Your message has been delivered.</p>
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Send a Message</h1>
          <p className="text-gray-600">Leave a message for Dad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              required
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

