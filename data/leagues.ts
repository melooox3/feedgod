import { League, SportCategory } from '@/types/sports'

// TheSportsDB League IDs
export const LEAGUES: League[] = [
  // Soccer / Football
  {
    id: '4328',
    name: 'English Premier League',
    shortName: 'EPL',
    country: 'England',
    sport: 'soccer',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  },
  {
    id: '4335',
    name: 'La Liga',
    shortName: 'La Liga',
    country: 'Spain',
    sport: 'soccer',
    icon: '🇪🇸',
  },
  {
    id: '4331',
    name: 'Bundesliga',
    shortName: 'Bundesliga',
    country: 'Germany',
    sport: 'soccer',
    icon: '🇩🇪',
  },
  {
    id: '4332',
    name: 'Serie A',
    shortName: 'Serie A',
    country: 'Italy',
    sport: 'soccer',
    icon: '🇮🇹',
  },
  {
    id: '4334',
    name: 'Ligue 1',
    shortName: 'Ligue 1',
    country: 'France',
    sport: 'soccer',
    icon: '🇫🇷',
  },
  {
    id: '4480',
    name: 'UEFA Champions League',
    shortName: 'UCL',
    country: 'Europe',
    sport: 'soccer',
    icon: '🏆',
  },
  {
    id: '4481',
    name: 'UEFA Europa League',
    shortName: 'UEL',
    country: 'Europe',
    sport: 'soccer',
    icon: '🥈',
  },
  {
    id: '4346',
    name: 'MLS',
    shortName: 'MLS',
    country: 'USA',
    sport: 'soccer',
    icon: '🇺🇸',
  },
  
  // Basketball
  {
    id: '4387',
    name: 'NBA',
    shortName: 'NBA',
    country: 'USA',
    sport: 'basketball',
    icon: '🏀',
  },
  {
    id: '4424',
    name: 'EuroLeague',
    shortName: 'EuroLeague',
    country: 'Europe',
    sport: 'basketball',
    icon: '🇪🇺',
  },
  
  // American Football
  {
    id: '4391',
    name: 'NFL',
    shortName: 'NFL',
    country: 'USA',
    sport: 'american_football',
    icon: '🏈',
  },
  {
    id: '4479',
    name: 'NCAA Football',
    shortName: 'NCAAF',
    country: 'USA',
    sport: 'american_football',
    icon: '🎓',
  },
  
  // Hockey
  {
    id: '4380',
    name: 'NHL',
    shortName: 'NHL',
    country: 'USA/Canada',
    sport: 'hockey',
    icon: '🏒',
  },
  
  // Baseball
  {
    id: '4424',
    name: 'MLB',
    shortName: 'MLB',
    country: 'USA',
    sport: 'baseball',
    icon: '⚾',
  },
  
  // Esports
  {
    id: 'esports-lol',
    name: 'League of Legends World Championship',
    shortName: 'LoL Worlds',
    sport: 'esports',
    icon: '🎮',
  },
  {
    id: 'esports-cs2',
    name: 'CS2 Major Championships',
    shortName: 'CS2 Major',
    sport: 'esports',
    icon: '🔫',
  },
  {
    id: 'esports-dota2',
    name: 'Dota 2 The International',
    shortName: 'TI',
    sport: 'esports',
    icon: '⚔️',
  },
  {
    id: 'esports-valorant',
    name: 'Valorant Champions Tour',
    shortName: 'VCT',
    sport: 'esports',
    icon: '🎯',
  },
]

// Get leagues by sport category
export function getLeaguesBySport(sport: SportCategory): League[] {
  return LEAGUES.filter(league => league.sport === sport)
}

// Get league by ID
export function getLeagueById(id: string): League | undefined {
  return LEAGUES.find(league => league.id === id)
}

// Sport category metadata
export const SPORT_CATEGORIES: { value: SportCategory; label: string; icon: string }[] = [
  { value: 'soccer', label: 'Soccer', icon: '⚽' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'american_football', label: 'American Football', icon: '🏈' },
  { value: 'hockey', label: 'Hockey', icon: '🏒' },
  { value: 'baseball', label: 'Baseball', icon: '⚾' },
  { value: 'esports', label: 'Esports', icon: '🎮' },
]
