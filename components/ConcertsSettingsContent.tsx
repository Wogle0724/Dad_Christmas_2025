'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, MapPin, Star, Music } from 'lucide-react';
import { useDataCache } from '@/lib/DataCacheContext';

export default function ConcertsSettingsContent() {
  const { concertPreferences, setConcertPreferences } = useDataCache();
  const [newArtist, setNewArtist] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [locationCity, setLocationCity] = useState(concertPreferences.location.city || '');
  const [locationState, setLocationState] = useState(concertPreferences.location.stateCode || '');
  const [artistSuggestions, setArtistSuggestions] = useState<string[]>([]);
  const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);
  const [showArtistSuggestions, setShowArtistSuggestions] = useState(false);
  const [showGenreSuggestions, setShowGenreSuggestions] = useState(false);
  const artistInputRef = useRef<HTMLInputElement>(null);
  const genreInputRef = useRef<HTMLInputElement>(null);
  const artistSuggestionsRef = useRef<HTMLDivElement>(null);
  const genreSuggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch artist suggestions from API
  useEffect(() => {
    if (newArtist.trim().length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const params = new URLSearchParams();
          if (concertPreferences.location.city) {
            params.append('city', concertPreferences.location.city);
            if (concertPreferences.location.stateCode) {
              params.append('stateCode', concertPreferences.location.stateCode);
            }
          } else if (concertPreferences.location.lat && concertPreferences.location.lon) {
            params.append('lat', concertPreferences.location.lat.toString());
            params.append('lon', concertPreferences.location.lon.toString());
            params.append('radius', '50');
          } else {
            params.append('city', 'San Diego');
            params.append('stateCode', 'CA');
          }
          params.append('keyword', newArtist.trim());
          params.append('size', '10');

          const response = await fetch(`/api/ticketmaster?${params.toString()}`);
          const data = await response.json();
          
          if (data.events && data.events.length > 0) {
            // Extract unique artists from events
            const artists = new Set<string>();
            data.events.forEach((event: any) => {
              if (event.artist && event.artist.toLowerCase().includes(newArtist.trim().toLowerCase())) {
                artists.add(event.artist);
              }
            });
            setArtistSuggestions(Array.from(artists).slice(0, 8));
            setShowArtistSuggestions(true);
          } else {
            setArtistSuggestions([]);
            setShowArtistSuggestions(false);
          }
        } catch (error) {
          console.error('Error fetching artist suggestions:', error);
          setArtistSuggestions([]);
        }
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setArtistSuggestions([]);
      setShowArtistSuggestions(false);
    }
  }, [newArtist, concertPreferences.location]);

  // Fetch genre suggestions from API
  useEffect(() => {
    if (newGenre.trim().length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const params = new URLSearchParams();
          if (concertPreferences.location.city) {
            params.append('city', concertPreferences.location.city);
            if (concertPreferences.location.stateCode) {
              params.append('stateCode', concertPreferences.location.stateCode);
            }
          } else if (concertPreferences.location.lat && concertPreferences.location.lon) {
            params.append('lat', concertPreferences.location.lat.toString());
            params.append('lon', concertPreferences.location.lon.toString());
            params.append('radius', '50');
          } else {
            params.append('city', 'San Diego');
            params.append('stateCode', 'CA');
          }
          params.append('size', '20');

          const response = await fetch(`/api/ticketmaster?${params.toString()}`);
          const data = await response.json();
          
          if (data.events && data.events.length > 0) {
            // Extract unique genres from events
            const genres = new Set<string>();
            data.events.forEach((event: any) => {
              if (event.genre && event.genre.toLowerCase().includes(newGenre.trim().toLowerCase())) {
                genres.add(event.genre);
              }
            });
            setGenreSuggestions(Array.from(genres).slice(0, 8));
            setShowGenreSuggestions(true);
          } else {
            setGenreSuggestions([]);
            setShowGenreSuggestions(false);
          }
        } catch (error) {
          console.error('Error fetching genre suggestions:', error);
          setGenreSuggestions([]);
        }
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setGenreSuggestions([]);
      setShowGenreSuggestions(false);
    }
  }, [newGenre, concertPreferences.location]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        artistSuggestionsRef.current &&
        !artistSuggestionsRef.current.contains(event.target as Node) &&
        artistInputRef.current &&
        !artistInputRef.current.contains(event.target as Node)
      ) {
        setShowArtistSuggestions(false);
      }
      if (
        genreSuggestionsRef.current &&
        !genreSuggestionsRef.current.contains(event.target as Node) &&
        genreInputRef.current &&
        !genreInputRef.current.contains(event.target as Node)
      ) {
        setShowGenreSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addArtist = (artist?: string) => {
    const artistToAdd = artist || newArtist.trim();
    if (artistToAdd && !concertPreferences.favoriteArtists.includes(artistToAdd)) {
      setConcertPreferences({
        ...concertPreferences,
        favoriteArtists: [...concertPreferences.favoriteArtists, artistToAdd],
      });
      setNewArtist('');
      setShowArtistSuggestions(false);
    }
  };

  const selectArtistSuggestion = (artist: string) => {
    addArtist(artist);
  };

  const removeArtist = (artist: string) => {
    setConcertPreferences({
      ...concertPreferences,
      favoriteArtists: concertPreferences.favoriteArtists.filter(a => a !== artist),
    });
  };

  const addGenre = (genre?: string) => {
    const genreToAdd = genre || newGenre.trim();
    if (genreToAdd && !concertPreferences.favoriteGenres.includes(genreToAdd)) {
      setConcertPreferences({
        ...concertPreferences,
        favoriteGenres: [...concertPreferences.favoriteGenres, genreToAdd],
      });
      setNewGenre('');
      setShowGenreSuggestions(false);
    }
  };

  const selectGenreSuggestion = (genre: string) => {
    addGenre(genre);
  };

  const removeGenre = (genre: string) => {
    setConcertPreferences({
      ...concertPreferences,
      favoriteGenres: concertPreferences.favoriteGenres.filter(g => g !== genre),
    });
  };

  const updateLocation = () => {
    setConcertPreferences({
      ...concertPreferences,
      location: {
        city: locationCity || undefined,
        stateCode: locationState || undefined,
        lat: concertPreferences.location.lat,
        lon: concertPreferences.location.lon,
      },
    });
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setConcertPreferences({
            ...concertPreferences,
            location: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              city: concertPreferences.location.city,
              stateCode: concertPreferences.location.stateCode,
            },
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location
        </h3>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="San Diego"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State Code
              </label>
              <input
                type="text"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={updateLocation}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Save Location
            </button>
            <button
              onClick={useCurrentLocation}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Use Current Location
            </button>
          </div>
          {(concertPreferences.location.lat && concertPreferences.location.lon) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Using coordinates: {concertPreferences.location.lat.toFixed(4)}, {concertPreferences.location.lon.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Favorite Artists */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Favorite Artists
        </h3>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={artistInputRef}
                type="text"
                value={newArtist}
                onChange={(e) => {
                  setNewArtist(e.target.value);
                  setShowArtistSuggestions(true);
                }}
                onFocus={() => {
                  if (artistSuggestions.length > 0) {
                    setShowArtistSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (artistSuggestions.length > 0 && showArtistSuggestions) {
                      selectArtistSuggestion(artistSuggestions[0]);
                    } else {
                      addArtist();
                    }
                  } else if (e.key === 'Escape') {
                    setShowArtistSuggestions(false);
                  }
                }}
                placeholder="Enter artist name..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {showArtistSuggestions && artistSuggestions.length > 0 && (
                <div
                  ref={artistSuggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {artistSuggestions.map((artist, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectArtistSuggestion(artist)}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-900 dark:text-gray-100 text-sm transition-colors"
                    >
                      {artist}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => addArtist()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          {artistSuggestions.length > 0 && showArtistSuggestions && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Suggestions from upcoming concerts in your area
            </p>
          )}
          {concertPreferences.favoriteArtists.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {concertPreferences.favoriteArtists.map((artist) => (
                <div
                  key={artist}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-full"
                >
                  <span className="text-sm font-medium">{artist}</span>
                  <button
                    onClick={() => removeArtist(artist)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No favorite artists yet. Add artists to see their concerts first!
            </p>
          )}
        </div>
      </div>

      {/* Favorite Genres */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Music className="w-5 h-5" />
          Favorite Genres
        </h3>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={genreInputRef}
                type="text"
                value={newGenre}
                onChange={(e) => {
                  setNewGenre(e.target.value);
                  setShowGenreSuggestions(true);
                }}
                onFocus={() => {
                  if (genreSuggestions.length > 0) {
                    setShowGenreSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (genreSuggestions.length > 0 && showGenreSuggestions) {
                      selectGenreSuggestion(genreSuggestions[0]);
                    } else {
                      addGenre();
                    }
                  } else if (e.key === 'Escape') {
                    setShowGenreSuggestions(false);
                  }
                }}
                placeholder="Enter genre (e.g., Rock, Pop, Jazz)..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {showGenreSuggestions && genreSuggestions.length > 0 && (
                <div
                  ref={genreSuggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {genreSuggestions.map((genre, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectGenreSuggestion(genre)}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-900 dark:text-gray-100 text-sm transition-colors"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => addGenre()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          {genreSuggestions.length > 0 && showGenreSuggestions && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Suggestions from upcoming concerts in your area
            </p>
          )}
          {concertPreferences.favoriteGenres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {concertPreferences.favoriteGenres.map((genre) => (
                <div
                  key={genre}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                >
                  <span className="text-sm font-medium">{genre}</span>
                  <button
                    onClick={() => removeGenre(genre)}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No favorite genres yet. Add genres to filter concerts!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

