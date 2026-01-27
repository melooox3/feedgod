import { SocialPlatform, SocialProfile, SocialPost, SocialMetric } from '@/types/social'

/**
 * DEMO DATA NOTICE:
 * This module uses simulated data for demonstration purposes.
 * Real social media API integration (Twitter/X, YouTube, TikTok) requires:
 * - Twitter API: Expensive ($100+/month for basic access)
 * - YouTube API: Free but requires OAuth
 * - TikTok API: Business API requires approval
 * 
 * For production, integrate with:
 * - RapidAPI social scrapers (paid)
 * - SocialBlade API (limited free tier)
 * - Official platform APIs (expensive/complex auth)
 */

// Mock data for popular accounts (DEMO - numbers are approximate/simulated)
const MOCK_PROFILES: Record<string, SocialProfile> = {
  // Twitter profiles
  'twitter:elonmusk': {
    platform: 'twitter',
    username: 'elonmusk',
    displayName: 'Elon Musk',
    profileImage: 'https://pbs.twimg.com/profile_images/1590968738358079488/IY9Gx6Ok_400x400.jpg',
    verified: true,
    metrics: {
      followers: 195_800_000,
      following: 764,
      tweets: 48_500,
    },
    lastUpdated: new Date(),
  },
  'twitter:vitalikbuterin': {
    platform: 'twitter',
    username: 'VitalikButerin',
    displayName: 'vitalik.eth',
    verified: true,
    metrics: {
      followers: 5_420_000,
      following: 352,
      tweets: 12_800,
    },
    lastUpdated: new Date(),
  },
  'twitter:caboronin': {
    platform: 'twitter',
    username: 'cz_binance',
    displayName: 'CZ 🔶 BNB',
    verified: true,
    metrics: {
      followers: 8_900_000,
      following: 1_245,
      tweets: 15_600,
    },
    lastUpdated: new Date(),
  },
  'twitter:naval': {
    platform: 'twitter',
    username: 'naval',
    displayName: 'Naval',
    verified: true,
    metrics: {
      followers: 2_150_000,
      following: 1_892,
      tweets: 8_450,
    },
    lastUpdated: new Date(),
  },
  
  // YouTube profiles
  'youtube:mrbeast': {
    platform: 'youtube',
    username: 'MrBeast',
    displayName: 'MrBeast',
    verified: true,
    metrics: {
      subscribers: 335_000_000,
      views: 62_500_000_000,
      videos: 812,
    },
    lastUpdated: new Date(),
  },
  'youtube:pewdiepie': {
    platform: 'youtube',
    username: 'PewDiePie',
    displayName: 'PewDiePie',
    verified: true,
    metrics: {
      subscribers: 111_000_000,
      views: 29_800_000_000,
      videos: 4_720,
    },
    lastUpdated: new Date(),
  },
  'youtube:coinbureau': {
    platform: 'youtube',
    username: 'CoinBureau',
    displayName: 'Coin Bureau',
    verified: true,
    metrics: {
      subscribers: 2_450_000,
      views: 425_000_000,
      videos: 892,
    },
    lastUpdated: new Date(),
  },
  
  // TikTok profiles
  'tiktok:khaby.lame': {
    platform: 'tiktok',
    username: 'khaby.lame',
    displayName: 'Khaby Lame',
    verified: true,
    metrics: {
      followers: 162_500_000,
      following: 78,
      likes: 2_400_000_000,
      videos: 1_245,
    },
    lastUpdated: new Date(),
  },
  'tiktok:charlidamelio': {
    platform: 'tiktok',
    username: 'charlidamelio',
    displayName: 'Charli D\'Amelio',
    verified: true,
    metrics: {
      followers: 155_200_000,
      following: 1_456,
      likes: 11_800_000_000,
      videos: 2_890,
    },
    lastUpdated: new Date(),
  },
}

// Generate random variation for demo purposes
function addVariation(value: number, maxPercent: number = 0.5): number {
  const variation = (Math.random() - 0.5) * 2 * (maxPercent / 100) * value
  return Math.round(value + variation)
}

/**
 * Fetch a social profile by platform and username
 */
export async function fetchSocialProfile(
  platform: SocialPlatform,
  username: string
): Promise<SocialProfile | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
  
  const key = `${platform}:${username.toLowerCase()}`
  const profile = MOCK_PROFILES[key]
  
  if (profile) {
    // Add slight variation to metrics to simulate live updates
    const updatedMetrics: Record<string, number> = {}
    for (const [metric, value] of Object.entries(profile.metrics)) {
      updatedMetrics[metric] = addVariation(value)
    }
    
    return {
      ...profile,
      metrics: updatedMetrics,
      lastUpdated: new Date(),
    }
  }
  
  // Generate mock data for unknown profiles
  return generateMockProfile(platform, username)
}

/**
 * Generate mock profile for any username
 */
