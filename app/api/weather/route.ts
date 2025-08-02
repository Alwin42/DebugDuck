import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  try {
    // Using OpenWeatherMap API - you would need to add your API key
    // For demo purposes, we'll return mock data
    const mockWeatherData = {
      temperature: Math.round(15 + Math.random() * 20), // 15-35°C
      humidity: Math.round(40 + Math.random() * 40), // 40-80%
      windSpeed: Math.round(Math.random() * 15 * 10) / 10, // 0-15 m/s
      description: ["clear sky", "few clouds", "scattered clouds", "broken clouds", "shower rain", "rain"][
        Math.floor(Math.random() * 6)
      ],
      main: ["Clear", "Clouds", "Rain"][Math.floor(Math.random() * 3)],
    }

    // Uncomment and use this for real weather data:
    /*
    const API_KEY = process.env.OPENWEATHER_API_KEY
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    )
    const data = await response.json()
    
    const weatherData = {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      main: data.weather[0].main
    }
    */

    return NextResponse.json(mockWeatherData)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
