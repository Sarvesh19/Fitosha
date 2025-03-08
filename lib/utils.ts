import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(2)} km`
}

// export function calculateDistance(positions: [number, number][]): number {
//   if (positions.length < 2) return 0

//   const R = 6371e3 // Earth's radius in meters
//   let totalDistance = 0

//   for (let i = 1; i < positions.length; i++) {
//     const [lat1, lon1] = positions[i - 1]
//     const [lat2, lon2] = positions[i]

//     const φ1 = (lat1 * Math.PI) / 180
//     const φ2 = (lat2 * Math.PI) / 180
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

//     const segmentDistance = R * c

//     // Apply simple smoothing: only add distance if it's significant
//     if (segmentDistance > 1) { // Minimum distance threshold in meters
//       totalDistance += segmentDistance
//     }
//   }

//   return Number(totalDistance.toFixed(2)) // Round to 2 decimal places
// }

export function calculateDistance(positions: [number, number][], windowSize = 3): number {
  if (positions.length < 2) return 0
  const R = 6371e3
  let totalDistance = 0
  const smoothedPositions = []

  // Apply moving average
  for (let i = 0; i < positions.length; i++) {
    const window = positions.slice(Math.max(0, i - windowSize + 1), i + 1)
    if (window.length === windowSize) {
      const avgLat = window.reduce((sum, pos) => sum + pos[0], 0) / windowSize
      const avgLon = window.reduce((sum, pos) => sum + pos[1], 0) / windowSize
      smoothedPositions.push([avgLat, avgLon])
    } else {
      smoothedPositions.push(positions[i])
    }
  }

  for (let i = 1; i < smoothedPositions.length; i++) {
    const [lat1, lon1] = smoothedPositions[i - 1]
    const [lat2, lon2] = smoothedPositions[i]
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const segmentDistance = R * c

    if (segmentDistance > 1) {
      totalDistance += segmentDistance
    }
  }

  return Number(totalDistance.toFixed(2))
}

// Calculate distance between two points using the Haversine formula
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

