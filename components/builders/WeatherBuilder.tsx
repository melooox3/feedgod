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
  DollarSign,
  ThermometerSnowflake,
  CloudSun,
  CloudFog,
  CloudSnow,
  CloudLightning,
  LucideIcon
} from 'lucide-react'
import { City, WeatherMetric, WeatherOracleConfig, WEATHER_METRICS, WeatherData, WeatherIconName } from '@/types/weather'

// Weather metric icon mapping
const WEATHER_ICON_MAP: Record<WeatherIconName, LucideIcon> = {
  Thermometer,
  ThermometerSnowflake,
  CloudRain,
  Droplets,
  Wind,
}
import { Blockchain, Network } from '@/types/feed'
import { SORTED_CITIES } from '@/data/cities'
import { 
  fetchCurrentWeather, 
  fetchForecast, 
  fetchHistoricalWeather,
  getWeatherIconName,
  WeatherIconType,
  formatWeatherValue,
  formatTemperature
} from '@/lib/api/weather-api'

// Weather condition icon mapping (for weather codes)
const WEATHER_CONDITION_ICONS: Record<WeatherIconType, LucideIcon> = {
  Sun,
  CloudSun,
  CloudFog,
  CloudRain,
  Snowflake,
  CloudSnow,
  CloudLightning,
  Thermometer,
}
import { playPickupSound } from '@/lib/utils/sound-utils'
import { useCostEstimate } from '@/lib/hooks/use-cost-estimate'
import ChainSelector from '@/components/selectors/ChainSelector'

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
      <div className="px-4 py-3 bg-[#252620] rounded-lg border border-[#3a3b35]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <DollarSign className="w-4 h-4 animate-pulse" />
          <span>Calculating cost...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-[#252620] rounded-lg border border-[#3a3b35]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <DollarSign className="w-4 h-4" />
          <span>Estimated Cost:</span>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-white">
            {estimate.estimatedCost} {estimate.currency}
          </div>
        </div>
      </div>
    </div>
  )
}

