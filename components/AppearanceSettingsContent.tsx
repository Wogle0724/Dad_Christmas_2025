'use client';

import { useState } from 'react';
import { Moon, Sun, Cloud, Trophy, Heart, Music, GripVertical, Calendar, StickyNote, ArrowUpDown } from 'lucide-react';
import { useDataCache } from '@/lib/DataCacheContext';

type WidgetId = 'weather' | 'sports' | 'concerts' | 'motivation';
type LeftPanelWidgetId = 'calendar' | 'notes';

interface WidgetConfig {
  id: WidgetId;
  key: 'showWeather' | 'showSports' | 'showConcerts' | 'showMotivation';
  name: string;
  description: string;
  icon: typeof Cloud;
}

interface LeftPanelWidgetConfig {
  id: LeftPanelWidgetId;
  key: 'showCalendar' | 'showNotes';
  name: string;
  description: string;
  icon: typeof Calendar;
}

const WIDGET_CONFIGS: WidgetConfig[] = [
  { id: 'weather', key: 'showWeather', name: 'Weather Widget', description: 'Show current weather', icon: Cloud },
  { id: 'sports', key: 'showSports', name: 'Sports Widget', description: 'Show sports teams', icon: Trophy },
  { id: 'concerts', key: 'showConcerts', name: 'Concerts Widget', description: 'Show upcoming concerts', icon: Music },
  { id: 'motivation', key: 'showMotivation', name: 'Daily Motivation', description: 'Show daily inspirational messages', icon: Heart },
];

const LEFT_PANEL_WIDGET_CONFIGS: LeftPanelWidgetConfig[] = [
  { id: 'calendar', key: 'showCalendar', name: 'Calendar', description: 'Show Google Calendar events', icon: Calendar },
  { id: 'notes', key: 'showNotes', name: 'Notes & Reminders', description: 'Show sticky notes and reminders', icon: StickyNote },
];

export default function AppearanceSettingsContent() {
  const { appearancePreferences, setAppearancePreferences } = useDataCache();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedLeftPanelIndex, setDraggedLeftPanelIndex] = useState<number | null>(null);

  const toggleDarkMode = () => {
    setAppearancePreferences({
      ...appearancePreferences,
      darkMode: !appearancePreferences.darkMode,
    });
  };

  const toggleWidget = (widget: 'showWeather' | 'showSports' | 'showMotivation' | 'showConcerts') => {
    setAppearancePreferences({
      ...appearancePreferences,
      [widget]: !appearancePreferences[widget],
    });
  };

  const toggleLeftPanelWidget = (widget: 'showCalendar' | 'showNotes') => {
    setAppearancePreferences({
      ...appearancePreferences,
      [widget]: !(appearancePreferences[widget] ?? true),
    });
  };

  const handleDashboardNameChange = (name: string) => {
    setAppearancePreferences({
      ...appearancePreferences,
      dashboardName: name,
    });
  };

  // Get ordered widgets based on widgetOrder preference
  const getOrderedWidgets = (): WidgetConfig[] => {
    const order = appearancePreferences.widgetOrder || ['weather', 'sports', 'concerts', 'motivation'];
    return order
      .map(id => WIDGET_CONFIGS.find(w => w.id === id as WidgetId))
      .filter((w): w is WidgetConfig => w !== undefined);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const orderedWidgets = getOrderedWidgets();
    const newOrder = [...orderedWidgets];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    const newWidgetOrder = newOrder.map(w => w.id);
    setAppearancePreferences({
      ...appearancePreferences,
      widgetOrder: newWidgetOrder,
    });

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get ordered left panel widgets based on leftPanelOrder preference
  const getOrderedLeftPanelWidgets = (): LeftPanelWidgetConfig[] => {
    const order = appearancePreferences.leftPanelOrder || ['calendar', 'notes'];
    return order
      .map(id => LEFT_PANEL_WIDGET_CONFIGS.find(w => w.id === id as LeftPanelWidgetId))
      .filter((w): w is LeftPanelWidgetConfig => w !== undefined);
  };

  const handleLeftPanelDragStart = (e: React.DragEvent, index: number) => {
    setDraggedLeftPanelIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleLeftPanelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleLeftPanelDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedLeftPanelIndex === null) return;

    const orderedWidgets = getOrderedLeftPanelWidgets();
    const newOrder = [...orderedWidgets];
    const [removed] = newOrder.splice(draggedLeftPanelIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    const newLeftPanelOrder = newOrder.map(w => w.id);
    setAppearancePreferences({
      ...appearancePreferences,
      leftPanelOrder: newLeftPanelOrder,
    });

    setDraggedLeftPanelIndex(null);
  };

  const handleLeftPanelDragEnd = () => {
    setDraggedLeftPanelIndex(null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Dashboard Name */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Dashboard Name</h3>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <label htmlFor="dashboardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom Dashboard Title
          </label>
          <input
            type="text"
            id="dashboardName"
            value={appearancePreferences.dashboardName}
            onChange={(e) => handleDashboardNameChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Dad Dashboard"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This name will appear at the top of your dashboard
          </p>
        </div>
      </div>

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
        <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag widgets to reorder them. The order here matches the order on your dashboard.
        </p>
        
        {/* Left Panel Widgets (Calendar & Notes) */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Left Panel Widgets
          </p>
          {getOrderedLeftPanelWidgets().map((widget, index) => {
            const Icon = widget.icon;
            return (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleLeftPanelDragStart(e, index)}
                onDragOver={handleLeftPanelDragOver}
                onDrop={(e) => handleLeftPanelDrop(e, index)}
                onDragEnd={handleLeftPanelDragEnd}
                className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-move transition-all ${
                  draggedLeftPanelIndex === index ? 'opacity-50' : 'hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{widget.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={appearancePreferences[widget.key] ?? true}
                    onChange={() => toggleLeftPanelWidget(widget.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

        {/* Right Panel Widgets */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Right Panel Widgets
          </p>
          <div className="space-y-3">
            {getOrderedWidgets().map((widget, index) => {
            const Icon = widget.icon;
            return (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50' : 'hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{widget.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={appearancePreferences[widget.key]}
                    onChange={() => toggleWidget(widget.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}