function generateMockProfile(platform: SocialPlatform, username: string): SocialProfile {
  const baseFollowers = Math.floor(Math.random() * 1_000_000) + 10_000
  
  const metrics: Record<string, number> = {}
  
  switch (platform) {
    case 'twitter':
      metrics.followers = baseFollowers
      metrics.following = Math.floor(baseFollowers * 0.01) + Math.floor(Math.random() * 500)
      metrics.tweets = Math.floor(Math.random() * 10000) + 100
      break
    case 'youtube':
      metrics.subscribers = baseFollowers
      metrics.views = baseFollowers * (Math.floor(Math.random() * 100) + 50)
      metrics.videos = Math.floor(Math.random() * 500) + 10
      break
    case 'tiktok':
      metrics.followers = baseFollowers
      metrics.following = Math.floor(Math.random() * 500) + 50
      metrics.likes = baseFollowers * (Math.floor(Math.random() * 50) + 10)
      metrics.videos = Math.floor(Math.random() * 500) + 10
      break
  }
  
  return {
    platform,
    username,
    displayName: username,
    verified: baseFollowers > 500_000,
    metrics,
    lastUpdated: new Date(),
  }
}

/**
 * Fetch post/video metrics
 */
export async function fetchPostMetrics(
  platform: SocialPlatform,
  postId: string
): Promise<SocialPost | null> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
  
  // Generate mock post data
  const baseViews = Math.floor(Math.random() * 10_000_000) + 100_000
  
  const metrics: Record<string, number> = {
    views: baseViews,
    likes: Math.floor(baseViews * (Math.random() * 0.1 + 0.02)),
    comments: Math.floor(baseViews * (Math.random() * 0.01 + 0.001)),
  }
  
  if (platform === 'twitter') {
    metrics.retweets = Math.floor(metrics.likes * (Math.random() * 0.3 + 0.1))
    metrics.replies = Math.floor(metrics.likes * (Math.random() * 0.2 + 0.05))
    metrics.impressions = baseViews
  }
  
  return {
    id: postId,
    platform,
    url: generatePostUrl(platform, postId),
    author: 'unknown',
    metrics,
    postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(),
  }
}

/**
 * Generate post URL from platform and ID
 */
function generatePostUrl(platform: SocialPlatform, postId: string): string {
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/i/status/${postId}`
    case 'youtube':
      return `https://youtube.com/watch?v=${postId}`
    case 'tiktok':
      return `https://tiktok.com/@user/video/${postId}`
    default:
      return ''
  }
}

/**
 * Parse username from URL or handle
 */
export function parseUsername(input: string, platform: SocialPlatform): string {
  // Remove @ symbol if present
  let username = input.trim().replace(/^@/, '')
  
  // Try to extract from URL
  try {
    if (input.includes('/')) {
      const url = new URL(input.startsWith('http') ? input : `https://${input}`)
      const pathParts = url.pathname.split('/').filter(Boolean)
      
      switch (platform) {
        case 'twitter':
          // twitter.com/username or x.com/username
          if (pathParts.length > 0 && !['i', 'intent', 'search'].includes(pathParts[0])) {
            username = pathParts[0]
          }
          break
        case 'youtube':
          // youtube.com/@username or youtube.com/channel/xxx
          if (pathParts[0]?.startsWith('@')) {
            username = pathParts[0].slice(1)
          } else if (pathParts[0] === 'channel' || pathParts[0] === 'c') {
            username = pathParts[1] || username
          }
          break
        case 'tiktok':
          // tiktok.com/@username
          if (pathParts[0]?.startsWith('@')) {
            username = pathParts[0].slice(1)
          } else {
            username = pathParts[0] || username
          }
          break
      }
    }
  } catch {
    // Not a valid URL, use as-is
  }
  
  return username.toLowerCase()
}

/**
 * Format large numbers for display
 */
export function formatMetricValue(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

/**
 * Get metric label
 */
export function getMetricLabel(metric: SocialMetric): string {
  const labels: Record<string, string> = {
    followers: 'Followers',
    following: 'Following',
    tweets: 'Tweets',
    likes: 'Likes',
    retweets: 'Retweets',
    replies: 'Replies',
    impressions: 'Impressions',
    subscribers: 'Subscribers',
    views: 'Views',
    videos: 'Videos',
    comments: 'Comments',
  }
  return labels[metric] || metric
}

/**
 * Get platform icon
 */
export function getPlatformIcon(platform: SocialPlatform): string {
  const icons: Record<SocialPlatform, string> = {
    twitter: '𝕏',
    youtube: '▶️',
    tiktok: '🎵',
  }
  return icons[platform]
}

/**
 * Search for accounts (mock implementation)
 */
export async function searchAccounts(
  platform: SocialPlatform,
  query: string
): Promise<SocialProfile[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const results: SocialProfile[] = []
  const queryLower = query.toLowerCase()
  
  for (const [key, profile] of Object.entries(MOCK_PROFILES)) {
    if (key.startsWith(`${platform}:`) && 
        (profile.username.toLowerCase().includes(queryLower) ||
         profile.displayName.toLowerCase().includes(queryLower))) {
      results.push(profile)
    }
  }
  
  // If no results, generate a mock one
  if (results.length === 0 && query.length >= 2) {
    results.push(generateMockProfile(platform, query))
  }
  
  return results
}

