import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

type TrackingMapProps = {
  positions: [number, number][]
  isTracking: boolean
  setPositions: React.Dispatch<React.SetStateAction<[number, number][]>>
}

export default function TrackingMap({ positions, isTracking, setPositions }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [initialPosition, setInitialPosition] = useState<[number, number] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Speed threshold in m/s (e.g., 5 m/s ≈ 18 km/h, above jogging speed)
  const DRIVING_SPEED_THRESHOLD = 5

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setInitialPosition([51.505, -0.09])
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setInitialPosition([position.coords.latitude, position.coords.longitude])
      },
      (err) => {
        setError(`Failed to get location: ${err.message}. Using default location.`)
        setInitialPosition([51.505, -0.09])
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  useEffect(() => {
    if (!isTracking || !initialPosition) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    // Start watching position when tracking is enabled
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const speed = position.coords.speed // Speed in meters per second
        const newPos: [number, number] = [position.coords.latitude, position.coords.longitude]

        // Only add position if speed is below driving threshold or unavailable
        if (speed === null || speed <= DRIVING_SPEED_THRESHOLD) {
          setPositions((prev) => [...prev, newPos])
        } else {
          console.log(`Speed ${speed} m/s exceeds threshold, likely driving - skipping position`)
        }
      },
      (err) => {
        setError(`Tracking error: ${err.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )

    // Cleanup watchPosition on unmount or when isTracking becomes false
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isTracking, initialPosition, setPositions])

  useEffect(() => {
    if (!mapRef.current || !initialPosition) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(initialPosition, 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    if (!isTracking && positions.length === 0) {
      map.setView(initialPosition, 13)
      const userLocationIcon = L.divIcon({
        html: `<div class="bg-blue-500 rounded-full p-1 border-2 border-white" style="width: 12px; height: 12px;"></div>`,
        className: "custom-div-icon",
      })
      L.marker(initialPosition, { icon: userLocationIcon })
        .addTo(map)
       // .bindPopup("Your current location")
        .openPopup()
      return
    }

    if (positions.length > 0) {
      if (polylineRef.current) map.removeLayer(polylineRef.current)
      markersRef.current.forEach((marker) => map.removeLayer(marker))
      markersRef.current = []

      const latLngs = positions.map((pos) => [pos[0], pos[1]] as L.LatLngExpression)
      polylineRef.current = L.polyline(latLngs, { color: "blue", weight: 5 }).addTo(map)

      const startIcon = L.divIcon({
        html: `<div class="bg-green-500 rounded-full p-1 border-2 border-white" style="width: 12px; height: 12px;"></div>`,
        className: "custom-div-icon",
      })
      const startMarker = L.marker(latLngs[0], { icon: startIcon }).addTo(map)
      markersRef.current.push(startMarker)

      const currentIcon = L.divIcon({
        html: `<div class="bg-red-500 rounded-full p-1 border-2 border-white" style="width: 12px; height: 12px;"></div>`,
        className: "custom-div-icon",
      })
      const currentMarker = L.marker(latLngs[latLngs.length - 1], { icon: currentIcon }).addTo(map)
      markersRef.current.push(currentMarker)

      if (positions.length > 1) {
        map.fitBounds(polylineRef.current.getBounds(), { padding: [30, 30] })
      } else {
        map.setView(latLngs[0], 15)
      }
    }
  }, [positions, isTracking, initialPosition])

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      {error && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}