import { City } from '@/types/weather'

export const CITIES: City[] = [
  // North America
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', country: 'USA', lat: 41.8781, lon: -87.6298 },
  { name: 'Miami', country: 'USA', lat: 25.7617, lon: -80.1918 },
  { name: 'Denver', country: 'USA', lat: 39.7392, lon: -104.9903 },
  { name: 'Seattle', country: 'USA', lat: 47.6062, lon: -122.3321 },
  { name: 'San Francisco', country: 'USA', lat: 37.7749, lon: -122.4194 },
  { name: 'Houston', country: 'USA', lat: 29.7604, lon: -95.3698 },
  { name: 'Phoenix', country: 'USA', lat: 33.4484, lon: -112.0740 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lon: -123.1207 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  
  // Europe
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417 },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964 },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738 },
  { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lon: 14.4378 },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lon: 18.0686 },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lon: 10.7522 },
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lon: 24.9384 },
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603 },
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lon: 4.3517 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393 },
  { name: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275 },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784 },
  
  // Asia
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737 },
  { name: 'Hong Kong', country: 'China', lat: 22.3193, lon: 114.1694 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', country: 'India', lat: 28.7041, lon: 77.1025 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lon: 120.9842 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lon: 101.6869 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lon: 106.6297 },
  { name: 'Taipei', country: 'Taiwan', lat: 25.0330, lon: 121.5654 },
  
  // Middle East
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 },
  { name: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lon: 54.3773 },
  { name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lon: 34.7818 },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lon: 51.5310 },
  { name: 'Kuwait City', country: 'Kuwait', lat: 29.3759, lon: 47.9774 },
  
  // Africa
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241 },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lon: 28.0473 },
  
  // South America
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816 },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428 },
  { name: 'Bogotá', country: 'Colombia', lat: 4.7110, lon: -74.0721 },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693 },
  
  // Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lon: 144.9631 },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8509, lon: 174.7645 },
  { name: 'Brisbane', country: 'Australia', lat: -27.4698, lon: 153.0251 },
]

// Sort cities alphabetically by name
export const SORTED_CITIES = [...CITIES].sort((a, b) => a.name.localeCompare(b.name))


