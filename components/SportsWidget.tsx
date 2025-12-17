'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trophy, Calendar, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useDataCache } from '@/lib/DataCacheContext';

interface Game {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  date: string;
  eventId?: string;
}

interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  image?: string;
}

interface TeamRecord {
  wins: number;
  losses: number;
  ties?: number;
  displayValue?: string;
}

interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  logo?: string;
  sport: string;
  league: string;
  leagueName: string;
  type: 'pro' | 'college';
  color?: string;
  alternateColor?: string;
  record?: TeamRecord;
  game?: Game;
  news?: NewsItem[];
}

interface SportsData {
  teams: TeamData[];
  timestamp: number;
}

export default function SportsWidget() {
  const { sports, setSports, teamPreferences } = useDataCache();
  const [loading, setLoading] = useState(!sports);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchTeamData = useCallback(async (teamId: string, sport: string, league: string) => {
    try {
      // Fetch news
      console.log(`[SportsWidget] Fetching news for teamId=${teamId}, sport=${sport}, league=${league}`);
      const newsResponse = await fetch(`/api/espn-news?sport=${sport}&league=${league}&teamId=${teamId}&limit=3`);
      const newsData = await newsResponse.json();
      console.log(`[SportsWidget] News API response:`, {
        hasArticles: !!newsData.articles,
        articleCount: newsData.articles?.length || 0,
        error: newsData.error,
        rawResponse: newsData,
      });
      
      const news: NewsItem[] = (newsData.articles || []).map((article: any) => {
        console.log(`[SportsWidget] Processing article:`, {
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          image: article.image,
          fullArticle: article,
        });
        return {
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          image: article.image,
        };
      });
      
      console.log(`[SportsWidget] Final news array:`, news);

      // Fetch team info and schedule
      const teamInfoResponse = await fetch(`/api/espn-team-info?sport=${sport}&league=${league}&teamId=${teamId}`);
      const teamInfoData = await teamInfoResponse.json();

      // Extract record
      let record: TeamRecord | undefined;
      if (teamInfoData.team?.record?.items?.[0]) {
        const recordItem = teamInfoData.team.record.items[0];
        const wins = recordItem.stats?.find((s: any) => s.name === 'wins')?.value || 0;
        const losses = recordItem.stats?.find((s: any) => s.name === 'losses')?.value || 0;
        const ties = recordItem.stats?.find((s: any) => s.name === 'ties')?.value;
        record = {
          wins,
          losses,
          ties,
          displayValue: recordItem.summary || `${wins}-${losses}${ties ? `-${ties}` : ''}`,
        };
      }

      // Find current or next game
      let game: Game | undefined;

      // First, check today's scoreboard for live/current games
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const scoreboardResponse = await fetch(`/api/espn-scoreboard?sport=${sport}&league=${league}&dates=${today}`);
      const scoreboardData = await scoreboardResponse.json();

      if (scoreboardData.events) {
        const teamGame = scoreboardData.events.find((event: any) => {
          return event.competitions?.[0]?.competitors?.some((comp: any) => comp.team?.id === teamId);
        });

        if (teamGame) {
          const competition = teamGame.competitions[0];
          const homeComp = competition.competitors.find((c: any) => c.homeAway === 'home');
          const awayComp = competition.competitors.find((c: any) => c.homeAway === 'away');

          game = {
            homeTeam: homeComp?.team?.displayName || homeComp?.team?.name || 'TBD',
            awayTeam: awayComp?.team?.displayName || awayComp?.team?.name || 'TBD',
            homeScore: homeComp?.score ? parseInt(homeComp.score) : undefined,
            awayScore: awayComp?.score ? parseInt(awayComp.score) : undefined,
            status: competition.status?.type?.description || competition.status?.type?.shortDetail || 'Scheduled',
            date: teamGame.date,
            eventId: teamGame.id,
          };
        }
      }

      // If no current game, check schedule for next game
      if (!game && teamInfoData.schedule?.events) {
        const upcomingGame = teamInfoData.schedule.events.find((event: any) => {
          const eventDate = new Date(event.date);
          return eventDate >= new Date();
        });

        if (upcomingGame) {
          const competition = upcomingGame.competitions?.[0];
          const homeComp = competition?.competitors?.find((c: any) => c.homeAway === 'home');
          const awayComp = competition?.competitors?.find((c: any) => c.homeAway === 'away');

          game = {
            homeTeam: homeComp?.team?.displayName || homeComp?.team?.name || 'TBD',
            awayTeam: awayComp?.team?.displayName || awayComp?.team?.name || 'TBD',
            homeScore: homeComp?.score ? parseInt(homeComp.score) : undefined,
            awayScore: awayComp?.score ? parseInt(awayComp.score) : undefined,
            status: competition?.status?.type?.description || competition?.status?.type?.shortDetail || 'Scheduled',
            date: upcomingGame.date,
            eventId: upcomingGame.id,
          };
        }
      }

      return { news, game, record };
    } catch (error) {
      console.error(`Error fetching data for team ${teamId}:`, error);
      return { news: [], game: undefined, record: undefined };
    }
  }, []);

  const fetchAllTeamsData = useCallback(async () => {
    if (teamPreferences.selectedTeams.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true); // Ensure loading state is set
    try {
      // First, get all teams to get team details
      const allTeamsResponse = await fetch('/api/espn-all-teams');
      const allTeamsData = await allTeamsResponse.json();
      interface TeamInfo {
        id: string;
        name: string;
        abbreviation: string;
        location: string;
        logo?: string;
        sport: string;
        league: string;
        leagueName: string;
        type: 'pro' | 'college';
        color?: string;
        alternateColor?: string;
      }
      // Helper function to normalize hex color (add # if missing)
      const normalizeHexColor = (color: string | undefined): string | undefined => {
        if (!color || color.trim() === '') return undefined;
        const trimmed = color.trim();
        // If it doesn't start with #, add it
        return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      };

      // Create map with composite keys: id-sport-league
      const allTeamsMap = new Map<string, TeamInfo>();
      (allTeamsData.teams || []).forEach((team: any) => {
        const teamInfo = team as TeamInfo;
        const compositeKey = `${teamInfo.id}-${teamInfo.sport}-${teamInfo.league}`;
        // Normalize colors to always have # prefix
        if (teamInfo.color) {
          teamInfo.color = normalizeHexColor(teamInfo.color);
        }
        if (teamInfo.alternateColor) {
          teamInfo.alternateColor = normalizeHexColor(teamInfo.alternateColor);
        }
        allTeamsMap.set(compositeKey, teamInfo);
      });

      const teamsData: TeamData[] = [];

      for (const teamKey of teamPreferences.selectedTeams) {
        const teamInfo = allTeamsMap.get(teamKey);
        if (!teamInfo || !teamInfo.sport || !teamInfo.league) {
          continue;
        }

        const { news, game, record } = await fetchTeamData(
          teamInfo.id,
          teamInfo.sport,
          teamInfo.league
        );

        // Only use defaults if color is truly missing (null/undefined/empty)
        // Don't override valid colors with defaults
        // Colors are already normalized with # prefix from the map
        const teamColor = teamInfo.color && teamInfo.color.trim() !== '' ? teamInfo.color : undefined;
        const teamAltColor = teamInfo.alternateColor && teamInfo.alternateColor.trim() !== '' ? teamInfo.alternateColor : undefined;

        // Only log for selected teams
        console.log(`[SportsWidget] Selected team: ${teamInfo.name}`, {
          color: teamColor || 'using fallback #EAB308',
          alternateColor: teamAltColor || 'using fallback #F97316',
        });

        teamsData.push({
          id: teamKey, // Use composite key as ID
          name: teamInfo.name || 'Unknown Team',
          abbreviation: teamInfo.abbreviation || '',
          location: teamInfo.location || 'Unknown',
          logo: teamInfo.logo,
          sport: teamInfo.sport,
          league: teamInfo.league,
          leagueName: teamInfo.leagueName || teamInfo.league,
          type: teamInfo.type || 'pro',
          color: teamColor, // Store actual color or undefined
          alternateColor: teamAltColor, // Store actual alternate color or undefined
          record,
          game,
          news,
        });
      }

      // Sort: favorites first, then by name
      const sortedTeams = teamsData.sort((a, b) => {
        // a.id is now the composite key
        const aIsFavorite = teamPreferences.favoriteTeams.includes(a.id);
        const bIsFavorite = teamPreferences.favoriteTeams.includes(b.id);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return a.name.localeCompare(b.name);
      });

      const sportsData: SportsData = {
        teams: sortedTeams,
        timestamp: Date.now(),
      };

      // Only log summary for selected teams
      console.log(`[SportsWidget] Loaded ${sortedTeams.length} team(s) with colors:`, 
        sortedTeams.map(t => `${t.name} (${t.color || 'default'}/${t.alternateColor || 'default'})`).join(', ')
      );

      setSports(sportsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sports data:', error);
      setLoading(false);
    }
  }, [teamPreferences.selectedTeams, teamPreferences.favoriteTeams, fetchTeamData, setSports]);

  useEffect(() => {
    // Always fetch if we have selected teams but no sports data, or if teams changed
    if (teamPreferences.selectedTeams.length > 0) {
      if (!sports || sports.teams.length === 0) {
        // No cached data, fetch immediately
        fetchAllTeamsData();
      } else {
        // Check if cached data matches current preferences
        const cachedTeamIds = sports.teams.map(t => t.id).sort().join(',');
        const currentTeamIds = [...teamPreferences.selectedTeams].sort().join(',');
        // Also check if colors are missing (might be old cache)
        const hasColors = sports.teams.every(t => t.color && t.color.trim() !== '');
        const cacheAge = Date.now() - sports.timestamp;
        const isCacheStale = cacheAge > 5 * 60 * 1000; // 5 minutes
        
        if (cachedTeamIds !== currentTeamIds || !hasColors || isCacheStale) {
          // Preferences changed, colors missing, or cache is stale - refetch
          fetchAllTeamsData();
        } else {
          setLoading(false);
        }
      }
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sports, teamPreferences.selectedTeams]);

  const nextTeam = () => {
    if (!sports) return;
    setCurrentIndex((prev) => (prev + 1) % sports.teams.length);
  };

  const prevTeam = () => {
    if (!sports) return;
    setCurrentIndex((prev) => (prev - 1 + sports.teams.length) % sports.teams.length);
  };

  if (loading) {
    return (
      <div 
        className="rounded-xl shadow-md p-4 text-white"
        style={{
          background: 'linear-gradient(to bottom right, #EAB308, #F97316)',
        }}
      >
        <div className="animate-pulse">
          <div className="h-5 bg-white/30 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-white/30 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!sports || sports.teams.length === 0) {
    return (
      <div 
        className="rounded-xl shadow-md p-4 text-white"
        style={{
          background: 'linear-gradient(to bottom right, #EAB308, #F97316)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4" />
          <h2 className="text-lg font-semibold">Sports</h2>
        </div>
        <p className="text-sm opacity-90">No teams selected. Go to Settings → Sports Teams to add teams.</p>
      </div>
    );
  }

  const currentTeam = sports.teams[currentIndex];
  const isHome = currentTeam.game?.homeTeam.toLowerCase().includes(currentTeam.name.toLowerCase().split(' ').pop()?.toLowerCase() || '');
  const isAway = currentTeam.game?.awayTeam.toLowerCase().includes(currentTeam.name.toLowerCase().split(' ').pop()?.toLowerCase() || '');

  // Convert hex color to RGB for opacity support
  const hexToRgb = (hex: string | undefined): string => {
    if (!hex) return 'rgb(234, 179, 8)'; // Default yellow-500
    // Remove # if present
    let cleanHex = hex.replace('#', '');
    // Handle 3-character hex codes
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    if (!result) return 'rgb(234, 179, 8)';
    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
  };

  // Normalize colors to ensure they have # prefix for CSS
  const normalizeColor = (color: string | undefined): string => {
    if (!color || color.trim() === '') return '#EAB308'; // yellow-500 as fallback
    const trimmed = color.trim();
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  };

  // Get team colors - use actual colors if available, otherwise use defaults
  // Only use defaults if color is truly missing (undefined, null, or empty string)
  const primaryColor = normalizeColor(currentTeam.color);
  const secondaryColor = normalizeColor(currentTeam.alternateColor);
  const primaryRgb = hexToRgb(currentTeam.color);
  const secondaryRgb = hexToRgb(currentTeam.alternateColor);

  // Determine text color based on background brightness
  const getTextColor = (hex: string): string => {
    if (!hex) return 'text-white';
    const rgb = hexToRgb(hex);
    const match = rgb.match(/\d+/g);
    if (!match) return 'text-white';
    const [r, g, b] = match.map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? 'text-gray-900' : 'text-white';
  };

  const textColorClass = getTextColor(primaryColor);

  return (
    <div 
      className={`rounded-xl shadow-md p-4 relative overflow-hidden ${textColorClass}`}
      style={{
        background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <h2 className="text-lg font-semibold">{currentTeam.name}</h2>
            {teamPreferences.favoriteTeams.includes(currentTeam.id) && (
              <span className="text-xs">⭐</span>
            )}
          </div>
          {sports.teams.length > 1 && (
            <div className="flex gap-1">
              <button
                onClick={prevTeam}
                className="p-1 rounded transition-colors opacity-80 hover:opacity-100"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                aria-label="Previous team"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextTeam}
                className="p-1 rounded transition-colors opacity-80 hover:opacity-100"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                aria-label="Next team"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {/* Record */}
          {currentTeam.record && (
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            >
              <div className="text-xs font-semibold opacity-90 mb-1">Record</div>
              <div className="text-lg font-bold">
                {currentTeam.record.displayValue || `${currentTeam.record.wins}-${currentTeam.record.losses}${currentTeam.record.ties ? `-${currentTeam.record.ties}` : ''}`}
              </div>
            </div>
          )}

          {/* Game Info */}
          {currentTeam.game ? (
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            >
              <div className="text-xs font-semibold opacity-90 mb-2">
                {currentTeam.game.homeScore !== undefined || currentTeam.game.awayScore !== undefined ? 'Current Game' : 'Next Game'}
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${isAway ? 'opacity-100' : 'opacity-70'}`}>
                    {currentTeam.game.awayTeam}
                  </div>
                  {currentTeam.game.awayScore !== undefined && (
                    <div className="text-xl font-bold">{currentTeam.game.awayScore}</div>
                  )}
                </div>
                <div className="text-lg font-bold mx-2">@</div>
                <div className="flex-1 text-right">
                  <div className={`text-sm font-semibold ${isHome ? 'opacity-100' : 'opacity-70'}`}>
                    {currentTeam.game.homeTeam}
                  </div>
                  {currentTeam.game.homeScore !== undefined && (
                    <div className="text-xl font-bold">{currentTeam.game.homeScore}</div>
                  )}
                </div>
              </div>
              <div 
                className="flex items-center gap-1 text-xs pt-2 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                <Calendar className="w-3 h-3" />
                <span>{currentTeam.game.status}</span>
                {currentTeam.game.date && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{new Date(currentTeam.game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            >
              <div className="text-xs opacity-70">No upcoming games scheduled</div>
            </div>
          )}

          {/* News */}
          {currentTeam.news && currentTeam.news.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold opacity-90">Latest News</div>
              {currentTeam.news.slice(0, 3).map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded p-2 transition-opacity opacity-80 hover:opacity-100 text-xs"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 line-clamp-2">{item.title}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            >
              <div className="text-xs opacity-70">No recent news</div>
            </div>
          )}
        </div>

        {sports.teams.length > 1 && (
          <div 
            className="flex justify-center gap-1 mt-3 pt-2 border-t"
            style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            {sports.teams.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="w-2 h-2 rounded-full transition-opacity"
                style={{
                  backgroundColor: idx === currentIndex ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)',
                }}
                aria-label={`Go to ${sports.teams[idx].name}`}
              />
            ))}
          </div>
        )}
    </div>
  );
}
