'use client';

import { useEffect, useState, useCallback } from 'react';
import { Cloud, Sun, Droplets, Wind, MapPin } from 'lucide-react';
import { useDataCache } from '@/lib/DataCacheContext';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  location: string;
  timestamp: number;
}

export default function WeatherWidget() {
  const { weather, setWeather } = useDataCache();
  const [loading, setLoading] = useState(!weather);
  const [error, setError] = useState('');

  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://wttr.in/?lat=${lat}&lon=${lon}&format=j1`);
      const data = await response.json();
      
      const current = data.current_condition[0];
      const location = data.nearest_area[0].areaName[0].value;
      
      const weatherData: WeatherData = {
        temp: parseInt(current.temp_F),
        condition: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedMiles),
        icon: current.weatherCode,
        location: location,
        timestamp: Date.now(),
      };

      setWeather(weatherData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Unable to load weather data');
      setLoading(false);
    }
  }, [setWeather]);

  const fetchWeatherByLocation = useCallback(async (location: string) => {
    try {
      const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
      const data = await response.json();
      
      const current = data.current_condition[0];
      
      const weatherData: WeatherData = {
        temp: parseInt(current.temp_F),
        condition: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedMiles),
        icon: current.weatherCode,
        location: location,
        timestamp: Date.now(),
      };

      setWeather(weatherData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Unable to load weather data');
      setLoading(false);
    }
  }, [setWeather]);

  useEffect(() => {
    // If we have cached weather, use it
    if (weather) {
      setLoading(false);
      return;
    }

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await fetchWeatherByCoords(latitude, longitude);
        },
        async () => {
          // Fallback to San Diego if geolocation fails
          await fetchWeatherByLocation('San Diego');
        }
      );
    } else {
      // Fallback to San Diego if geolocation not available
      fetchWeatherByLocation('San Diego');
    }
  }, [weather, fetchWeatherByCoords, fetchWeatherByLocation]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-md p-4 text-white">
        <div className="animate-pulse">
          <div className="h-5 bg-blue-400 dark:bg-blue-500 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-blue-400 dark:bg-blue-500 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-md p-4 text-white">
        <h2 className="text-lg font-semibold mb-2">Weather</h2>
        <p className="text-sm text-blue-100 dark:text-blue-200">{error}</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-md p-4 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-4 h-4" />
        <h2 className="text-lg font-semibold">Weather</h2>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-3xl font-bold">{weather.temp}°F</div>
          <div className="text-xs text-blue-100 dark:text-blue-200 mt-1">{weather.condition}</div>
        </div>
        <div>
          {weather.icon && parseInt(weather.icon) < 200 ? (
            <Sun className="w-10 h-10" />
          ) : (
            <Cloud className="w-10 h-10" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-blue-100 dark:text-blue-200 mb-2">
        <MapPin className="w-3 h-3" />
        <span>{weather.location}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-400/30 dark:border-blue-500/30 text-xs">
        <div className="flex items-center gap-1">
          <Droplets className="w-3 h-3" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          <span>{weather.windSpeed} mph</span>
        </div>
      </div>
    </div>
  );
}
