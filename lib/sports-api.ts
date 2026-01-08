import { Match, Team, League, SportCategory } from '@/types/sports'
import { getLeagueById, LEAGUES } from '@/data/leagues'

/**
 * Fetch upcoming matches for a league
 */
export async function fetchUpcomingMatches(leagueId: string): Promise<Match[]> {
  try {
    const url = `/api/sports?endpoint=next_events_league&leagueId=${leagueId}`
    console.log('[Sports] Fetching upcoming matches for league:', leagueId)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[Sports] API error:', response.status)
      return []
    }
    
    const data = await response.json()
    const events = data.events || []
    
    console.log('[Sports] Raw events:', events.length)
    
    return events.map((event: any) => parseEvent(event, leagueId)).filter(Boolean) as Match[]
  } catch (error) {
    console.error('[Sports] Error fetching upcoming matches:', error)
    return []
  }
}

/**
 * Fetch past matches for a league (for testing/demo)
 */
export async function fetchPastMatches(leagueId: string): Promise<Match[]> {
  try {
    const url = `/api/sports?endpoint=past_events_league&leagueId=${leagueId}`
    console.log('[Sports] Fetching past matches for league:', leagueId)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[Sports] API error:', response.status)
      return []
    }
    
    const data = await response.json()
    const events = data.events || []
    
    return events.map((event: any) => parseEvent(event, leagueId)).filter(Boolean) as Match[]
  } catch (error) {
    console.error('[Sports] Error fetching past matches:', error)
    return []
  }
}

/**
 * Fetch match details by ID
 */
export async function fetchMatchDetails(matchId: string): Promise<Match | null> {
  try {
    const url = `/api/sports?endpoint=event_details&eventId=${matchId}`
    console.log('[Sports] Fetching match details:', matchId)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[Sports] API error:', response.status)
      return null
    }
    
    const data = await response.json()
    const event = data.events?.[0]
    
    if (!event) return null
    
    return parseEvent(event, event.idLeague)
  } catch (error) {
    console.error('[Sports] Error fetching match details:', error)
    return null
  }
}

/**
 * Fetch teams in a league
 */
export async function fetchTeamsInLeague(leagueId: string): Promise<Team[]> {
  try {
    const url = `/api/sports?endpoint=teams_in_league&leagueId=${leagueId}`
    console.log('[Sports] Fetching teams for league:', leagueId)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[Sports] API error:', response.status)
      return []
    }
    
    const data = await response.json()
    const teams = data.teams || []
    
    return teams.map((team: any) => ({
      id: team.idTeam,
      name: team.strTeam,
      shortName: team.strTeamShort,
      logo: team.strTeamBadge,
      country: team.strCountry,
    }))
  } catch (error) {
    console.error('[Sports] Error fetching teams:', error)
    return []
  }
}

/**
 * Parse TheSportsDB event to our Match format
 */
function parseEvent(event: any, leagueId: string): Match | null {
  if (!event) return null
  
  const league = getLeagueById(leagueId) || {
    id: leagueId,
    name: event.strLeague || 'Unknown League',
    sport: 'soccer' as SportCategory,
  }
  
  // Determine match status
  let status: Match['status'] = 'scheduled'
  if (event.strStatus === 'Match Finished' || event.intHomeScore !== null) {
    status = 'finished'
  } else if (event.strStatus === 'Postponed') {
    status = 'postponed'
  } else if (event.strStatus === 'Cancelled') {
    status = 'cancelled'
  } else if (event.strStatus?.includes('Live') || event.strProgress) {
    status = 'live'
  }
  
  // Parse scores (may be null for upcoming matches)
  const homeScore = event.intHomeScore !== null ? parseInt(event.intHomeScore) : undefined
  const awayScore = event.intAwayScore !== null ? parseInt(event.intAwayScore) : undefined
  
  return {
    id: event.idEvent,
    homeTeam: {
      id: event.idHomeTeam || 'unknown',
      name: event.strHomeTeam,
      logo: event.strHomeTeamBadge,
    },
    awayTeam: {
      id: event.idAwayTeam || 'unknown',
      name: event.strAwayTeam,
      logo: event.strAwayTeamBadge,
    },
    league,
    startTime: new Date(event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}Z`),
    venue: event.strVenue,
    status,
    homeScore,
    awayScore,
    round: event.intRound?.toString(),
    season: event.strSeason,
  }
}

/**
 * Format match time for display
 */
export function formatMatchTime(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) {
    return 'Finished'
  } else if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours <= 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 0 ? 'Starting soon' : `In ${minutes}m`
    }
    return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days === 1) {
    return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Get sport icon
 */
export function getSportIcon(sport: SportCategory): string {
  const icons: Record<SportCategory, string> = {
    soccer: '⚽',
    basketball: '🏀',
    american_football: '🏈',
    hockey: '🏒',
    baseball: '⚾',
    esports: '🎮',
  }
  return icons[sport] || '🏆'
}

/**
 * Calculate oracle output based on match result
 */
export function calculateOracleOutput(
  match: Match,
  outputType: 'winner' | 'score' | 'total_goals' | 'both_teams_score'
): number | null {
  if (match.homeScore === undefined || match.awayScore === undefined) {
    return null // Match not finished
  }
  
  switch (outputType) {
    case 'winner':
      if (match.homeScore > match.awayScore) return 1 // Home win
      if (match.awayScore > match.homeScore) return 2 // Away win
      return 0 // Draw
    
    case 'score':
      // Pack score as home*100 + away (e.g., 3-2 = 302)
      return match.homeScore * 100 + match.awayScore
    
    case 'total_goals':
      return match.homeScore + match.awayScore
    
    case 'both_teams_score':
      return (match.homeScore > 0 && match.awayScore > 0) ? 1 : 0
    
    default:
      return null
  }
}

/**
 * Generate mock esports matches (since TheSportsDB doesn't have good esports coverage)
 */
export function generateMockEsportsMatches(): Match[] {
  const esportsLeagues = LEAGUES.filter(l => l.sport === 'esports')
  const teams = [
    { name: 'T1', logo: '' },
    { name: 'Gen.G', logo: '' },
    { name: 'Cloud9', logo: '' },
    { name: 'Fnatic', logo: '' },
    { name: 'G2 Esports', logo: '' },
    { name: 'Team Liquid', logo: '' },
    { name: 'Natus Vincere', logo: '' },
    { name: 'FaZe Clan', logo: '' },
    { name: 'Sentinels', logo: '' },
    { name: 'DRX', logo: '' },
  ]
  
  const matches: Match[] = []
  const now = new Date()
  
  esportsLeagues.forEach((league, leagueIndex) => {
    for (let i = 0; i < 3; i++) {
      const homeIdx = (leagueIndex * 2 + i) % teams.length
      const awayIdx = (homeIdx + 1 + i) % teams.length
      
      matches.push({
        id: `esports-${league.id}-${i}`,
        homeTeam: {
          id: `team-${homeIdx}`,
          name: teams[homeIdx].name,
          logo: teams[homeIdx].logo,
        },
        awayTeam: {
          id: `team-${awayIdx}`,
          name: teams[awayIdx].name,
          logo: teams[awayIdx].logo,
        },
        league,
        startTime: new Date(now.getTime() + (1 + i + leagueIndex) * 24 * 60 * 60 * 1000),
        venue: 'Online',
        status: 'scheduled',
        round: 'Playoffs',
        season: '2025',
      })
    }
  })
  
  return matches
}


