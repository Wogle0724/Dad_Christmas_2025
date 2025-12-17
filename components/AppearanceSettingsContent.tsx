'use client';

import { Moon, Sun, Cloud, Trophy, StickyNote, Heart } from 'lucide-react';
import { useDataCache } from '@/lib/DataCacheContext';

export default function AppearanceSettingsContent() {
  const { appearancePreferences, setAppearancePreferences } = useDataCache();

  const toggleDarkMode = () => {
    setAppearancePreferences({
      ...appearancePreferences,
      darkMode: !appearancePreferences.darkMode,
    });
  };

  const toggleWidget = (widget: 'showWeather' | 'showSports' | 'showNotes' | 'showMotivation') => {
    setAppearancePreferences({
      ...appearancePreferences,
      [widget]: !appearancePreferences[widget],
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Dark Mode */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Theme</h3>
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            {appearancePreferences.darkMode ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">Dark Mode</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {appearancePreferences.darkMode ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={appearancePreferences.darkMode}
              onChange={toggleDarkMode}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {/* Widget Visibility */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Widget Visibility</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">Weather Widget</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Show current weather</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appearancePreferences.showWeather}
                onChange={() => toggleWidget('showWeather')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">Sports Widget</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Show sports teams</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appearancePreferences.showSports}
                onChange={() => toggleWidget('showSports')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <StickyNote className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">Sticky Notes</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Show notes and reminders</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appearancePreferences.showNotes}
                onChange={() => toggleWidget('showNotes')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">Daily Motivation</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Show daily inspirational messages</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appearancePreferences.showMotivation}
                onChange={() => toggleWidget('showMotivation')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

