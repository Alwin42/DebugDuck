"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { MapItem, Ant } from "@/app/page"

interface LeafletMapProps {
  items: MapItem[]
  ants: Ant[]
  isSimulating: boolean
  onMapClick: (lat: number, lng: number) => void
  onAntsUpdate: (ants: Ant[]) => void
}

export default function LeafletMap({ items, ants, isSimulating, onMapClick, onAntsUpdate }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const antMarkersRef = useRef<any[]>([])
  const trailsRef = useRef<any[]>([])
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const [L, setL] = useState<any>(null)

  // Initialize Leaflet
  useEffect(() => {
    const initLeaflet = async () => {
      const leaflet = await import("leaflet")

      // Import Leaflet CSS
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      setL(leaflet.default)
    }

    initLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return

    // Create map
    const map = L.map(mapRef.current).setView([40.7128, -74.006], 18)

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    mapInstanceRef.current = map

    // Add click handler
    map.on("click", (e: any) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [L, onMapClick])

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker)
      }
    })
    markersRef.current = []

    antMarkersRef.current.forEach((marker) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker)
      }
    })
    antMarkersRef.current = []

    trailsRef.current.forEach((trail) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(trail)
      }
    })
    trailsRef.current = []
  }, [])

  // Update markers for items
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return

    // Clear existing item markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Add new item markers
    items.forEach((item) => {
      const marker = L.marker([item.lat, item.lng], {
        icon: L.divIcon({
          html: `<div style="font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${item.emoji}</div>`,
          className: "custom-marker",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(mapInstanceRef.current)

      marker.bindPopup(`
        <div style="text-align: center;">
          <div style="font-size: 20px; margin-bottom: 5px;">${item.emoji}</div>
          <strong>${item.name}</strong><br>
          <small>Type: ${item.type}</small>
        </div>
      `)

      markersRef.current.push(marker)
    })
  }, [L, items])

  // Update ant markers and trails
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return

    // Clear existing ant markers and trails
    antMarkersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    antMarkersRef.current = []

    trailsRef.current.forEach((trail) => {
      mapInstanceRef.current.removeLayer(trail)
    })
    trailsRef.current = []

    // Add ant trails
    ants.forEach((ant) => {
      if (ant.trail.length > 1) {
        const trailCoords = ant.trail.map((point) => [point.lat, point.lng])
        const trail = L.polyline(trailCoords, {
          color: "#8B4513",
          weight: 2,
          opacity: 0.6,
          dashArray: "3, 6",
        }).addTo(mapInstanceRef.current)

        trailsRef.current.push(trail)
      }
    })

    // Add ant markers
    ants.forEach((ant) => {
      const marker = L.marker([ant.lat, ant.lng], {
        icon: L.divIcon({
          html: `<div style="font-size: 18px; animation: ${
            ant.isMoving ? "antWiggle 1s ease-in-out infinite" : "none"
          };">🐜</div>`,
          className: "ant-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(mapInstanceRef.current)

      const targetInfo = ant.targetId ? items.find((item) => item.id === ant.targetId) : null

      marker.bindPopup(`
        <div style="text-align: center;">
          <div style="font-size: 18px; margin-bottom: 5px;">🐜</div>
          <strong>Ant ${ant.id}</strong><br>
          <small>Status: ${ant.isMoving ? "Foraging" : "Idle"}</small><br>
          ${targetInfo ? `<small>Target: ${targetInfo.name} ${targetInfo.emoji}</small>` : ""}
          <br><small>Trail length: ${ant.trail.length} steps</small>
        </div>
      `)

      antMarkersRef.current.push(marker)
    })
  }, [L, ants, items])

  // Ant simulation logic
  useEffect(() => {
    if (!isSimulating) {
      if (animationRef.current) {
        clearInterval(animationRef.current)
        animationRef.current = null
      }
      return
    }

    animationRef.current = setInterval(() => {
      onAntsUpdate((prevAnts) =>
        prevAnts.map((ant) => {
          // Find nearest food item
          let nearestFood: MapItem | null = null
          let minDistance = Number.POSITIVE_INFINITY

          items.forEach((item) => {
            if (item.type === "crumb" || item.type === "sugar") {
              const distance = Math.sqrt(Math.pow(item.lat - ant.lat, 2) + Math.pow(item.lng - ant.lng, 2))
              if (distance < minDistance) {
                minDistance = distance
                nearestFood = item
              }
            }
          })

          let newLat = ant.lat
          let newLng = ant.lng
          let isMoving = false
          let targetId = ant.targetId

          if (nearestFood && minDistance > 0.00002) {
            // Move towards food
            const moveSpeed = 0.00003 + Math.random() * 0.00002 // Slight speed variation
            const deltaLat = nearestFood.lat - ant.lat
            const deltaLng = nearestFood.lng - ant.lng
            const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng)

            // Check for obstacles in the path
            let blocked = false
            items.forEach((item) => {
              if (item.type === "obstacle") {
                const obstacleDistance = Math.sqrt(Math.pow(item.lat - ant.lat, 2) + Math.pow(item.lng - ant.lng, 2))
                if (obstacleDistance < 0.00008) {
                  blocked = true
                }
              }
            })

            if (!blocked) {
              newLat += (deltaLat / distance) * moveSpeed
              newLng += (deltaLng / distance) * moveSpeed
              isMoving = true
              targetId = nearestFood.id
            } else {
              // Move around obstacle
              newLat += (Math.random() - 0.5) * moveSpeed * 2
              newLng += (Math.random() - 0.5) * moveSpeed * 2
              isMoving = true
            }
          } else if (nearestFood && minDistance <= 0.00002) {
            // Reached food, wander a bit
            newLat += (Math.random() - 0.5) * 0.00001
            newLng += (Math.random() - 0.5) * 0.00001
            isMoving = false
            targetId = undefined
          } else {
            // Random exploration
            newLat += (Math.random() - 0.5) * 0.00002
            newLng += (Math.random() - 0.5) * 0.00002
            isMoving = Math.random() > 0.3 // 70% chance of moving
            targetId = undefined
          }

          // Update trail (keep last 15 positions)
          const newTrail = [...ant.trail, { lat: newLat, lng: newLng }].slice(-15)

          return {
            ...ant,
            lat: newLat,
            lng: newLng,
            targetId,
            trail: newTrail,
            isMoving,
          }
        }),
      )
    }, 300) // Update every 300ms for smooth animation

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isSimulating, items, onAntsUpdate])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg z-[1000]">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span>🐜 Ants: {ants.length}</span>
            <span>🍞 Food: {items.filter((i) => i.type !== "obstacle").length}</span>
            <span>🍃 Obstacles: {items.filter((i) => i.type === "obstacle").length}</span>
          </div>
          <div className="text-gray-600">{isSimulating ? "🟢 Simulation running" : "⏸️ Simulation paused"}</div>
        </div>
      </div>
    </div>
  )
}
