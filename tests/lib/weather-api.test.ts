import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchCurrentWeather,
  fetchForecast,
  fetchHistoricalWeather,
  fetchWeatherRange,
  getWeatherDescription,
  getWeatherIcon,
  formatTemperature,
  formatWeatherValue
} from '@/lib/weather-api'
import type { City, WeatherMetric } from '@/types/weather'

const mockCity: City = {
  name: 'New York',
  country: 'US',
  lat: 40.71,
  lon: -74.01,
}

describe('weather-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchCurrentWeather', () => {
    it('returns weather data for valid city', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          current: {
            temperature_2m: 22,
            relative_humidity_2m: 65,
            wind_speed_10m: 15,
            weather_code: 1,
          },
        }),
      } as Response)

      const result = await fetchCurrentWeather(mockCity)

      expect(result).toBeDefined()
      expect(result?.temperature).toBe(22)
      expect(result?.humidity).toBe(65)
      expect(result?.windSpeed).toBe(15)
      expect(result?.weatherCode).toBe(1)
      expect(result?.description).toBe('Mainly clear')
    })

    it('returns null on API error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      const result = await fetchCurrentWeather(mockCity)
      expect(result).toBeNull()
    })

    it('returns default values for missing data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ current: {} }),
      } as Response)

      const result = await fetchCurrentWeather(mockCity)

      expect(result?.temperature).toBe(0)
      expect(result?.humidity).toBe(0)
    })
  })

  describe('fetchForecast', () => {
    it('returns forecast data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          daily: {
            time: ['2024-01-01', '2024-01-02'],
            temperature_2m_max: [25, 27],
          },
        }),
      } as Response)

      const result = await fetchForecast(mockCity, 'temperature_max', 2)

      expect(result.length).toBe(2)
      expect(result[0].date).toBe('2024-01-01')
      expect(result[0].value).toBe(25)
      expect(result[0].unit).toBe('\xB0C')
    })

    it('returns empty array on error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await fetchForecast(mockCity, 'temperature_max')
      expect(result).toEqual([])
    })
  })

  describe('fetchHistoricalWeather', () => {
    it('returns historical data for valid date', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          daily: {
            temperature_2m_max: [28],
          },
        }),
      } as Response)

      const result = await fetchHistoricalWeather(mockCity, 'temperature_max', '2024-01-01')

      expect(result).toBeDefined()
      expect(result?.value).toBe(28)
    })

    it('returns null for missing data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ daily: {} }),
      } as Response)

      const result = await fetchHistoricalWeather(mockCity, 'temperature_max', '2024-01-01')
      expect(result).toBeNull()
    })
  })

  describe('fetchWeatherRange', () => {
    it('returns data for date range', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          daily: {
            time: ['2024-01-01', '2024-01-02', '2024-01-03'],
            precipitation_sum: [5, 10, 0],
          },
        }),
      } as Response)

      const result = await fetchWeatherRange(mockCity, 'precipitation', '2024-01-01', '2024-01-03')

      expect(result.length).toBe(3)
      expect(result[1].value).toBe(10)
    })
  })

  describe('getWeatherDescription', () => {
    it('returns correct description for known codes', () => {
      expect(getWeatherDescription(0)).toBe('Clear sky')
      expect(getWeatherDescription(3)).toBe('Overcast')
      expect(getWeatherDescription(95)).toBe('Thunderstorm')
    })

    it('returns Unknown for unknown codes', () => {
      expect(getWeatherDescription(999)).toBe('Unknown')
    })
  })

  describe('getWeatherIcon', () => {
    it('returns sun for clear sky', () => {
      expect(getWeatherIcon(0)).toContain('\u2600')
    })

    it('returns cloud for partly cloudy', () => {
      expect(getWeatherIcon(2)).toContain('\u26C5')
    })

    it('returns rain for rain codes', () => {
      expect(getWeatherIcon(61)).toContain('\uD83C\uDF27')
    })

    it('returns snow for snow codes', () => {
      expect(getWeatherIcon(71)).toContain('\u2744')
    })

    it('returns thunderstorm for storm codes', () => {
      expect(getWeatherIcon(95)).toContain('\u26C8')
    })
  })

  describe('formatTemperature', () => {
    it('formats temperature with degree symbol', () => {
      expect(formatTemperature(22.5)).toBe('23\xB0C')
    })

    it('rounds to nearest integer', () => {
      expect(formatTemperature(22.4)).toBe('22\xB0C')
    })

    it('handles negative temperatures', () => {
      expect(formatTemperature(-5.5)).toBe('-5\xB0C')
    })
  })

  describe('formatWeatherValue', () => {
    it('formats temperature metrics', () => {
      expect(formatWeatherValue(25, 'temperature_max')).toBe('25\xB0C')
      expect(formatWeatherValue(15, 'temperature_min')).toBe('15\xB0C')
    })

    it('formats precipitation', () => {
      expect(formatWeatherValue(12.345, 'precipitation')).toBe('12.3mm')
    })

    it('formats humidity', () => {
      expect(formatWeatherValue(65.5, 'humidity')).toBe('66%')
    })

    it('formats wind speed', () => {
      expect(formatWeatherValue(25.7, 'wind_speed')).toBe('26km/h')
    })
  })
})
