"use client"

import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  condition: string
  antAdvice: string
  icon: string
}

const weatherConditions = [
  {
    condition: "sunny",
    temp: 75,
    humidity: 45,
    wind: 5,
    advice: "Perfect foraging weather! Ants are very active and efficient today! 🌞",
    icon: "☀️",
  },
  {
    condition: "cloudy",
    temp: 68,
    humidity: 60,
    wind: 8,
    advice: "Overcast skies - ants prefer this for long journeys without overheating! ☁️",
    icon: "☁️",
  },
  {
    condition: "rainy",
    temp: 62,
    humidity: 85,
    wind: 12,
    advice: "Too wet! Ants are staying in their tunnels and waiting for better weather! 🌧️",
    icon: "🌧️",
  },
  {
    condition: "windy",
    temp: 70,
    humidity: 40,
    wind: 18,
    advice: "Too windy to carry crumbs! Small ants are struggling against the breeze! 💨",
    icon: "💨",
  },
  {
    condition: "hot",
    temp: 85,
    humidity: 30,
    wind: 3,
    advice: "It's getting toasty! Ants are seeking shade and working in shorter shifts! 🔥",
    icon: "🔥",
  },
  {
    condition: "cold",
    temp: 45,
    humidity: 70,
    wind: 10,
    advice: "Chilly weather has slowed down the colony - ants are conserving energy! 🥶",
    icon: "❄️",
  },
]

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchWeather = () => {
    setLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]

      // Add some randomness to the base values
      const tempVariation = (Math.random() - 0.5) * 10
      const humidityVariation = (Math.random() - 0.5) * 20
      const windVariation = (Math.random() - 0.5) * 5

      setWeather({
        temperature: Math.round(randomWeather.temp + tempVariation),
        humidity: Math.max(20, Math.min(90, Math.round(randomWeather.humidity + humidityVariation))),
        windSpeed: Math.max(0, Math.round((randomWeather.wind + windVariation) * 10) / 10),
        condition: randomWeather.condition,
        antAdvice: randomWeather.advice,
        icon: randomWeather.icon,
      })

      setLastUpdated(new Date())
      setLoading(false)
    }, 800)
  }

  useEffect(() => {
    fetchWeather()

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchWeather, 120000)
    return () => clearInterval(interval)
  }, [])

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "sunny":
        return <Sun className="w-6 h-6 text-yellow-500" />
      case "cloudy":
        return <Cloud className="w-6 h-6 text-gray-500" />
      case "rainy":
        return <CloudRain className="w-6 h-6 text-blue-500" />
      case "windy":
        return <Wind className="w-6 h-6 text-gray-600" />
      case "hot":
        return <Sun className="w-6 h-6 text-red-500" />
      case "cold":
        return <Cloud className="w-6 h-6 text-blue-400" />
      default:
        return <Sun className="w-6 h-6 text-yellow-500" />
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "sunny":
      case "hot":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cloudy":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "rainy":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "windy":
        return "bg-slate-100 text-slate-800 border-slate-200"
      case "cold":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            Ant Weather Station
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {weather && getWeatherIcon(weather.condition)}
          Ant Weather Station
          <Button onClick={fetchWeather} variant="ghost" size="sm" className="ml-auto" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {weather && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <Thermometer className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-red-600">{weather.temperature}°F</div>
                <div className="text-xs text-red-700">Temperature</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-600">{weather.humidity}%</div>
                <div className="text-xs text-blue-700">Humidity</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <Wind className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-600">{weather.windSpeed} mph</div>
                <div className="text-xs text-gray-700">Wind Speed</div>
              </div>
            </div>

            <div className="text-center">
              <Badge className={`text-lg px-3 py-1 ${getConditionColor(weather.condition)}`}>
                {weather.icon} {weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)}
              </Badge>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium flex items-center gap-2">🐜 Ant Colony Advisory:</p>
              <p className="text-sm text-amber-700 mt-2">{weather.antAdvice}</p>
            </div>

            {lastUpdated && (
              <div className="text-xs text-gray-500 text-center">Last updated: {lastUpdated.toLocaleTimeString()}</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
