import { useState, useEffect } from 'react'
import { Icons } from '../../shared/ui'

export function useWeather({ pharmacies }) {
  const [weatherLocation, setWeatherLocation] = useState('')
  const [weatherInput, setWeatherInput] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [weatherModalOpen, setWeatherModalOpen] = useState(false)

  const weatherDescription = (code) => {
    const map = {
      0: 'Klar',
      1: 'Überwiegend klar',
      2: 'Leicht bewölkt',
      3: 'Bedeckt',
      45: 'Nebel',
      48: 'Reifnebel',
      51: 'Nieselregen',
      53: 'Nieselregen',
      55: 'Nieselregen',
      61: 'Regen',
      63: 'Regen',
      65: 'Starker Regen',
      71: 'Schnee',
      73: 'Schnee',
      75: 'Starker Schnee',
      80: 'Schauer',
      81: 'Schauer',
      82: 'Starke Schauer',
      95: 'Gewitter',
    }
    return map[code] || 'Wetter'
  }

  const WeatherIcon = ({ code, className = "w-5 h-5" }) => {
    if (code === 0) return <Icons.SunLarge className={className} />
    if (code === 1 || code === 2) return <Icons.CloudSun className={className} />
    if (code === 3) return <Icons.Cloud className={className} />
    if (code === 45 || code === 48) return <Icons.CloudFog className={className} />
    if (code >= 51 && code <= 55) return <Icons.CloudRain className={className} />
    if (code >= 61 && code <= 65) return <Icons.CloudRain className={className} />
    if (code >= 71 && code <= 75) return <Icons.CloudSnow className={className} />
    if (code >= 80 && code <= 82) return <Icons.CloudRain className={className} />
    if (code === 95) return <Icons.CloudBolt className={className} />
    return <Icons.Cloud className={className} />
  }

  const fetchWeather = async (location) => {
    if (!location) return
    setWeatherLoading(true)
    setWeatherError('')
    setWeatherData(null)
    try {
      const geocode = async (query) => {
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=de&format=json`,
        )
        if (!geoResponse.ok) return null
        const geoData = await geoResponse.json()
        return geoData.results && geoData.results[0]
      }

      const parts = location.split(' ').filter(Boolean)
      const cityOnly = parts.length > 1 ? parts.slice(1).join(' ') : location
      const candidates = [location, cityOnly, parts[0]].filter(Boolean)
      let result = null
      for (const candidate of candidates) {
        result = await geocode(candidate)
        if (result) break
      }

      if (!result) throw new Error('Ort nicht gefunden.')

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${result.latitude}&longitude=${result.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weathercode,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode,sunrise,sunset&forecast_days=5&timezone=auto`,
      )
      if (!weatherResponse.ok) throw new Error('Wetterdaten konnten nicht geladen werden.')
      const weatherJson = await weatherResponse.json()
      const daily = weatherJson.daily || {}
      const dailyEntries = (daily.time || []).map((date, index) => ({
        date,
        min: daily.temperature_2m_min?.[index],
        max: daily.temperature_2m_max?.[index],
        precipitation: daily.precipitation_sum?.[index],
        precipitationProbability: daily.precipitation_probability_max?.[index],
        weatherCode: daily.weathercode?.[index],
        sunrise: daily.sunrise?.[index],
        sunset: daily.sunset?.[index],
      }))
      setWeatherData({
        name: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`,
        temperature: weatherJson.current?.temperature_2m,
        feelsLike: weatherJson.current?.apparent_temperature,
        humidity: weatherJson.current?.relative_humidity_2m,
        precipitation: weatherJson.current?.precipitation,
        weatherCode: weatherJson.current?.weathercode,
        wind: weatherJson.current?.wind_speed_10m,
        daily: dailyEntries,
      })
    } catch (error) {
      setWeatherError(error.message || 'Fehler beim Laden der Wetterdaten.')
    } finally {
      setWeatherLoading(false)
    }
  }

  const openWeatherModal = () => {
    setWeatherInput(weatherLocation)
    setWeatherModalOpen(true)
  }

  const closeWeatherModal = () => {
    setWeatherModalOpen(false)
  }

  // Set initial weather location from first pharmacy
  useEffect(() => {
    if (!weatherLocation && pharmacies.length > 0) {
      const primary = pharmacies[0]
      const cityLabel = primary.city ? [primary.postal_code, primary.city].filter(Boolean).join(' ') : ''
      const fallback = cityLabel || primary.name
      if (fallback) {
        setWeatherLocation(fallback)
      }
    }
  }, [pharmacies, weatherLocation])

  // Fetch weather when location changes
  useEffect(() => {
    if (weatherLocation) {
      fetchWeather(weatherLocation)
    }
  }, [weatherLocation])

  return {
    weatherLocation,
    weatherInput,
    weatherData,
    weatherLoading,
    weatherError,
    weatherModalOpen,
    setWeatherLocation,
    setWeatherInput,
    weatherDescription,
    WeatherIcon,
    fetchWeather,
    openWeatherModal,
    closeWeatherModal,
  }
}
