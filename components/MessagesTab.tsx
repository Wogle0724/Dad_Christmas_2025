'use client';

import { useEffect, useState } from 'react';
import { Mail, User, Clock, Check, CheckCheck } from 'lucide-react';
import { supabase, Message } from '@/lib/supabase';

interface MessagesTabProps {
  onMessagesChange?: () => void;
}

export default function MessagesTab({ onMessagesChange }: MessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      // Fetch from server (universal across devices)
      const response = await fetch('/api/user-data?section=messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        // Fallback to localStorage for migration
        const stored = localStorage.getItem('messages');
        if (stored) {
          const messages = JSON.parse(stored);
          setMessages(messages);
          // Migrate to server
          await fetch('/api/user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section: 'messages', data: messages }),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('messages');
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === id ? { ...msg, read: true } : msg
    );
    setMessages(updatedMessages);

    try {
      // Save to server (universal across devices)
      await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'messages', data: updatedMessages }),
      });
    } catch (error) {
      console.error('Error updating message:', error);
      // Fallback to localStorage
      localStorage.setItem('messages', JSON.stringify(updatedMessages));
    }
    
    onMessagesChange?.();
  };

  const deleteMessage = async (id: string) => {
    const updatedMessages = messages.filter((msg) => msg.id !== id);
    setMessages(updatedMessages);

    try {
      // Save to server (universal across devices)
      await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'messages', data: updatedMessages }),
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      // Fallback to localStorage
      localStorage.setItem('messages', JSON.stringify(updatedMessages));
    }
    
    onMessagesChange?.();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full flex flex-col">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((msg) => !msg.read).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Mail className="w-6 h-6" />
          Messages
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`border-2 rounded-lg p-4 transition-all ${
                message.read
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                  : 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{message.name}</span>
                  {!message.read && (
                    <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {message.read ? (
                    <CheckCheck className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <button
                      onClick={() => markAsRead(message.id)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{message.message}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{new Date(message.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

