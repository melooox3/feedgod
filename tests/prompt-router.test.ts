import { describe, it, expect } from 'vitest'
import { detectIntent, getModuleInfo, EXAMPLE_PROMPTS } from '@/lib/prompt-router'

describe('prompt-router', () => {
  describe('detectIntent', () => {
    describe('Price Feed detection', () => {
      it('should detect BTC/USD as feed module', () => {
        const result = detectIntent('BTC/USD')
        expect(result.module).toBe('feed')
        expect(result.parsed.baseToken).toBe('BTC')
        expect(result.parsed.quoteToken).toBe('USD')
      })

      it('should detect "Bitcoin price" as feed module', () => {
        const result = detectIntent('Bitcoin price')
        expect(result.module).toBe('feed')
        expect(result.parsed.baseToken).toBe('BTC')
      })

      it('should detect "price of ETH" as feed module', () => {
        const result = detectIntent('price of ETH')
        expect(result.module).toBe('feed')
        expect(result.parsed.baseToken).toBe('ETH')
      })

      it('should detect "$SOL price" as feed module', () => {
        const result = detectIntent('$SOL price')
        expect(result.module).toBe('feed')
        expect(result.parsed.baseToken).toBe('SOL')
      })

      it('should detect "solana price feed" as feed module', () => {
        const result = detectIntent('solana price feed')
        expect(result.module).toBe('feed')
        expect(result.parsed.baseToken).toBe('SOL')
      })
    })

    describe('Prediction Market detection', () => {
      it('should detect "polymarket" as prediction module', () => {
        const result = detectIntent('polymarket trump election')
        expect(result.module).toBe('prediction')
      })

      it('should detect "kalshi" as prediction module', () => {
        const result = detectIntent('kalshi odds')
        expect(result.module).toBe('prediction')
      })

      it('should detect election-related queries as prediction', () => {
        const result = detectIntent('Trump election odds')
        expect(result.module).toBe('prediction')
      })

      it('should detect "will X win" patterns as prediction', () => {
        const result = detectIntent('will Biden win the election')
        expect(result.module).toBe('prediction')
      })

      it('should detect betting odds queries as prediction', () => {
        const result = detectIntent('betting odds for the election')
        expect(result.module).toBe('prediction')
      })
    })

    describe('Weather detection', () => {
      it('should detect "weather in Tokyo" as weather module', () => {
        const result = detectIntent('weather in Tokyo')
        expect(result.module).toBe('weather')
        expect(result.parsed.city).toBe('tokyo')
      })

      it('should detect "temperature in NYC" as weather module', () => {
        const result = detectIntent('temperature in NYC')
        expect(result.module).toBe('weather')
        expect(result.parsed.city).toBe('new york')
      })

      it('should detect "did it rain" as weather module', () => {
        const result = detectIntent('did it rain in London')
        expect(result.module).toBe('weather')
        expect(result.parsed.city).toBe('london')
      })

      it('should handle city aliases like SF', () => {
        const result = detectIntent('weather in SF')
        expect(result.module).toBe('weather')
        expect(result.parsed.city).toBe('san francisco')
      })
    })

    describe('Sports detection', () => {
      it('should detect NBA queries as sports module', () => {
        const result = detectIntent('Lakers vs Warriors')
        expect(result.module).toBe('sports')
      })

      it('should detect NFL team mentions as sports', () => {
        const result = detectIntent('Chiefs game tonight')
        expect(result.module).toBe('sports')
      })

      it('should detect soccer teams as sports', () => {
        const result = detectIntent('Manchester United vs Liverpool')
        expect(result.module).toBe('sports')
      })

      it('should detect esports queries as sports', () => {
        const result = detectIntent('CS2 tournament winner')
        expect(result.module).toBe('sports')
        expect(result.parsed.league).toBe('Esports')
      })
    })

    describe('Social Media detection', () => {
      it('should detect @username as social module', () => {
        const result = detectIntent('@elonmusk followers')
        expect(result.module).toBe('social')
        expect(result.parsed.username).toBe('elonmusk')
      })

      it('should detect Twitter/X queries as social', () => {
        const result = detectIntent('twitter follower count')
        expect(result.module).toBe('social')
        expect(result.parsed.platform).toBe('twitter')
      })

      it('should detect YouTube queries as social', () => {
        const result = detectIntent('MrBeast subscriber count')
        expect(result.module).toBe('social')
        expect(result.parsed.platform).toBe('youtube')
      })

      it('should detect TikTok queries as social', () => {
        const result = detectIntent('TikTok followers for khaby')
        expect(result.module).toBe('social')
        expect(result.parsed.platform).toBe('tiktok')
      })
    })

    describe('Custom API detection', () => {
      it('should detect URLs as custom-api module', () => {
        const result = detectIntent('https://api.example.com/data')
        expect(result.module).toBe('custom-api')
        expect(result.parsed.url).toBe('https://api.example.com/data')
      })

      it('should detect "any api" as custom-api', () => {
        const result = detectIntent('any api endpoint')
        expect(result.module).toBe('custom-api')
      })

      it('should detect API-related keywords as custom-api', () => {
        const result = detectIntent('fetch json from endpoint')
        expect(result.module).toBe('custom-api')
      })
    })

    describe('AI Judge detection', () => {
      it('should detect "ai judge" as ai-judge module', () => {
        const result = detectIntent('ai judge this question')
        expect(result.module).toBe('ai-judge')
      })

      it('should detect "let ai decide" as ai-judge', () => {
        const result = detectIntent('let ai decide who won')
        expect(result.module).toBe('ai-judge')
      })

      it('should detect "intelligent oracle" as ai-judge', () => {
        const result = detectIntent('intelligent oracle for resolution')
        expect(result.module).toBe('ai-judge')
      })
    })

    describe('Default behavior', () => {
      it('should default to feed for truly unrecognized input', () => {
        const result = detectIntent('xyz abc 123')
        expect(result.module).toBe('feed')
        expect(result.confidence).toBeLessThan(50)
      })

      it('should handle empty input', () => {
        const result = detectIntent('')
        expect(result.module).toBe('feed')
        expect(result.confidence).toBe(30)
      })

      it('should handle very short input', () => {
        const result = detectIntent('a')
        expect(result.module).toBe('feed')
        expect(result.confidence).toBe(30)
      })
    })

    describe('Confidence scores', () => {
      it('should have higher confidence for specific token pairs', () => {
        const result = detectIntent('BTC/USD price feed')
        expect(result.confidence).toBeGreaterThan(70)
      })

      it('should have higher confidence for URLs in custom-api', () => {
        const result = detectIntent('https://api.coingecko.com/v3/price')
        expect(result.confidence).toBe(95)
      })

      it('should have higher confidence for @username in social', () => {
        const result = detectIntent('@elonmusk')
        expect(result.confidence).toBe(90)
      })
    })
  })

  describe('getModuleInfo', () => {
    it('should return correct info for feed module', () => {
      const info = getModuleInfo('feed')
      expect(info.label).toBe('Price Feed')
      expect(info.icon).toBeDefined()
    })

    it('should return correct info for prediction module', () => {
      const info = getModuleInfo('prediction')
      expect(info.label).toBe('Prediction Market')
    })

    it('should return correct info for weather module', () => {
      const info = getModuleInfo('weather')
      expect(info.label).toBe('Weather')
    })

    it('should return correct info for sports module', () => {
      const info = getModuleInfo('sports')
      expect(info.label).toBe('Sports')
    })

    it('should return correct info for social module', () => {
      const info = getModuleInfo('social')
      expect(info.label).toBe('Social Media')
    })

    it('should return correct info for custom-api module', () => {
      const info = getModuleInfo('custom-api')
      expect(info.label).toBe('Custom API')
    })

    it('should return correct info for ai-judge module', () => {
      const info = getModuleInfo('ai-judge')
      expect(info.label).toBe('AI Judge')
    })
  })

  describe('EXAMPLE_PROMPTS', () => {
    it('should have examples for multiple modules', () => {
      expect(EXAMPLE_PROMPTS.length).toBeGreaterThan(0)

      const modules = new Set(EXAMPLE_PROMPTS.map(p => p.module))
      expect(modules.size).toBeGreaterThan(3)
    })

    it('should have text, module, and icon for each example', () => {
      EXAMPLE_PROMPTS.forEach(prompt => {
        expect(prompt.text).toBeDefined()
        expect(prompt.module).toBeDefined()
        expect(prompt.icon).toBeDefined()
      })
    })
  })
})
