import { Blockchain, Network } from './feed'

export type SocialPlatform = 'twitter' | 'youtube' | 'tiktok'

export type TwitterMetric = 'followers' | 'following' | 'tweets' | 'likes' | 'retweets' | 'replies' | 'impressions'
export type YouTubeMetric = 'subscribers' | 'views' | 'videos' | 'likes' | 'comments'
export type TikTokMetric = 'followers' | 'following' | 'likes' | 'views' | 'videos'

export type SocialMetric = TwitterMetric | YouTubeMetric | TikTokMetric

export interface SocialProfile {
  platform: SocialPlatform
  username: string
  displayName: string
  profileImage?: string
  verified: boolean
  metrics: Record<string, number>
  lastUpdated: Date
}

export interface SocialPost {
  id: string
  platform: SocialPlatform
  url: string
  author: string
  content?: string
  metrics: Record<string, number>
  postedAt: Date
  lastUpdated: Date
}

export interface SocialOracleConfig {
  id?: string
  name: string
  description?: string
  platform: SocialPlatform
  targetType: 'profile' | 'post' | 'hashtag'
  target: string // username, post URL, or hashtag
  metric: SocialMetric
  updateInterval: number // seconds
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
}

// Platform metadata
export const SOCIAL_PLATFORMS: { 
  value: SocialPlatform
  label: string
  icon: string
  color: string
  metrics: { value: string; label: string; description: string }[]
}[] = [
  {
    value: 'twitter',
    label: 'Twitter / X',
    icon: '𝕏',
    color: 'from-gray-800 to-black',
    metrics: [
      { value: 'followers', label: 'Followers', description: 'Total follower count' },
      { value: 'following', label: 'Following', description: 'Accounts being followed' },
      { value: 'tweets', label: 'Tweets', description: 'Total tweet count' },
      { value: 'likes', label: 'Likes', description: 'Likes on a specific tweet' },
      { value: 'retweets', label: 'Retweets', description: 'Retweets on a specific tweet' },
      { value: 'replies', label: 'Replies', description: 'Replies on a specific tweet' },
      { value: 'impressions', label: 'Impressions', description: 'Views on a specific tweet' },
    ],
  },
  {
    value: 'youtube',
    label: 'YouTube',
    icon: '▶️',
    color: 'from-red-500 to-red-700',
    metrics: [
      { value: 'subscribers', label: 'Subscribers', description: 'Channel subscriber count' },
      { value: 'views', label: 'Total Views', description: 'Total channel views' },
      { value: 'videos', label: 'Video Count', description: 'Number of uploaded videos' },
      { value: 'likes', label: 'Video Likes', description: 'Likes on a specific video' },
      { value: 'comments', label: 'Comments', description: 'Comments on a specific video' },
    ],
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    color: 'from-pink-500 to-cyan-400',
    metrics: [
      { value: 'followers', label: 'Followers', description: 'Total follower count' },
      { value: 'following', label: 'Following', description: 'Accounts being followed' },
      { value: 'likes', label: 'Total Likes', description: 'Total likes received' },
      { value: 'views', label: 'Video Views', description: 'Views on a specific video' },
      { value: 'videos', label: 'Video Count', description: 'Number of posted videos' },
    ],
  },
]

// Get metrics for a platform
export function getMetricsForPlatform(platform: SocialPlatform) {
  return SOCIAL_PLATFORMS.find(p => p.value === platform)?.metrics || []
}

// Popular accounts for suggestions
export const POPULAR_ACCOUNTS: { platform: SocialPlatform; username: string; displayName: string; category: string }[] = [
  // Twitter
  { platform: 'twitter', username: 'elonmusk', displayName: 'Elon Musk', category: 'Tech' },
  { platform: 'twitter', username: 'vaboronin', displayName: 'Vitalik Buterin', category: 'Crypto' },
  { platform: 'twitter', username: 'caboronin', displayName: 'CZ Binance', category: 'Crypto' },
  { platform: 'twitter', username: 'SBF_FTX', displayName: 'SBF', category: 'Crypto' },
  { platform: 'twitter', username: 'naval', displayName: 'Naval', category: 'Tech' },
  { platform: 'twitter', username: 'pmarca', displayName: 'Marc Andreessen', category: 'VC' },
  { platform: 'twitter', username: 'balaboronin', displayName: 'Balaji', category: 'Tech' },
  
  // YouTube
  { platform: 'youtube', username: 'MrBeast', displayName: 'MrBeast', category: 'Entertainment' },
  { platform: 'youtube', username: 'PewDiePie', displayName: 'PewDiePie', category: 'Gaming' },
  { platform: 'youtube', username: 'CoinBureau', displayName: 'Coin Bureau', category: 'Crypto' },
  { platform: 'youtube', username: 'TechLinked', displayName: 'TechLinked', category: 'Tech' },
  
  // TikTok
  { platform: 'tiktok', username: 'khaby.lame', displayName: 'Khaby Lame', category: 'Comedy' },
  { platform: 'tiktok', username: 'charlidamelio', displayName: 'Charli D\'Amelio', category: 'Dance' },
  { platform: 'tiktok', username: 'bellapoarch', displayName: 'Bella Poarch', category: 'Entertainment' },
]


