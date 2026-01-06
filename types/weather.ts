import { Blockchain, Network } from './feed'

export type WeatherMetric = 'temperature_max' | 'temperature_min' | 'precipitation' | 'humidity' | 'wind_speed'

export interface City {
  name: string
  country: string
  lat: number
  lon: number
}

export interface WeatherData {
  date: string
  value: number
  unit: string
  metric: WeatherMetric
  city: City
}

export interface WeatherOracleConfig {
  id?: string
  name: string
  description?: string
  city: City
  metric: WeatherMetric
  dataType: 'historical' | 'forecast' | 'daily'
  date?: string // For historical data
  updateInterval: number // seconds
  decimals: number
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
}

export const WEATHER_METRICS: { value: WeatherMetric; label: string; unit: string; icon: string }[] = [
  { value: 'temperature_max', label: 'Max Temperature', unit: '°C', icon: '🌡️' },
  { value: 'temperature_min', label: 'Min Temperature', unit: '°C', icon: '❄️' },
  { value: 'precipitation', label: 'Precipitation', unit: 'mm', icon: '🌧️' },
  { value: 'humidity', label: 'Relative Humidity', unit: '%', icon: '💧' },
  { value: 'wind_speed', label: 'Wind Speed', unit: 'km/h', icon: '💨' },
]

