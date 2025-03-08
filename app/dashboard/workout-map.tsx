"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

type WorkoutMapProps = {
  routeData: {
    positions: [number, number][]
  }
}

export default function WorkoutMap({ routeData }: WorkoutMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([0, 0], 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return // Keep the base tile layer
      map.removeLayer(layer)
    })

    // Add route polyline if we have positions
    if (routeData && routeData.positions && routeData.positions.length > 0) {
      const positions = routeData.positions.map((pos) => [pos[0], pos[1]] as L.LatLngExpression)

      // Create polyline
      const polyline = L.polyline(positions, { color: "blue", weight: 5 }).addTo(map)

      // Add start and end markers
      if (positions.length > 0) {
        const startIcon = L.divIcon({
          html: `<div class="bg-green-500 rounded-full p-1 border-2 border-white" style="width: 12px; height: 12px;"></div>`,
          className: "custom-div-icon",
        })

        const endIcon = L.divIcon({
          html: `<div class="bg-red-500 rounded-full p-1 border-2 border-white" style="width: 12px; height: 12px;"></div>`,
          className: "custom-div-icon",
        })

        L.marker(positions[0], { icon: startIcon }).addTo(map)
        L.marker(positions[positions.length - 1], { icon: endIcon }).addTo(map)
      }

      // Fit map to the route bounds
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] })
    }

    return () => {
      // No need to destroy the map on unmount, we'll reuse it
    }
  }, [routeData])

  return <div ref={mapRef} className="h-full w-full" />
}

