'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { isAuthenticated, clearSession } from '@/lib/auth';
import WeatherWidget from '@/components/WeatherWidget';
import SportsWidget from '@/components/SportsWidget';
import ConcertsWidget from '@/components/ConcertsWidget';
import StickyNotes from '@/components/StickyNotes';
import CalendarWidget from '@/components/CalendarWidget';
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
    
    // Force refresh on page reload is handled by DataCacheContext
    // All widgets will automatically fetch fresh data when cache is cleared
    // No periodic check - user stays logged in until they manually logout or close browser
  }, [router]);

  useEffect(() => {
    // Check for unread messages from server (universal across devices)
    const checkUnreadMessages = async () => {
      try {
        const response = await fetch('/api/user-data?section=messages');
        if (response.ok) {
          const data = await response.json();
          const messages = data.messages || [];
          const unread = messages.filter((msg: { read: boolean }) => !msg.read).length;
          setUnreadCount(unread);
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('messages');
          if (stored) {
            const messages = JSON.parse(stored);
            const unread = messages.filter((msg: { read: boolean }) => !msg.read).length;
            setUnreadCount(unread);
          }
        }
      } catch (error) {
        console.error('Error checking unread messages:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('messages');
        if (stored) {
          const messages = JSON.parse(stored);
          const unread = messages.filter((msg: { read: boolean }) => !msg.read).length;
          setUnreadCount(unread);
        }
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-50 flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">
              {appearancePreferences.dashboardName || 'Dad Dashboard'}
            </h1>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 touch-manipulation"
                title="Settings"
              >
                <Settings className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Sticky */}
      <div className="sticky top-[49px] sm:top-[57px] lg:top-[65px] z-40 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm touch-manipulation ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm relative touch-manipulation ${
                activeTab === 'messages'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Messages
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 sm:-top-1 -right-1 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 w-full flex flex-col">
          {activeTab === 'dashboard' ? (
            <div className="flex flex-col lg:grid lg:grid-cols-10 gap-4 sm:gap-6">
              {/* Mobile: Stack all widgets vertically */}
              <div className="flex flex-col gap-4 sm:gap-6 lg:hidden">
                {(() => {
                  const allWidgets: JSX.Element[] = [];
                  
                  // Add left panel widgets (calendar, notes)
                  const leftPanelOrder = appearancePreferences.leftPanelOrder || ['calendar', 'notes'];
                  leftPanelOrder.forEach((widgetId) => {
                    if (widgetId === 'calendar' && appearancePreferences.showCalendar) {
                      allWidgets.push(
                        <div key="calendar" className="w-full">
                          <CalendarWidget />
                        </div>
                      );
                    } else if (widgetId === 'notes' && appearancePreferences.showNotes) {
                      allWidgets.push(
                        <div key="notes" className="w-full">
                          <StickyNotes />
                        </div>
                      );
                    }
                  });

                  // Add right panel widgets (weather, sports, concerts, motivation)
                  const widgetOrder = appearancePreferences.widgetOrder || ['weather', 'sports', 'concerts', 'motivation'];
                  widgetOrder.forEach((widgetId) => {
                    switch (widgetId) {
                      case 'weather':
                        if (appearancePreferences.showWeather) {
                          allWidgets.push(<WeatherWidget key="weather" />);
                        }
                        break;
                      case 'sports':
                        if (appearancePreferences.showSports) {
                          allWidgets.push(<SportsWidget key="sports" />);
                        }
                        break;
                      case 'concerts':
                        if (appearancePreferences.showConcerts) {
                          allWidgets.push(<ConcertsWidget key="concerts" />);
                        }
                        break;
                      case 'motivation':
                        if (appearancePreferences.showMotivation) {
                          allWidgets.push(<DailyMotivation key="motivation" />);
                        }
                        break;
                    }
                  });

                  if (allWidgets.length === 0) {
                    return (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Widgets are hidden. Enable them in Settings → Appearance.
                      </div>
                    );
                  }

                  return allWidgets;
                })()}
              </div>

              {/* Desktop: Left Side - Calendar and Notes (70%) */}
              <div className="hidden lg:flex lg:col-span-7 flex-col gap-6 min-h-0">
                {(() => {
                  const leftPanelOrder = appearancePreferences.leftPanelOrder || ['calendar', 'notes'];
                  const widgets: JSX.Element[] = [];
                  
                  leftPanelOrder.forEach((widgetId) => {
                    if (widgetId === 'calendar' && appearancePreferences.showCalendar) {
                      widgets.push(
                        <div key="calendar" className="flex-1 min-h-0">
                          <CalendarWidget />
                        </div>
                      );
                    } else if (widgetId === 'notes' && appearancePreferences.showNotes) {
                      widgets.push(
                        <div key="notes" className="flex-1 min-h-0">
                          <StickyNotes />
                        </div>
                      );
                    }
                  });

                  if (widgets.length === 0) {
                    return (
                      <div className="flex-1 min-h-0 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <p>No left panel widgets enabled.</p>
                          <p className="text-sm mt-2">Enable Calendar or Notes in Settings → Appearance.</p>
                        </div>
                      </div>
                    );
                  }

                  return widgets;
                })()}
              </div>

              {/* Desktop: Right Side - Widgets (30%) */}
              <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 h-full">
                {(() => {
                  const widgetOrder = appearancePreferences.widgetOrder || ['weather', 'sports', 'concerts', 'motivation'];
                  const widgets: JSX.Element[] = [];
                  
                  widgetOrder.forEach((widgetId) => {
                    switch (widgetId) {
                      case 'weather':
                        if (appearancePreferences.showWeather) {
                          widgets.push(<WeatherWidget key="weather" />);
                        }
                        break;
                      case 'sports':
                        if (appearancePreferences.showSports) {
                          widgets.push(<SportsWidget key="sports" />);
                        }
                        break;
                      case 'concerts':
                        if (appearancePreferences.showConcerts) {
                          widgets.push(<ConcertsWidget key="concerts" />);
                        }
                        break;
                      case 'motivation':
                        if (appearancePreferences.showMotivation) {
                          widgets.push(<DailyMotivation key="motivation" />);
                        }
                        break;
                    }
                  });

                  if (widgets.length === 0) {
                    return (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Widgets are hidden. Enable them in Settings → Appearance.
                      </div>
                    );
                  }

                  return widgets;
                })()}
              </div>
            </div>
          ) : (
            <MessagesTab onMessagesChange={async () => {
              // Refresh unread count when messages change
              try {
                const response = await fetch('/api/user-data?section=messages');
                if (response.ok) {
                  const data = await response.json();
                  const messages = data.messages || [];
                  const unread = messages.filter((msg: { read: boolean }) => !msg.read).length;
                  setUnreadCount(unread);
                }
              } catch (error) {
                console.error('Error refreshing unread count:', error);
              }
            }} />
          )}
        </div>
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