// Weather icon component
function WeatherIcon({ code, size = 'md' }: { code?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' }
  const iconName = code !== undefined ? getWeatherIconName(code) : 'Thermometer'
  const IconComponent = WEATHER_CONDITION_ICONS[iconName]
  return <IconComponent className={`${sizeClasses[size]} text-feedgod-primary`} />
}

// Metric icon
function MetricIcon({ metric }: { metric: WeatherMetric }) {
  switch (metric) {
    case 'temperature_max': return <Thermometer className="w-5 h-5 text-red-500" />
    case 'temperature_min': return <Snowflake className="w-5 h-5 text-feedgod-primary" />
    case 'precipitation': return <CloudRain className="w-5 h-5 text-blue-400" />
    case 'humidity': return <Droplets className="w-5 h-5 text-cyan-500" />
    case 'wind_speed': return <Wind className="w-5 h-5 text-gray-500" />
    default: return <Thermometer className="w-5 h-5" />
  }
}

export default function WeatherBuilder() {
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

  // Read smartPromptData from sessionStorage and pre-fill the form
  useEffect(() => {
    const smartData = sessionStorage.getItem('smartPromptData')
    if (smartData) {
      try {
        const { module, parsed } = JSON.parse(smartData)
        if (module === 'weather' && parsed?.city) {
          // Find matching city in SORTED_CITIES
          const cityMatch = SORTED_CITIES.find(
            c => c.name.toLowerCase().includes(parsed.city.toLowerCase()) ||
                 parsed.city.toLowerCase().includes(c.name.toLowerCase())
          )
          if (cityMatch) {
            setSelectedCity(cityMatch)
            setCitySearch(cityMatch.name)
          } else {
            // Just set the search text to let user select
            setCitySearch(parsed.city)
            setShowCityDropdown(true)
          }
        }
      } catch (e) {
        console.error('Error parsing smartPromptData:', e)
      } finally {
        sessionStorage.removeItem('smartPromptData')
      }
    }
  }, [])

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
    alert('Weather Oracle deployed! (Demo - in production this would deploy to Switchboard)')
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
    alert('Weather Oracle saved! View it in your Profile tab.')
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
      <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Weather Oracle Builder
              </h2>
              <p className="text-sm text-gray-400">
                Create on-chain weather data feeds powered by Open-Meteo
              </p>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'configure' ? 'bg-feedgod-primary text-white' : 'bg-[#2a2b25] text-gray-400'
            }`}>
              1. Configure
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'preview' ? 'bg-feedgod-primary text-white' : 'bg-[#2a2b25] text-gray-400'
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
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Select Location
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-feedgod-secondary/70" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value)
                    setShowCityDropdown(true)
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  placeholder="Search cities... (e.g., Tokyo, London, New York)"
                  className="w-full pl-10 pr-4 py-3 bg-[#252620] border border-[#3a3b35] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary/50"
                />
                
                {showCityDropdown && filteredCities.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-[#252620] border border-[#3a3b35] rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <button
                        key={`${city.name}-${city.country}`}
                        onClick={() => handleCitySelect(city)}
                        className={`w-full px-4 py-3 text-left hover:bg-[#2a2b25] transition-colors flex items-center justify-between ${
                          selectedCity?.name === city.name ? 'bg-feedgod-primary/10' : ''
                        }`}
                      >
                        <span className="text-white font-medium">{city.name}</span>
                        <span className="text-sm text-gray-400">{city.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedCity && (
                <div className="mt-4 p-4 bg-[#1D1E19] rounded-lg border border-[#3a3b35]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {selectedCity.name}, {selectedCity.country}
                      </p>
                      <p className="text-sm text-gray-400">
                        {selectedCity.lat.toFixed(4)}°, {selectedCity.lon.toFixed(4)}°
                      </p>
                    </div>
                    {currentWeather && (
                      <div className="text-right">
                        <WeatherIcon code={currentWeather.weatherCode} size="md" />
                        <p className="text-2xl font-bold text-white">
                          {formatTemperature(currentWeather.temperature)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {currentWeather.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Metric Selection */}
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Select Metric
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {WEATHER_METRICS.map((metric) => {
                  const MetricIcon = WEATHER_ICON_MAP[metric.iconName] || Thermometer
                  const isSelected = selectedMetric === metric.value
                  return (
                    <button
                      key={metric.value}
                      onClick={() => {
                        playPickupSound()
                        setSelectedMetric(metric.value)
                      }}
                      className={`p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-feedgod-primary border-feedgod-primary'
                          : 'bg-[#252620] border-[#3a3b35] hover:border-feedgod-primary/50'
                      }`}
                    >
                      <div className="mb-2">
                        <MetricIcon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-feedgod-primary'}`} />
                      </div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>{metric.label}</p>
                      <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>{metric.unit}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Data Type & Chain */}
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Data Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Data Type</label>
                  <select
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value as any)}
                    className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary"
                  >
                    <option value="daily">Daily Feed (Live Updates)</option>
                    <option value="forecast">7-Day Forecast</option>
                    <option value="historical">Historical Date</option>
                  </select>
                </div>
                
                {dataType === 'historical' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Date</label>
                    <input
                      type="date"
                      value={historicalDate}
                      onChange={(e) => setHistoricalDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Update Interval
                  </label>
                  <select
                    value={oracleConfig.updateInterval}
                    onChange={(e) => setOracleConfig(prev => ({ ...prev, updateInterval: parseInt(e.target.value) }))}
                    className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary"
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
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-400">
                  Live Data Preview
                </h4>
                <button
                  onClick={handleRefresh}
                  disabled={!selectedCity || isLoading}
                  className="p-1.5 hover:bg-[#2a2b25] rounded transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {!selectedCity ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-feedgod-purple-300 dark:border-feedgod-dark-accent mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    Select a city to see weather data
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-feedgod-primary dark:text-feedgod-primary mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading weather data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current value for selected metric */}
                  <div className="p-4 bg-gradient-to-br from-feedgod-primary/15 to-feedgod-primary/5 rounded-lg border border-feedgod-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <MetricIcon metric={selectedMetric} />
                      <span className="text-sm text-gray-400">
                        {WEATHER_METRICS.find(m => m.value === selectedMetric)?.label}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {dataType === 'historical' && historicalData
                        ? formatWeatherValue(historicalData.value, selectedMetric)
                        : forecastData[0]
                          ? formatWeatherValue(forecastData[0].value, selectedMetric)
                          : '--'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {dataType === 'historical' && historicalDate
                        ? `Historical: ${historicalDate}`
                        : 'Today\'s forecast'
                      }
                    </p>
                  </div>
                  
                  {/* Mini forecast */}
                  {dataType !== 'historical' && forecastData.length > 1 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">7-Day Forecast</p>
                      <div className="grid grid-cols-7 gap-1">
                        {forecastData.slice(0, 7).map((day, i) => (
                          <div key={day.date} className="text-center p-2 bg-[#1D1E19] rounded">
                            <p className="text-[10px] text-gray-400">
                              {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                            </p>
                            <p className="text-xs font-bold text-white">
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
              className="w-full px-4 py-3 gradient-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
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
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Switchboard Oracle Configuration
              </h3>
              
              <div className="bg-feedgod-dark-secondary dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  {JSON.stringify(generateConfig(), null, 2)}
                </pre>
              </div>
            </div>

            {/* What happens */}
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                How This Oracle Works
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ff0d6e] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Data Fetched</p>
                    <p className="text-xs text-gray-400">
                      Weather data is fetched from Open-Meteo API every {
                        oracleConfig.updateInterval === 3600 ? 'hour' :
                        oracleConfig.updateInterval === 21600 ? '6 hours' :
                        oracleConfig.updateInterval === 43200 ? '12 hours' : 'day'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ff0d6e] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">On-Chain Update</p>
                    <p className="text-xs text-gray-400">
                      The {WEATHER_METRICS.find(m => m.value === selectedMetric)?.label.toLowerCase()} for {selectedCity.name} is pushed to {oracleConfig.blockchain}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ff0d6e] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Smart Contract Access</p>
                    <p className="text-xs text-gray-400">
                      Your contracts can read this weather data for insurance, gaming, or conditional logic
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Summary & Actions */}
          <div className="space-y-4">
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Oracle Summary
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white font-medium">{selectedCity.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Metric</span>
                  <span className="text-white font-medium">
                    {WEATHER_METRICS.find(m => m.value === selectedMetric)?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[oracleConfig.blockchain || 'solana']}
                      alt={oracleConfig.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-white font-medium capitalize">{oracleConfig.blockchain}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updates</span>
                  <span className="text-white font-medium">
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
                className="w-full px-4 py-3 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Deploy Oracle
              </button>
              <button
                onClick={handleSave}
                className="w-full px-4 py-3 bg-[#2a2b25] hover:bg-[#323329] rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-feedgod-primary dark:text-feedgod-primary transition-colors"
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

