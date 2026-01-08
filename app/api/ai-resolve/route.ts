import { NextRequest, NextResponse } from 'next/server'
import { AIResolutionRequest, AIResolutionResponse } from '@/types/ai-judge'

/**
 * AI Resolution API Endpoint
 * 
 * In production, this would call OpenAI/Claude/etc.
 * For demo, we simulate AI reasoning with realistic responses.
 * 
 * To enable real AI:
 * 1. Add OPENAI_API_KEY to .env.local
 * 2. npm install openai
 * 3. Replace simulateAIResolution with real API call
 */

// Simulated AI resolution for demo purposes
async function simulateAIResolution(request: AIResolutionRequest): Promise<AIResolutionResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
  
  const { question, resolutionType, trustedSources, categories } = request
  const questionLower = question.toLowerCase()
  
  // Generate contextual mock responses based on question content
  let answer: string | number | boolean
  let reasoning: string
  let confidence: number
  let sources: string[]
  
  // Binary questions
  if (resolutionType === 'binary') {
    // Simulate different scenarios
    const isPositive = Math.random() > 0.4 // Slightly bias toward yes for demo
    answer = isPositive
    
    if (questionLower.includes('snow') || questionLower.includes('rain') || questionLower.includes('weather')) {
      reasoning = isPositive 
        ? `Based on weather service data, precipitation was recorded in the specified location on the given date. Multiple weather stations confirmed the conditions.`
        : `Weather service data indicates no precipitation was recorded in the specified location. Clear conditions were reported across monitoring stations.`
      sources = ['weather.gov', 'accuweather.com', 'wunderground.com']
      confidence = 92 + Math.floor(Math.random() * 8)
    } else if (questionLower.includes('release') || questionLower.includes('album') || questionLower.includes('song')) {
      reasoning = isPositive
        ? `Music industry sources and streaming platforms confirm a new release. Social media buzz and official announcements corroborate this information.`
        : `No official announcements or streaming platform listings were found for a new release in the specified timeframe.`
      sources = ['spotify.com', 'billboard.com', 'pitchfork.com']
      confidence = 85 + Math.floor(Math.random() * 10)
    } else if (questionLower.includes('bitcoin') || questionLower.includes('crypto') || questionLower.includes('bullish')) {
      reasoning = isPositive
        ? `Analysis of social media sentiment, trading volume, and market indicators suggests a predominantly bullish outlook. Fear & Greed Index supports this assessment.`
        : `Market indicators and sentiment analysis show mixed to bearish signals. Trading volume and social sentiment lean negative.`
      sources = ['coingecko.com', 'cryptoquant.com', 'santiment.net']
      confidence = 70 + Math.floor(Math.random() * 15)
    } else if (questionLower.includes('tweet') || questionLower.includes('post') || questionLower.includes('twitter')) {
      reasoning = isPositive
        ? `Twitter/X activity search found matching content from the specified account within the given timeframe.`
        : `No matching posts were found from the specified account within the given timeframe.`
      sources = ['twitter.com/x.com', 'nitter.net']
      confidence = 88 + Math.floor(Math.random() * 10)
    } else {
      reasoning = isPositive
        ? `Based on analysis of available sources, the evidence supports a positive resolution. Multiple independent sources corroborate this finding.`
        : `Available evidence does not support a positive resolution. Sources analyzed did not confirm the stated condition.`
      sources = trustedSources.map(s => `${s}-source.com`)
      confidence = 75 + Math.floor(Math.random() * 15)
    }
  }
  // Numeric questions
  else if (resolutionType === 'numeric') {
    if (questionLower.includes('price') || questionLower.includes('bitcoin') || questionLower.includes('ethereum')) {
      if (questionLower.includes('bitcoin')) {
        answer = 95000 + Math.floor(Math.random() * 10000)
      } else if (questionLower.includes('ethereum')) {
        answer = 3200 + Math.floor(Math.random() * 500)
      } else {
        answer = Math.floor(Math.random() * 10000)
      }
      reasoning = `Price data aggregated from multiple exchanges shows the current market value. Data represents a weighted average across major trading pairs.`
      sources = ['coingecko.com', 'coinmarketcap.com', 'binance.com']
      confidence = 95 + Math.floor(Math.random() * 5)
    } else if (questionLower.includes('temperature') || questionLower.includes('degrees')) {
      answer = 40 + Math.floor(Math.random() * 50)
      reasoning = `Temperature data collected from weather monitoring stations in the specified region.`
      sources = ['weather.gov', 'noaa.gov']
      confidence = 90 + Math.floor(Math.random() * 10)
    } else {
      answer = Math.floor(Math.random() * 1000)
      reasoning = `Numeric value determined through analysis of relevant data sources.`
      sources = trustedSources.map(s => `${s}-data.com`)
      confidence = 70 + Math.floor(Math.random() * 20)
    }
  }
  // Categorical questions
  else if (resolutionType === 'categorical' && categories && categories.length > 0) {
    const selectedIndex = Math.floor(Math.random() * categories.length)
    answer = categories[selectedIndex]
    reasoning = `Based on official results and multiple news sources, "${answer}" has been confirmed as the correct answer.`
    sources = ['official-results.com', 'ap-news.com', 'reuters.com']
    confidence = 85 + Math.floor(Math.random() * 15)
  }
  // Text questions
  else {
    if (questionLower.includes('headline') || questionLower.includes('news')) {
      const headlines = [
        'Tech stocks rally amid AI optimism',
        'Global leaders meet for climate summit',
        'New breakthrough in renewable energy announced',
        'Markets react to Federal Reserve decision',
      ]
      answer = headlines[Math.floor(Math.random() * headlines.length)]
    } else if (questionLower.includes('trending')) {
      const trends = ['#AIRevolution', '#Bitcoin100K', '#BreakingNews', '#TechNews', '#CryptoTwitter']
      answer = trends[Math.floor(Math.random() * trends.length)]
    } else {
      answer = 'Based on current analysis, the most relevant finding is that the situation remains dynamic with multiple factors at play.'
    }
    reasoning = `Text response generated from analysis of current events and trending topics across specified sources.`
    sources = ['trends.google.com', 'twitter.com/trending', 'reddit.com']
    confidence = 65 + Math.floor(Math.random() * 20)
  }
  
  return {
    success: true,
    answer,
    reasoning,
    sources,
    confidence,
    timestamp: new Date().toISOString(),
    warning: confidence < 80 
      ? 'Lower confidence score - consider additional verification before using for high-stakes decisions.'
      : undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AIResolutionRequest = await request.json()
    
    // Validate request
    if (!body.question || body.question.trim().length < 10) {
      return NextResponse.json(
        { error: 'Question must be at least 10 characters' },
        { status: 400 }
      )
    }
    
    if (!body.resolutionType) {
      return NextResponse.json(
        { error: 'Resolution type is required' },
        { status: 400 }
      )
    }
    
    // In production, check for API key and call real AI
    // const openaiKey = process.env.OPENAI_API_KEY
    // if (openaiKey) {
    //   return await callOpenAI(body)
    // }
    
    // Demo mode - simulate AI resolution
    const response = await simulateAIResolution(body)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[AI Resolve] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process AI resolution',
        answer: null,
        reasoning: 'An error occurred during resolution',
        sources: [],
        confidence: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'AI Resolution API is running',
    mode: 'demo', // Would be 'production' with real API key
    supportedTypes: ['binary', 'numeric', 'categorical', 'text'],
    note: 'POST a question to get AI resolution',
  })
}


