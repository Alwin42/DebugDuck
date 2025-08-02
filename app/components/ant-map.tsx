"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
})

interface MapItem {
  id: string
  type: "crumb" | "sugar" | "obstacle"
  position: [number, number]
  emoji: string
  name: string
}

interface Ant {
  id: string
  position: [number, number]
  target: [number, number] | null
  speed: number
  trail: [number, number][]
}

interface AntMapProps {
  items: MapItem[]
  ants: Ant[]
  isSimulating: boolean
  onAntsUpdate: (ants: Ant[]) => void
}

// Create custom icons for different items
const createCustomIcon = (emoji: string, size = 30) => {
  return L.divIcon({
    html: `<div style="font-size: ${size}px; text-align: center; line-height: 1;">${emoji}</div>`,
    className: "custom-emoji-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const antIcon = L.divIcon({
  html: '<div style="font-size: 20px; text-align: center; line-height: 1;">🐜</div>',
  className: "ant-icon",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

export default function AntMap({ items, ants, isSimulating, onAntsUpdate }: AntMapProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Ant simulation logic
  useEffect(() => {
    if (isSimulating) {
      intervalRef.current = setInterval(() => {
        onAntsUpdate((prevAnts) =>
          prevAnts.map((ant) => {
            const newAnt = { ...ant }

            // Find nearest food if ant doesn't have a target
            if (!newAnt.target) {
              const foodItems = items.filter((item) => item.type !== "obstacle")
              if (foodItems.length > 0) {
                const nearest = foodItems.reduce((closest, item) => {
                  const distToItem = Math.sqrt(
                    Math.pow(item.position[0] - ant.position[0], 2) + Math.pow(item.position[1] - ant.position[1], 2),
                  )
                  const distToClosest = Math.sqrt(
                    Math.pow(closest.position[0] - ant.position[0], 2) +
                      Math.pow(closest.position[1] - ant.position[1], 2),
                  )
                  return distToItem < distToClosest ? item : closest
                })
                newAnt.target = nearest.position
              }
            }

            // Move ant toward target or randomly
            if (newAnt.target) {
              const dx = newAnt.target[0] - newAnt.position[0]
              const dy = newAnt.target[1] - newAnt.position[1]
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < 0.00005) {
                // Reached target, find new one
                newAnt.target = null
              } else {
                // Move toward target
                const moveX = (dx / distance) * newAnt.speed
                const moveY = (dy / distance) * newAnt.speed
                newAnt.position = [newAnt.position[0] + moveX, newAnt.position[1] + moveY]
              }
            } else {
              // Random movement
              const randomX = (Math.random() - 0.5) * newAnt.speed * 2
              const randomY = (Math.random() - 0.5) * newAnt.speed * 2
              newAnt.position = [newAnt.position[0] + randomX, newAnt.position[1] + randomY]
            }

            // Update trail (keep last 10 positions)
            newAnt.trail = [...newAnt.trail, newAnt.position].slice(-10)

            return newAnt
          }),
        )
      }, 200) // Update every 200ms

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isSimulating, items, onAntsUpdate])

  return (
    <MapContainer
      center={[40.7128, -74.006]}
      zoom={18}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render map items */}
      {items.map((item) => (
        <Marker key={item.id} position={item.position} icon={createCustomIcon(item.emoji)}>
          <Popup>
            <div className="text-center">
              <div className="text-2xl mb-2">{item.emoji}</div>
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm text-gray-600 capitalize">{item.type}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Render ants */}
      {ants.map((ant) => (
        <div key={ant.id}>
          {/* Ant trail */}
          {ant.trail.length > 1 && (
            <Polyline positions={ant.trail} color="#8B4513" weight={2} opacity={0.6} dashArray="2, 4" />
          )}

          {/* Ant marker */}
          <Marker position={ant.position} icon={antIcon}>
            <Popup>
              <div className="text-center">
                <div className="text-2xl mb-2">🐜</div>
                <div className="font-semibold">Worker Ant #{ant.id.split("-")[1]}</div>
                <div className="text-sm text-gray-600">{ant.target ? "Heading to food" : "Exploring"}</div>
                <div className="text-xs text-gray-500 mt-1">Trail length: {ant.trail.length} steps</div>
              </div>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  )
}
