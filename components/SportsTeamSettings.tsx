'use client';

import { useEffect, useState } from 'react';
import { X, Star, StarOff, Search } from 'lucide-react';

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

interface SportsTeamSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeams: string[];
  favoriteTeams: string[];
  onTeamsChange: (teamIds: string[]) => void;
  onFavoritesChange: (teamIds: string[]) => void;
}

export default function SportsTeamSettings({
  isOpen,
  onClose,
  selectedTeams,
  favoriteTeams,
  onTeamsChange,
  onFavoritesChange,
}: SportsTeamSettingsProps) {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'pro' | 'college'>('all');
  const [filterLeague, setFilterLeague] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchAllTeams();
    }
  }, [isOpen]);

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

  const toggleTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      onTeamsChange(selectedTeams.filter(id => id !== teamId));
    } else {
      onTeamsChange([...selectedTeams, teamId]);
    }
  };

  const toggleFavorite = (teamId: string) => {
    if (favoriteTeams.includes(teamId)) {
      onFavoritesChange(favoriteTeams.filter(id => id !== teamId));
    } else {
      onFavoritesChange([...favoriteTeams, teamId]);
    }
  };

  const cities = Array.from(new Set(allTeams.map(t => t.location))).sort();
  const leagues = Array.from(new Set(allTeams.map(t => t.leagueName))).sort();

  const filteredTeams = allTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === 'all' || team.location === filterCity;
    const matchesType = filterType === 'all' || team.type === filterType;
    const matchesLeague = filterLeague === 'all' || team.leagueName === filterLeague;
    
    return matchesSearch && matchesCity && matchesType && matchesLeague;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Sports Team Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'pro' | 'college')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="pro">Professional</option>
                  <option value="college">College</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League
                </label>
                <select
                  value={filterLeague}
                  onChange={(e) => setFilterLeague(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Leagues</option>
                  {leagues.map(league => (
                    <option key={league} value={league}>{league}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Teams List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-gray-500">Loading teams...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTeams.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No teams found matching your filters.
                </div>
              ) : (
                filteredTeams.map(team => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                      selectedTeams.includes(team.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
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
                        <div className="font-semibold text-gray-800">{team.name}</div>
                        <div className="text-sm text-gray-500">
                          {team.location} • {team.leagueName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(team.id)}
                        className={`p-2 rounded transition-colors ${
                          favoriteTeams.includes(team.id)
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                        title={favoriteTeams.includes(team.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {favoriteTeams.includes(team.id) ? (
                          <Star className="w-5 h-5 fill-current" />
                        ) : (
                          <StarOff className="w-5 h-5" />
                        )}
                      </button>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => toggleTeam(team.id)}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

