'use client';

import { useEffect, useState } from 'react';
import { Star, StarOff, Search } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  logo?: string;
  sport: string;
  league: string;
  leagueName: string;
  type: 'pro' | 'college';
}

interface SportsTeamSettingsContentProps {
  selectedTeams: string[];
  favoriteTeams: string[];
  onTeamsChange: (teamIds: string[]) => void;
  onFavoritesChange: (teamIds: string[]) => void;
}

export default function SportsTeamSettingsContent({
  selectedTeams,
  favoriteTeams,
  onTeamsChange,
  onFavoritesChange,
}: SportsTeamSettingsContentProps) {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'pro' | 'college'>('all');
  const [filterLeague, setFilterLeague] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  useEffect(() => {
    fetchAllTeams();
  }, []);

  const fetchAllTeams = async () => {
    try {
      const response = await fetch('/api/espn-all-teams');
      const data = await response.json();
      setAllTeams(data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create unique team identifier combining ID, sport, and league
  const getTeamKey = (team: Team): string => {
    return `${team.id}-${team.sport}-${team.league}`;
  };

  const toggleTeam = (team: Team) => {
    const teamKey = getTeamKey(team);
    if (selectedTeams.includes(teamKey)) {
      onTeamsChange(selectedTeams.filter(id => id !== teamKey));
    } else {
      onTeamsChange([...selectedTeams, teamKey]);
    }
  };

  const toggleFavorite = (team: Team) => {
    const teamKey = getTeamKey(team);
    if (favoriteTeams.includes(teamKey)) {
      onFavoritesChange(favoriteTeams.filter(id => id !== teamKey));
    } else {
      onFavoritesChange([...favoriteTeams, teamKey]);
    }
  };

  // Normalize city names: remove accents, handle variations
  const normalizeCity = (city: string): string => {
    if (!city) return '';
    // Remove accents and diacritics
    return city
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Get base city name (e.g., "San Diego" from "San Diego State")
  const getBaseCity = (city: string): string => {
    if (!city) return '';
    const normalized = normalizeCity(city);
    // Remove common suffixes
    return normalized
      .replace(/\s+(state|university|college|u)$/i, '')
      .replace(/\s+(city|town)$/i, '')
      .trim();
  };

  // Group cities by their base name
  // This ensures "San Diego" and "San Diego State" are grouped together
  const cityMap = new Map<string, string>();
  const cityDisplayNames = new Map<string, string>();
  
  allTeams.forEach(team => {
    if (team.location) {
      const baseCity = getBaseCity(team.location);
      if (baseCity) {
        // Store the base city key
        if (!cityMap.has(baseCity)) {
          // Prefer shorter names (e.g., "San Diego" over "San Diego State")
          cityMap.set(baseCity, team.location);
          cityDisplayNames.set(baseCity, team.location);
        } else {
          // If current location is shorter, use it as display name
          const currentDisplay = cityDisplayNames.get(baseCity) || '';
          if (team.location.length < currentDisplay.length) {
            cityDisplayNames.set(baseCity, team.location);
          }
        }
      }
    }
  });

  // Use display names, sorted by base city name
  const cities = Array.from(cityDisplayNames.values()).sort((a, b) => {
    const baseA = getBaseCity(a);
    const baseB = getBaseCity(b);
    return baseA.localeCompare(baseB);
  });

  const leagues = Array.from(new Set(allTeams.map(t => t.leagueName).filter(Boolean))).sort();

  const filteredTeams = allTeams.filter(team => {
    const teamKey = getTeamKey(team);
    const searchLower = normalizeCity(searchTerm);
    const teamName = normalizeCity(team.name || '');
    const teamLocation = normalizeCity(team.location || '');
    
    const matchesSearch = !searchTerm || 
      teamName.includes(searchLower) || 
      teamLocation.includes(searchLower);
    
    // Match city by base name
    const matchesCity = filterCity === 'all' || 
      getBaseCity(team.location || '') === getBaseCity(filterCity);
    
    const matchesType = filterType === 'all' || team.type === filterType;
    const matchesLeague = filterLeague === 'all' || (team.leagueName || '') === filterLeague;
    const matchesFavorites = !showFavoritesOnly || favoriteTeams.includes(teamKey);
    const matchesSelected = !showSelectedOnly || selectedTeams.includes(teamKey);
    
    return matchesSearch && matchesCity && matchesType && matchesLeague && matchesFavorites && matchesSelected;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>



        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'pro' | 'college')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
            >
              <option value="all">All Types</option>
              <option value="pro">Professional</option>
              <option value="college">College</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              League
            </label>
            <select
              value={filterLeague}
              onChange={(e) => setFilterLeague(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
            >
              <option value="all">All Leagues</option>
              {leagues.map(league => (
                <option key={league} value={league}>{league}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Favorites ⭐</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSelectedOnly}
              onChange={(e) => setShowSelectedOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected ✅</span>
          </label>
        </div>
      </div>

      {/* Teams List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading teams...</div>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No teams found matching your filters.
            </div>
          ) : (
            filteredTeams.map((team, index) => {
              const teamKey = getTeamKey(team);
              return (
              <div
                key={`${teamKey}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                  selectedTeams.includes(teamKey)
                    ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {team.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{team.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {team.location} • {team.leagueName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(team)}
                    className={`p-2 rounded transition-colors ${
                      favoriteTeams.includes(teamKey)
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                    title={favoriteTeams.includes(teamKey) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favoriteTeams.includes(teamKey) ? (
                      <Star className="w-5 h-5 fill-current" />
                    ) : (
                      <StarOff className="w-5 h-5" />
                    )}
                  </button>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(teamKey)}
                      onChange={() => toggleTeam(team)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>
            );
            })
          )}
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  );
}

