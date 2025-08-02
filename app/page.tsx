"use client"

import { useState, useEffect, useCallback } from "react"
import AntMap from "@/components/ant-map"
import WeatherWidget from "@/components/weather-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw } from "lucide-react"

export interface MapItem {
  id: string
  type: "crumb" | "sugar" | "obstacle"
  lat: number
  lng: number
  emoji: string
  name: string
}

export interface Ant {
  id: string
  lat: number
  lng: number
  targetId?: string
  trail: { lat: number; lng: number }[]
  isMoving: boolean
}

export default function Home() {
  const [items, setItems] = useState<MapItem[]>([])
  const [ants, setAnts] = useState<Ant[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [addingMode, setAddingMode] = useState<"crumb" | "sugar" | "obstacle" | null>(null)

  // Initialize ants
  useEffect(() => {
    const initialAnts: Ant[] = Array.from({ length: 5 }, (_, i) => ({
      id: `ant-${i + 1}`,
      lat: 40.7128 + (Math.random() - 0.5) * 0.001,
      lng: -74.006 + (Math.random() - 0.5) * 0.001,
      trail: [],
      isMoving: false,
    }))
    setAnts(initialAnts)
  }, [])

  const addItem = useCallback((type: "crumb" | "sugar" | "obstacle") => {
    setAddingMode(type)
  }, [])

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!addingMode) return

      const itemConfig = {
        crumb: { emoji: "🍞", name: "Bread Crumb" },
        sugar: { emoji: "🍯", name: "Sugar Crystal" },
        obstacle: { emoji: "🍃", name: "Leaf Obstacle" },
      }

      const config = itemConfig[addingMode]
      const newItem: MapItem = {
        id: `${addingMode}-${Date.now()}`,
        type: addingMode,
        lat,
        lng,
        emoji: config.emoji,
        name: config.name,
      }

      setItems((prev) => [...prev, newItem])
      setAddingMode(null)
    },
    [addingMode],
  )

  const clearAllItems = useCallback(() => {
    setItems([])
    setIsSimulating(false)
  }, [])

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev)
  }, [])

  const resetAnts = useCallback(() => {
    setIsSimulating(false)
    const resetAnts: Ant[] = Array.from({ length: 5 }, (_, i) => ({
      id: `ant-${i + 1}`,
      lat: 40.7128 + (Math.random() - 0.5) * 0.001,
      lng: -74.006 + (Math.random() - 0.5) * 0.001,
      trail: [],
      isMoving: false,
    }))
    setAnts(resetAnts)
  }, [])

  const foodCount = items.filter((item) => item.type === "crumb" || item.type === "sugar").length
  const obstacleCount = items.filter((item) => item.type === "obstacle").length
  const activeAnts = ants.filter((ant) => ant.isMoving).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🐜</div>
              <div>
                <h1 className="text-2xl font-bold text-amber-900">CrumbWay</h1>
                <p className="text-sm text-amber-700">A Ridiculously Overengineered Navigation App for Ants</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isSimulating ? "default" : "secondary"}>{isSimulating ? "🟢 Active" : "⏸️ Paused"}</Badge>
              <span className="text-2xl">🗺️</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">🗺️</span>
                  Ant Colony Map
                  {addingMode && (
                    <Badge variant="outline" className="ml-auto">
                      Click to add {addingMode} {addingMode === "crumb" ? "🍞" : addingMode === "sugar" ? "🍯" : "🍃"}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {addingMode
                    ? `Click anywhere on the map to place a ${addingMode}`
                    : "Select an item type below, then click on the map to place it"}
                </p>
              </CardHeader>
              <CardContent>
                <AntMap
                  items={items}
                  ants={ants}
                  isSimulating={isSimulating}
                  onMapClick={handleMapClick}
                  onAntsUpdate={setAnts}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weather Widget */}
            <WeatherWidget />

            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">🎮</span>
                  Colony Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => addItem("crumb")}
                    variant={addingMode === "crumb" ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    🍞 Add Bread Crumb
                  </Button>
                  <Button
                    onClick={() => addItem("sugar")}
                    variant={addingMode === "sugar" ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    🍯 Add Sugar Particle
                  </Button>
                  <Button
                    onClick={() => addItem("obstacle")}
                    variant={addingMode === "obstacle" ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    🍃 Add Obstacle
                  </Button>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <Button
                    onClick={toggleSimulation}
                    variant={isSimulating ? "destructive" : "default"}
                    className="w-full"
                    disabled={foodCount === 0}
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Simulation
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Simulation
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={resetAnts} variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset Ants
                    </Button>
                    <Button onClick={clearAllItems} variant="outline" size="sm">
                      🧹 Clear All
                    </Button>
                  </div>
                </div>

                {foodCount === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Add some food (bread crumbs or sugar) before starting the simulation!
                    </p>
                  </div>
                )}

                {addingMode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">📍 Click anywhere on the map to place your {addingMode}</p>
                    <Button
                      onClick={() => setAddingMode(null)}
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-blue-600"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Colony Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{ants.length}</div>
                    <div className="text-sm text-green-700">Total Ants 🐜</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{activeAnts}</div>
                    <div className="text-sm text-blue-700">Active Ants ⚡</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Food Sources:</span>
                    <Badge variant="secondary">{foodCount} 🍞🍯</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Obstacles:</span>
                    <Badge variant="secondary">{obstacleCount} 🍃</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Simulation:</span>
                    <Badge variant={isSimulating ? "default" : "secondary"}>
                      {isSimulating ? "Running 🏃‍♂️" : "Stopped ⏹️"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Efficiency:</span>
                    <Badge variant="outline" className="text-green-600">
                      {foodCount > 0 ? "Optimal 📈" : "Waiting 📊"}
                    </Badge>
                  </div>
                </div>

                {isSimulating && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">🐜 Colony Activity:</p>
                    <p className="text-sm text-green-700 mt-1">
                      Ants are actively foraging for food and navigating around obstacles!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>🐜 Built with love for our tiny six-legged friends 🐜</p>
          <p className="mt-1">Powered by React, Leaflet.js, and an unhealthy obsession with ants</p>
        </footer>
      </main>
    </div>
  )
}
