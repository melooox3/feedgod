import { City, WeatherMetric, WeatherData } from '@/types/weather'

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast'
const OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive'

// Map our metrics to Open-Meteo parameter names
const METRIC_MAP: Record<WeatherMetric, { daily: string; hourly?: string }> = {
  temperature_max: { daily: 'temperature_2m_max' },
  temperature_min: { daily: 'temperature_2m_min' },
  precipitation: { daily: 'precipitation_sum' },
  humidity: { daily: 'relative_humidity_2m_mean', hourly: 'relative_humidity_2m' },
  wind_speed: { daily: 'wind_speed_10m_max' },
}

// Get unit for metric
const METRIC_UNITS: Record<WeatherMetric, string> = {
  temperature_max: '°C',
  temperature_min: '°C',
  precipitation: 'mm',
  humidity: '%',
  wind_speed: 'km/h',
}

/**
 * Fetch current weather data for a city
 */
export async function fetchCurrentWeather(city: City): Promise<{
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
} | null> {
  try {
    const url = `${OPEN_METEO_FORECAST}?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
    
    console.log('[Weather] Fetching current:', url)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[Weather] API error:', response.status)
      return null
    }
    
    const data = await response.json()
    
    return {
      temperature: data.current?.temperature_2m || 0,
      humidity: data.current?.relative_humidity_2m || 0,
      windSpeed: data.current?.wind_speed_10m || 0,
      weatherCode: data.current?.weather_code || 0,
      description: getWeatherDescription(data.current?.weather_code || 0),
    }
  } catch (error) {
    console.error('[Weather] Error fetching current:', error)
    return null
  }
}

/**
 * Fetch forecast data for a city
 */
export async function fetchForecast(
  city: City, 
  metric: WeatherMetric,
  days: number = 7
): Promise<WeatherData[]> {
  try {
    const metricParam = METRIC_MAP[metric].daily
    const url = `${OPEN_METEO_FORECAST}?latitude=${city.lat}&longitude=${city.lon}&daily=${metricParam}&timezone=auto&forecast_days=${days}`
    
    console.log('[Weather] Fetching forecast:', url)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[Weather] API error:', response.status)
      return []
    }
    
    const data = await response.json()
    const dates = data.daily?.time || []
    const values = data.daily?.[metricParam] || []
    
    return dates.map((date: string, i: number) => ({
      date,
      value: values[i] ?? 0,
      unit: METRIC_UNITS[metric],
      metric,
      city,
    }))
  } catch (error) {
    console.error('[Weather] Error fetching forecast:', error)
    return []
  }
}

/**
 * Fetch historical weather data for a specific date
 */
export async function fetchHistoricalWeather(
  city: City,
  metric: WeatherMetric,
  date: string // Format: YYYY-MM-DD
): Promise<WeatherData | null> {
  try {
    const metricParam = METRIC_MAP[metric].daily
    const url = `${OPEN_METEO_ARCHIVE}?latitude=${city.lat}&longitude=${city.lon}&start_date=${date}&end_date=${date}&daily=${metricParam}&timezone=auto`
    
    console.log('[Weather] Fetching historical:', url)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[Weather] API error:', response.status)
      return null
    }
    
    const data = await response.json()
    const value = data.daily?.[metricParam]?.[0]
    
    if (value === undefined || value === null) {
      return null
    }
    
    return {
      date,
      value,
      unit: METRIC_UNITS[metric],
      metric,
      city,
    }
  } catch (error) {
    console.error('[Weather] Error fetching historical:', error)
    return null
  }
}

/**
 * Fetch weather data for a date range
 */
export async function fetchWeatherRange(
  city: City,
  metric: WeatherMetric,
  startDate: string,
  endDate: string
): Promise<WeatherData[]> {
  try {
    const metricParam = METRIC_MAP[metric].daily
    const url = `${OPEN_METEO_ARCHIVE}?latitude=${city.lat}&longitude=${city.lon}&start_date=${startDate}&end_date=${endDate}&daily=${metricParam}&timezone=auto`
    
    console.log('[Weather] Fetching range:', url)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[Weather] API error:', response.status)
      return []
    }
    
    const data = await response.json()
    const dates = data.daily?.time || []
    const values = data.daily?.[metricParam] || []
    
    return dates.map((date: string, i: number) => ({
      date,
      value: values[i] ?? 0,
      unit: METRIC_UNITS[metric],
      metric,
      city,
    }))
  } catch (error) {
    console.error('[Weather] Error fetching range:', error)
    return []
  }
}

/**
 * Get weather description from WMO weather code
 */
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  }
  
  return descriptions[code] || 'Unknown'
}

/**
 * Get weather icon based on code
 */
export function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌧️'
  if (code <= 65) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌡️'
}

/**
 * Format temperature for display
 */
export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°C`
}

/**
 * Format value with unit
 */
export function formatWeatherValue(value: number, metric: WeatherMetric): string {
  const unit = METRIC_UNITS[metric]
  
  if (metric === 'temperature_max' || metric === 'temperature_min') {
    return `${Math.round(value)}${unit}`
  }
  if (metric === 'precipitation') {
    return `${value.toFixed(1)}${unit}`
  }
  if (metric === 'humidity') {
    return `${Math.round(value)}${unit}`
  }
  if (metric === 'wind_speed') {
    return `${Math.round(value)}${unit}`
  }
  
  return `${value}${unit}`
}


