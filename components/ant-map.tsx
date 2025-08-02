"use client"
import dynamic from "next/dynamic"
import type { MapItem, Ant } from "@/app/page"

// Dynamically import Leaflet to avoid SSR issues
const MapComponent = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">🗺️</div>
        <div className="text-sm text-gray-600">Loading interactive map...</div>
      </div>
    </div>
  ),
})

interface AntMapProps {
  items: MapItem[]
  ants: Ant[]
  isSimulating: boolean
  onMapClick: (lat: number, lng: number) => void
  onAntsUpdate: (ants: Ant[]) => void
}

export default function AntMap({ items, ants, isSimulating, onMapClick, onAntsUpdate }: AntMapProps) {
  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-amber-200">
      <MapComponent
        items={items}
        ants={ants}
        isSimulating={isSimulating}
        onMapClick={onMapClick}
        onAntsUpdate={onAntsUpdate}
      />
    </div>
  )
}
