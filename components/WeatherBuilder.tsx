'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  Cloud, 
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  Clock,
  Play, 
  Save, 
  ChevronRight,
  MapPin,
  RefreshCw,
  Sun,
  CloudRain,
  Snowflake,
  DollarSign
} from 'lucide-react'
import { City, WeatherMetric, WeatherOracleConfig, WEATHER_METRICS, WeatherData } from '@/types/weather'
import { Blockchain, Network } from '@/types/feed'
import { SORTED_CITIES } from '@/data/cities'
import { 
  fetchCurrentWeather, 
  fetchForecast, 
  fetchHistoricalWeather,
  getWeatherIcon,
  formatWeatherValue,
  formatTemperature
} from '@/lib/weather-api'
import { playPickupSound } from '@/lib/sound-utils'
import { useCostEstimate } from '@/lib/use-cost-estimate'
import { useToast } from './Toast'
import ChainSelector from './ChainSelector'

// Chain logo mapping
const CHAIN_LOGOS: Record<string, string> = {
  solana: '/solana.png',
  ethereum: '/ethereum.png',
  monad: '/monad.png',
}

type BuilderStep = 'configure' | 'preview'

// Cost Estimate Display
function CostEstimateDisplay({ blockchain, network }: { blockchain: string; network: string }) {
  const { estimate, isLoading } = useCostEstimate(blockchain as Blockchain, network as Network, 'feed')

  if (isLoading || !estimate) {
    return (
      <div className="px-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent">
        <div className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          <DollarSign className="w-4 h-4 animate-pulse" />
          <span>Calculating cost...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          <DollarSign className="w-4 h-4" />
          <span>Estimated Cost:</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
            {estimate.estimatedCost} {estimate.currency}
          </div>
        </div>
      </div>
    </div>
  )
}

// Weather icon component
function WeatherIcon({ code, size = 'md' }: { code?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-6xl' }
  const icon = code !== undefined ? getWeatherIcon(code) : '🌡️'
  return <span className={sizeClasses[size]}>{icon}</span>
}

// Metric icon
function MetricIcon({ metric }: { metric: WeatherMetric }) {
  switch (metric) {
    case 'temperature_max': return <Thermometer className="w-5 h-5 text-red-500" />
    case 'temperature_min': return <Snowflake className="w-5 h-5 text-blue-500" />
    case 'precipitation': return <CloudRain className="w-5 h-5 text-blue-400" />
    case 'humidity': return <Droplets className="w-5 h-5 text-cyan-500" />
    case 'wind_speed': return <Wind className="w-5 h-5 text-gray-500" />
    default: return <Thermometer className="w-5 h-5" />
  }
}

export default function WeatherBuilder() {
  const toast = useToast()
  const [step, setStep] = useState<BuilderStep>('configure')
  const [citySearch, setCitySearch] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  
  // Config state
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<WeatherMetric>('temperature_max')
  const [dataType, setDataType] = useState<'historical' | 'forecast' | 'daily'>('daily')
  const [historicalDate, setHistoricalDate] = useState('')
  
  const [oracleConfig, setOracleConfig] = useState<Partial<WeatherOracleConfig>>({
    blockchain: 'solana',
    network: 'mainnet',
    updateInterval: 3600,
    decimals: 2,
    enabled: true,
  })
  
  // Weather data state
  const [currentWeather, setCurrentWeather] = useState<{
    temperature: number
    humidity: number
    windSpeed: number
    weatherCode: number
    description: string
  } | null>(null)
  const [forecastData, setForecastData] = useState<WeatherData[]>([])
  const [historicalData, setHistoricalData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch) return SORTED_CITIES.slice(0, 20)
    const query = citySearch.toLowerCase()
    return SORTED_CITIES.filter(city => 
      city.name.toLowerCase().includes(query) ||
      city.country.toLowerCase().includes(query)
    ).slice(0, 20)
  }, [citySearch])
  
  // Fetch current weather when city changes
  useEffect(() => {
    if (!selectedCity) return
    
    const loadWeather = async () => {
      setIsLoading(true)
      const weather = await fetchCurrentWeather(selectedCity)
      setCurrentWeather(weather)
      
      // Also load forecast
      const forecast = await fetchForecast(selectedCity, selectedMetric, 7)
      setForecastData(forecast)
      
      setIsLoading(false)
    }
    
    loadWeather()
  }, [selectedCity, selectedMetric])
  
  // Fetch historical data when date changes
  useEffect(() => {
    if (!selectedCity || !historicalDate || dataType !== 'historical') return
    
    const loadHistorical = async () => {
      setIsLoading(true)
      const data = await fetchHistoricalWeather(selectedCity, selectedMetric, historicalDate)
      setHistoricalData(data)
      setIsLoading(false)
    }
    
    loadHistorical()
  }, [selectedCity, selectedMetric, historicalDate, dataType])
  
  const handleCitySelect = (city: City) => {
    playPickupSound()
    setSelectedCity(city)
    setCitySearch(city.name)
    setShowCityDropdown(false)
  }
  
  const handlePreview = () => {
    if (!selectedCity) return
    playPickupSound()
    setStep('preview')
  }
  
  const handleBack = () => {
    playPickupSound()
    setStep('configure')
  }
  
  const handleDeploy = () => {
    playPickupSound()
    console.log('Deploying weather oracle:', {
      ...oracleConfig,
      city: selectedCity,
      metric: selectedMetric,
      dataType,
      date: historicalDate,
    })
    toast.success('Weather Oracle deployed! (Demo - in production this would deploy to Switchboard)')
  }
  
  const handleSave = () => {
    playPickupSound()
    const config = {
      ...oracleConfig,
      id: `weather-${Date.now()}`,
      name: `${selectedCity?.name} ${WEATHER_METRICS.find(m => m.value === selectedMetric)?.label}`,
      city: selectedCity,
      metric: selectedMetric,
      dataType,
      date: historicalDate,
      createdAt: new Date(),
    }
    
    const saved = localStorage.getItem('savedWeatherOracles')
    const oracles = saved ? JSON.parse(saved) : []
    oracles.push(config)
    localStorage.setItem('savedWeatherOracles', JSON.stringify(oracles))
    toast.success('Weather Oracle configuration saved!')
  }
  
  const handleRefresh = async () => {
    if (!selectedCity) return
    playPickupSound()
    setIsLoading(true)
    
    const weather = await fetchCurrentWeather(selectedCity)
    setCurrentWeather(weather)
    
    const forecast = await fetchForecast(selectedCity, selectedMetric, 7)
    setForecastData(forecast)
    
    if (dataType === 'historical' && historicalDate) {
      const data = await fetchHistoricalWeather(selectedCity, selectedMetric, historicalDate)
      setHistoricalData(data)
    }
    
    setIsLoading(false)
  }
  
  // Generate Switchboard config preview
  const generateConfig = () => {
    if (!selectedCity) return null
    
    return {
      name: oracleConfig.name || `${selectedCity.name} Weather Oracle`,
      description: `${WEATHER_METRICS.find(m => m.value === selectedMetric)?.label} for ${selectedCity.name}, ${selectedCity.country}`,
      chain: oracleConfig.blockchain,
      network: oracleConfig.network,
      updateInterval: oracleConfig.updateInterval,
      source: {
        type: 'weather',
        provider: 'open-meteo',
        location: {
          city: selectedCity.name,
          country: selectedCity.country,
          latitude: selectedCity.lat,
          longitude: selectedCity.lon,
        },
        metric: selectedMetric,
        dataType,
        ...(dataType === 'historical' && historicalDate ? { date: historicalDate } : {}),
      },
      output: {
        type: 'int64',
        decimals: oracleConfig.decimals,
        unit: WEATHER_METRICS.find(m => m.value === selectedMetric)?.unit,
      },
    }
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
                Weather Oracle Builder
              </h2>
              <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                Create on-chain weather data feeds powered by Open-Meteo
              </p>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'configure' ? 'bg-feedgod-primary text-white' : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-500'
            }`}>
              1. Configure
            </div>
            <ChevronRight className="w-4 h-4 text-feedgod-pink-300" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'preview' ? 'bg-feedgod-primary text-white' : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-500'
            }`}>
              2. Deploy
            </div>
          </div>
        </div>
      </div>

      {step === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* City Selection */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Select Location
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-feedgod-pink-400" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value)
                    setShowCityDropdown(true)
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  placeholder="Search cities... (e.g., Tokyo, London, New York)"
                  className="w-full pl-10 pr-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-white placeholder-feedgod-pink-400 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                />
                
                {showCityDropdown && filteredCities.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <button
                        key={`${city.name}-${city.country}`}
                        onClick={() => handleCitySelect(city)}
                        className={`w-full px-4 py-3 text-left hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent transition-colors flex items-center justify-between ${
                          selectedCity?.name === city.name ? 'bg-feedgod-primary/10' : ''
                        }`}
                      >
                        <span className="text-feedgod-dark dark:text-white font-medium">{city.name}</span>
                        <span className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">{city.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedCity && (
                <div className="mt-4 p-4 bg-feedgod-pink-50 dark:bg-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-feedgod-dark dark:text-white">
                        {selectedCity.name}, {selectedCity.country}
                      </p>
                      <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                        {selectedCity.lat.toFixed(4)}°, {selectedCity.lon.toFixed(4)}°
                      </p>
                    </div>
                    {currentWeather && (
                      <div className="text-right">
                        <WeatherIcon code={currentWeather.weatherCode} size="md" />
                        <p className="text-2xl font-bold text-feedgod-dark dark:text-white">
                          {formatTemperature(currentWeather.temperature)}
                        </p>
                        <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                          {currentWeather.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Metric Selection */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Select Metric
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {WEATHER_METRICS.map((metric) => (
                  <button
                    key={metric.value}
                    onClick={() => {
                      playPickupSound()
                      setSelectedMetric(metric.value)
                    }}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedMetric === metric.value
                        ? 'bg-feedgod-primary/10 border-feedgod-primary dark:border-feedgod-neon-pink'
                        : 'bg-feedgod-pink-50 dark:bg-feedgod-dark-accent border-feedgod-pink-200 dark:border-feedgod-dark-accent hover:border-feedgod-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{metric.icon}</div>
                    <p className="text-sm font-medium text-feedgod-dark dark:text-white">{metric.label}</p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">{metric.unit}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Type & Chain */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Data Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">Data Type</label>
                  <select
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value as any)}
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                  >
                    <option value="daily">Daily Feed (Live Updates)</option>
                    <option value="forecast">7-Day Forecast</option>
                    <option value="historical">Historical Date</option>
                  </select>
                </div>
                
                {dataType === 'historical' && (
                  <div>
                    <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">Date</label>
                    <input
                      type="date"
                      value={historicalDate}
                      onChange={(e) => setHistoricalDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Update Interval
                  </label>
                  <select
                    value={oracleConfig.updateInterval}
                    onChange={(e) => setOracleConfig(prev => ({ ...prev, updateInterval: parseInt(e.target.value) }))}
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                  >
                    <option value="3600">Hourly</option>
                    <option value="21600">Every 6 hours</option>
                    <option value="43200">Every 12 hours</option>
                    <option value="86400">Daily</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <ChainSelector
                    blockchain={oracleConfig.blockchain || 'solana'}
                    network={oracleConfig.network || 'mainnet'}
                    onBlockchainChange={(blockchain) => setOracleConfig(prev => ({ ...prev, blockchain }))}
                    onNetworkChange={(network) => setOracleConfig(prev => ({ ...prev, network }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right - Preview & Actions */}
          <div className="space-y-4">
            {/* Current Data Preview */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-feedgod-primary dark:text-feedgod-neon-pink">
                  Live Data Preview
                </h4>
                <button
                  onClick={handleRefresh}
                  disabled={!selectedCity || isLoading}
                  className="p-1.5 hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-feedgod-pink-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {!selectedCity ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-feedgod-pink-300 mx-auto mb-3" />
                  <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                    Select a city to see weather data
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-feedgod-primary mx-auto mb-3" />
                  <p className="text-sm text-feedgod-pink-500">Loading weather data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current value for selected metric */}
                  <div className="p-4 bg-gradient-to-br from-feedgod-primary/10 to-purple-500/10 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <MetricIcon metric={selectedMetric} />
                      <span className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                        {WEATHER_METRICS.find(m => m.value === selectedMetric)?.label}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-feedgod-dark dark:text-white">
                      {dataType === 'historical' && historicalData
                        ? formatWeatherValue(historicalData.value, selectedMetric)
                        : forecastData[0]
                          ? formatWeatherValue(forecastData[0].value, selectedMetric)
                          : '--'
                      }
                    </p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                      {dataType === 'historical' && historicalDate
                        ? `Historical: ${historicalDate}`
                        : 'Today\'s forecast'
                      }
                    </p>
                  </div>
                  
                  {/* Mini forecast */}
                  {dataType !== 'historical' && forecastData.length > 1 && (
                    <div>
                      <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mb-2">7-Day Forecast</p>
                      <div className="grid grid-cols-7 gap-1">
                        {forecastData.slice(0, 7).map((day, i) => (
                          <div key={day.date} className="text-center p-2 bg-feedgod-pink-50 dark:bg-feedgod-dark-accent rounded">
                            <p className="text-[10px] text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                              {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                            </p>
                            <p className="text-xs font-bold text-feedgod-dark dark:text-white">
                              {Math.round(day.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cost Estimate */}
            <CostEstimateDisplay
              blockchain={oracleConfig.blockchain || 'solana'}
              network={oracleConfig.network || 'mainnet'}
            />

            {/* Actions */}
            <button
              onClick={handlePreview}
              disabled={!selectedCity}
              className="w-full px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              Preview & Deploy
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && selectedCity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4">
                Switchboard Oracle Configuration
              </h3>
              
              <div className="bg-feedgod-dark dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  {JSON.stringify(generateConfig(), null, 2)}
                </pre>
              </div>
            </div>

            {/* What happens */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4">
                How This Oracle Works
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-feedgod-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-feedgod-primary">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-feedgod-dark dark:text-white">Data Fetched</p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                      Weather data is fetched from Open-Meteo API every {
                        oracleConfig.updateInterval === 3600 ? 'hour' :
                        oracleConfig.updateInterval === 21600 ? '6 hours' :
                        oracleConfig.updateInterval === 43200 ? '12 hours' : 'day'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-feedgod-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-feedgod-primary">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-feedgod-dark dark:text-white">On-Chain Update</p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                      The {WEATHER_METRICS.find(m => m.value === selectedMetric)?.label.toLowerCase()} for {selectedCity.name} is pushed to {oracleConfig.blockchain}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-feedgod-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-feedgod-primary">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-feedgod-dark dark:text-white">Smart Contract Access</p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                      Your contracts can read this weather data for insurance, gaming, or conditional logic
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Summary & Actions */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-sky-400/10 to-blue-600/10 rounded-lg border border-sky-400/20 p-6">
              <h4 className="text-sm font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4">
                Oracle Summary
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Location</span>
                  <span className="text-feedgod-dark dark:text-white font-medium">{selectedCity.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Metric</span>
                  <span className="text-feedgod-dark dark:text-white font-medium">
                    {WEATHER_METRICS.find(m => m.value === selectedMetric)?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[oracleConfig.blockchain || 'solana']}
                      alt={oracleConfig.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-feedgod-dark dark:text-white font-medium capitalize">{oracleConfig.blockchain}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Updates</span>
                  <span className="text-feedgod-dark dark:text-white font-medium">
                    {oracleConfig.updateInterval === 3600 ? 'Hourly' :
                     oracleConfig.updateInterval === 21600 ? 'Every 6h' :
                     oracleConfig.updateInterval === 43200 ? 'Every 12h' : 'Daily'}
                  </span>
                </div>
              </div>
            </div>

            <CostEstimateDisplay
              blockchain={oracleConfig.blockchain || 'solana'}
              network={oracleConfig.network || 'mainnet'}
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeploy}
                className="w-full px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Deploy Oracle
              </button>
              <button
                onClick={handleSave}
                className="w-full px-4 py-3 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 rounded-lg text-feedgod-dark dark:text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:text-feedgod-primary transition-colors"
              >
                Back to Configure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

