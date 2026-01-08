import { League, SportCategory } from '@/types/sports'

// Icon names for Lucide icons - rendered in components
export type LeagueIconName = 'Flag' | 'Trophy' | 'Medal' | 'MapPin' | 'Circle' | 'Gamepad2' | 'Crosshair' | 'Swords' | 'Target'
export type SportIconName = 'Circle' | 'Dribbble' | 'Goal' | 'Flag' | 'Gamepad2'

// TheSportsDB League IDs
export const LEAGUES: League[] = [
  // Soccer / Football
  {
    id: '4328',
    name: 'English Premier League',
    shortName: 'EPL',
    country: 'England',
    sport: 'soccer',
    iconName: 'Flag',
    countryCode: 'ENG',
  },
  {
    id: '4335',
    name: 'La Liga',
    shortName: 'La Liga',
    country: 'Spain',
    sport: 'soccer',
    iconName: 'Flag',
    countryCode: 'ESP',
  },
  {
    id: '4331',
    name: 'Bundesliga',
    shortName: 'Bundesliga',
    country: 'Germany',
    sport: 'soccer',
    iconName: 'Flag',
    countryCode: 'GER',
  },
  {
    id: '4332',
    name: 'Serie A',
    shortName: 'Serie A',
    country: 'Italy',
    sport: 'soccer',
    iconName: 'Flag',
    countryCode: 'ITA',
  },
  {
    id: '4334',
    name: 'Ligue 1',
    shortName: 'Ligue 1',
    country: 'France',
    sport: 'soccer',
    iconName: 'Flag',
    countryCode: 'FRA',
  },
  {
    id: '4480',
    name: 'UEFA Champions League',
    shortName: 'UCL',
    country: 'Europe',
    sport: 'soccer',
    iconName: 'Trophy',
    countryCode: 'EUR',
  },
  {
    id: '4481',
    name: 'UEFA Europa League',
    shortName: 'UEL',
    country: 'Europe',
    sport: 'soccer',
    iconName: 'Medal',
    countryCode: 'EUR',
  },
  {
    id: '4346',
    name: 'MLS',
    shortName: 'MLS',
    country: 'USA',
    sport: 'soccer',
    iconName: 'Flag',
    countryCode: 'USA',
  },
  
  // Basketball
  {
    id: '4387',
    name: 'NBA',
    shortName: 'NBA',
    country: 'USA',
    sport: 'basketball',
    iconName: 'Circle',
    countryCode: 'USA',
  },
  {
    id: '4424',
    name: 'EuroLeague',
    shortName: 'EuroLeague',
    country: 'Europe',
    sport: 'basketball',
    iconName: 'Circle',
    countryCode: 'EUR',
  },
  
  // American Football
  {
    id: '4391',
    name: 'NFL',
    shortName: 'NFL',
    country: 'USA',
    sport: 'american_football',
    iconName: 'Flag',
    countryCode: 'USA',
  },
  {
    id: '4479',
    name: 'NCAA Football',
    shortName: 'NCAAF',
    country: 'USA',
    sport: 'american_football',
    iconName: 'Trophy',
    countryCode: 'USA',
  },
  
  // Hockey
  {
    id: '4380',
    name: 'NHL',
    shortName: 'NHL',
    country: 'USA/Canada',
    sport: 'hockey',
    iconName: 'Flag',
    countryCode: 'USA',
  },
  
  // Baseball
  {
    id: '4424',
    name: 'MLB',
    shortName: 'MLB',
    country: 'USA',
    sport: 'baseball',
    iconName: 'Circle',
    countryCode: 'USA',
  },
  
  // Esports
  {
    id: 'esports-lol',
    name: 'League of Legends World Championship',
    shortName: 'LoL Worlds',
    sport: 'esports',
    iconName: 'Gamepad2',
    countryCode: 'INT',
  },
  {
    id: 'esports-cs2',
    name: 'CS2 Major Championships',
    shortName: 'CS2 Major',
    sport: 'esports',
    iconName: 'Crosshair',
    countryCode: 'INT',
  },
  {
    id: 'esports-dota2',
    name: 'Dota 2 The International',
    shortName: 'TI',
    sport: 'esports',
    iconName: 'Swords',
    countryCode: 'INT',
  },
  {
    id: 'esports-valorant',
    name: 'Valorant Champions Tour',
    shortName: 'VCT',
    sport: 'esports',
    iconName: 'Target',
    countryCode: 'INT',
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

// Sport category metadata with icon names
export const SPORT_CATEGORIES: { value: SportCategory; label: string; iconName: SportIconName }[] = [
  { value: 'soccer', label: 'Soccer', iconName: 'Circle' },
  { value: 'basketball', label: 'Basketball', iconName: 'Dribbble' },
  { value: 'american_football', label: 'American Football', iconName: 'Goal' },
  { value: 'hockey', label: 'Hockey', iconName: 'Flag' },
  { value: 'baseball', label: 'Baseball', iconName: 'Circle' },
  { value: 'esports', label: 'Esports', iconName: 'Gamepad2' },
]
