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
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format distance in meters to kilometers or meters.
 */
export function formatDistance(distance: number): string {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(2)} km`;
  }
  return `${distance.toFixed(0)} m`;
}

export function calculateDistance(positions: [number, number][]): number {
  let totalDistance = 0;
  for (let i = 1; i < positions.length; i++) {
    const [lat1, lon1] = positions[i - 1];
    const [lat2, lon2] = positions[i];
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    totalDistance += R * c;
  }
  return totalDistance;
}

export function smoothPositions(positions: [number, number][], windowSize: number = 3): [number, number][] {
  if (positions.length <= windowSize) return positions;

  const smoothedPositions: [number, number][] = [];

  for (let i = 0; i < positions.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(positions.length, i + Math.ceil(windowSize / 2));

    let sumLat = 0;
    let sumLon = 0;
    let count = 0;

    for (let j = start; j < end; j++) {
      sumLat += positions[j][0];
      sumLon += positions[j][1];
      count++;
    }

    const avgLat = sumLat / count;
    const avgLon = sumLon / count;
    smoothedPositions.push([avgLat, avgLon]);
  }

  return smoothedPositions;
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

