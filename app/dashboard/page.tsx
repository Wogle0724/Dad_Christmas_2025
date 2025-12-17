'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { isAuthenticated, clearSession } from '@/lib/auth';
import WeatherWidget from '@/components/WeatherWidget';
import SportsWidget from '@/components/SportsWidget';
import StickyNotes from '@/components/StickyNotes';
import MessagesTab from '@/components/MessagesTab';
import DailyMotivation from '@/components/DailyMotivation';
import SettingsModal from '@/components/SettingsModal';
import { useDataCache } from '@/lib/DataCacheContext';
import DashboardWrapper from '@/components/DashboardWrapper';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'messages'>('dashboard');
  const [mounted, setMounted] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const router = useRouter();
  const { appearancePreferences } = useDataCache();
  
  // Check for unread messages
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Only check authentication on page load - don't auto-logout
    // If they logged in within the last 30 minutes, they can access the dashboard
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    // No periodic check - user stays logged in until they manually logout or close browser
  }, [router]);

  useEffect(() => {
    // Check for unread messages
    const checkUnreadMessages = () => {
      try {
        const stored = localStorage.getItem('messages');
        if (stored) {
          const messages = JSON.parse(stored);
          const unread = messages.filter((msg: { read: boolean }) => !msg.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    };

    checkUnreadMessages();
    // Check every 5 seconds for new messages
    const interval = setInterval(checkUnreadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Dad Dashboard</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'messages'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Messages
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left Side - Sticky Notes (70%) */}
            <div className="lg:col-span-7">
              {appearancePreferences.showNotes ? (
                <StickyNotes />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center text-gray-500 dark:text-gray-400">
                  Sticky Notes widget is hidden. Enable it in Settings → Appearance.
                </div>
              )}
            </div>

            {/* Right Side - Widgets (30%) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Weather and Sports Widgets */}
              <div className="space-y-4">
                {appearancePreferences.showWeather && <WeatherWidget />}
                {appearancePreferences.showSports && <SportsWidget />}
                {!appearancePreferences.showWeather && !appearancePreferences.showSports && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Widgets are hidden. Enable them in Settings → Appearance.
                  </div>
                )}
              </div>

              {/* Daily Motivation */}
              {appearancePreferences.showMotivation && <DailyMotivation />}
            </div>
          </div>
        ) : (
          <MessagesTab onMessagesChange={() => {
            // Refresh unread count when messages change
            const stored = localStorage.getItem('messages');
            if (stored) {
              const messages = JSON.parse(stored);
              const unread = messages.filter((msg: { read: boolean }) => !msg.read).length;
              setUnreadCount(unread);
            }
          }} />
        )}
      </main>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardWrapper>
      <DashboardContent />
    </DashboardWrapper>
  );
}

