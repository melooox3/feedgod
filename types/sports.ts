import { Blockchain, Network } from './feed'

export type SportCategory = 'soccer' | 'basketball' | 'american_football' | 'esports' | 'hockey' | 'baseball'

export interface Team {
  id: string
  name: string
  shortName?: string
  logo?: string
  country?: string
}

export interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  league: League
  startTime: Date
  venue?: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
  homeScore?: number
  awayScore?: number
  round?: string
  season?: string
}

export interface League {
  id: string
  name: string
  shortName?: string
  country?: string
  logo?: string
  icon?: string
  sport: SportCategory
  currentSeason?: string
}

export type OracleOutputType = 'winner' | 'score' | 'total_goals' | 'both_teams_score'

export interface SportsOracleConfig {
  id?: string
  name: string
  description?: string
  match: Match
  outputType: OracleOutputType
  updateInterval: number // seconds
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
}

// Output format descriptions
export const OUTPUT_TYPE_INFO: Record<OracleOutputType, { label: string; description: string; format: string }> = {
  winner: {
    label: 'Match Winner',
    description: 'Returns the winner of the match',
    format: '1 = Home Win, 2 = Away Win, 0 = Draw',
  },
  score: {
    label: 'Final Score',
    description: 'Returns the final score as a packed value',
    format: 'home_score * 100 + away_score (e.g., 302 = 3-2)',
  },
  total_goals: {
    label: 'Total Goals/Points',
    description: 'Returns the sum of both teams\' scores',
    format: 'Integer value (e.g., 5 for a 3-2 match)',
  },
  both_teams_score: {
    label: 'Both Teams Score',
    description: 'Returns whether both teams scored',
    format: '1 = Yes (both scored), 0 = No',
  },
}

