import { NextRequest, NextResponse } from 'next/server'
import { AIResolutionRequest, AIResolutionResponse } from '@/types/ai-judge'

/**
 * AI Resolution API Endpoint
 * 
 * Uses OpenAI GPT-4 to actually answer user questions.
 * Falls back to a "no API key" error if not configured.
 */

// Real AI resolution using OpenAI
async function resolveWithOpenAI(request: AIResolutionRequest): Promise<AIResolutionResponse> {
  const { question, resolutionType, trustedSources, categories, additionalContext } = request
  
  const openaiKey = process.env.OPENAI_API_KEY
  
  if (!openaiKey) {
    return {
      success: false,
      answer: '',
      reasoning: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
      sources: [],
      confidence: 0,
      timestamp: new Date().toISOString(),
      warning: 'API key required for AI resolution.',
    }
  }
  
  // Build the prompt based on resolution type
  let systemPrompt = `You are an AI oracle that researches and answers questions with factual accuracy. 
You must provide:
1. A clear answer
2. Your reasoning with specific evidence
3. Sources you would use to verify this (real websites)
4. A confidence score (0-100)

Be honest about what you know and don't know. If you're uncertain, reflect that in your confidence score.
Today's date is ${new Date().toLocaleDateString()}.`

  let userPrompt = `Question: ${question}\n\n`
  
  if (additionalContext) {
    userPrompt += `Additional context: ${additionalContext}\n\n`
  }
  
  if (trustedSources && trustedSources.length > 0) {
    userPrompt += `Trusted source categories to consider: ${trustedSources.join(', ')}\n\n`
  }
  
  // Format expected based on resolution type
  if (resolutionType === 'binary') {
    userPrompt += `This is a YES/NO question. Respond with JSON in this exact format:
{
  "answer": true or false,
  "reasoning": "Your detailed explanation with evidence",
  "sources": ["source1.com", "source2.com"],
  "confidence": 85
}`
  } else if (resolutionType === 'numeric') {
    userPrompt += `This question expects a numeric answer. Respond with JSON in this exact format:
{
  "answer": 123.45,
  "reasoning": "Your detailed explanation",
  "sources": ["source1.com", "source2.com"],
  "confidence": 85
}`
  } else if (resolutionType === 'categorical' && categories && categories.length > 0) {
    userPrompt += `Choose from these options: ${categories.join(', ')}. Respond with JSON in this exact format:
{
  "answer": "chosen option",
  "reasoning": "Your detailed explanation",
  "sources": ["source1.com", "source2.com"],
  "confidence": 85
}`
  } else {
    userPrompt += `Provide a text answer. Respond with JSON in this exact format:
{
  "answer": "Your answer text",
  "reasoning": "Your detailed explanation",
  "sources": ["source1.com", "source2.com"],
  "confidence": 85
}`
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[AI Resolve] OpenAI API error:', response.status, errorData)
      
      return {
        success: false,
        answer: '',
        reasoning: `OpenAI API error: ${response.status}. ${errorData.error?.message || 'Unknown error'}`,
        sources: [],
        confidence: 0,
        timestamp: new Date().toISOString(),
        warning: 'Failed to get AI response.',
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return {
        success: false,
        answer: '',
        reasoning: 'No response content from AI',
        sources: [],
        confidence: 0,
        timestamp: new Date().toISOString(),
      }
    }

    // Parse the JSON response
    const parsed = JSON.parse(content)
    
    return {
      success: true,
      answer: parsed.answer,
      reasoning: parsed.reasoning || 'No reasoning provided',
      sources: parsed.sources || [],
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      timestamp: new Date().toISOString(),
      warning: parsed.confidence < 70 
        ? 'Lower confidence - the AI is uncertain about this answer.'
        : undefined,
    }

  } catch (error) {
    console.error('[AI Resolve] Error calling OpenAI:', error)
    
    return {
      success: false,
      answer: '',
      reasoning: `Error processing AI request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      sources: [],
      confidence: 0,
      timestamp: new Date().toISOString(),
      warning: 'An error occurred during AI resolution.',
    }
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
    
    // Call real AI resolution
    const response = await resolveWithOpenAI(body)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[AI Resolve] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process AI resolution',
        answer: '',
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
  const hasApiKey = !!process.env.OPENAI_API_KEY
  
  return NextResponse.json({
    status: 'AI Resolution API is running',
    mode: hasApiKey ? 'production' : 'no-api-key',
    hasOpenAIKey: hasApiKey,
    supportedTypes: ['binary', 'numeric', 'categorical', 'text'],
    note: hasApiKey 
      ? 'API is ready. POST a question to get AI resolution.'
      : 'OPENAI_API_KEY not configured. Add it to .env.local to enable AI resolution.',
  })
}


