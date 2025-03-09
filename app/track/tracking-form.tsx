"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { formatTime, formatDistance, calculateDistance } from "@/lib/utils"
import { Play, Square, Timer, Route } from "lucide-react"
import dynamic from "next/dynamic"

const TrackingMap = dynamic(() => import("./tracking-map"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted flex items-center justify-center">Loading map...</div>,
})

type TrackingFormProps = {
  userId: string
}

export function TrackingForm({ userId }: TrackingFormProps) {
  const [activityType, setActivityType] = useState<string>("Walk")
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [positions, setPositions] = useState<[number, number][]>([])
  const [distance, setDistance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null)
  const [firstPositionSet, setFirstPositionSet] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now())

  const watchIdRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Speed thresholds in m/s
  const SPEED_THRESHOLDS = {
    Walk: 2, // ~7.2 km/h
    Jog: 5,  // ~18 km/h
    Drive: Infinity, // No limit for driving
  }

  // Recalculate distance with a sanity check
  useEffect(() => {
    if (positions.length >= 2) {
      const newDistance = calculateDistance(positions)
      // Sanity check: Reset distance if it jumps too high too soon for "Walk"
      if (newDistance > 50 && elapsedTime < 10 && activityType === "Walk") {
        console.log("Unrealistic distance detected, resetting:", newDistance)
        setDistance(0)
      } else {
        setDistance(newDistance)
      }
    } else {
      setDistance(0)
    }
  }, [positions, elapsedTime, activityType])

  // Handle permissions and cleanup
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermissionStatus(result.state)
        result.onchange = () => setPermissionStatus(result.state)
      })
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTracking = async () => {
    setError(null)
    setFirstPositionSet(false)
    setPositions([])
    setLastUpdateTime(Date.now())

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    if (permissionStatus === "denied") {
      setError("Location permission has been denied. Please enable it in your browser settings.")
      return
    }

    try {
      let stabilizedPosition: [number, number] | null = null
      await new Promise((resolve, reject) => {
        let attempts = 0
        const maxAttempts = 5
        let lastPosition: [number, number] | null = null
        const interval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude, accuracy } = position.coords
              const newPosition: [number, number] = [latitude, longitude]
              console.log(`Attempt ${attempts + 1}: Position = [${latitude}, ${longitude}], Accuracy = ${accuracy}m`)
              
              // Stricter accuracy requirement: < 20m
              if (accuracy < 20) {
                if (lastPosition && calculateDistance([lastPosition, newPosition]) < 5) {
                  stabilizedPosition = newPosition
                  clearInterval(interval)
                  console.log("Stabilized position:", stabilizedPosition)
                  resolve(stabilizedPosition)
                }
                lastPosition = newPosition
              }

              attempts++
              if (attempts >= maxAttempts) {
                stabilizedPosition = lastPosition || [latitude, longitude]
                clearInterval(interval)
                console.log("Max attempts reached, using:", stabilizedPosition)
                resolve(stabilizedPosition)
              }
            },
            reject,
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            }
          )
        }, 2000)
      })

      if (!stabilizedPosition) {
        throw new Error("Failed to stabilize initial position")
      }

      setIsTracking(true)
      setStartTime(new Date())
      setPositions([stabilizedPosition])
      setDistance(0)
      setElapsedTime(0)
      setFirstPositionSet(true)

      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed } = position.coords
          const currentTime = Date.now()
          const timeDiff = (currentTime - lastUpdateTime) / 1000
          setLastUpdateTime(currentTime)

          console.log('Position update:', { latitude, longitude, accuracy, speed, timestamp: position.timestamp })

          // Stricter accuracy filter: > 50m ignored
          if (accuracy > 50) {
            console.log(`Accuracy too low: ${accuracy}m - skipping`)
            return
          }

          // Skip if speed is near zero and we have prior positions
          if (speed !== null && speed < 0.1 && positions.length > 1) {
            console.log(`Speed ${speed} m/s too low - skipping`)
            return
          }

          const newPosition: [number, number] = [latitude, longitude]
          const speedThreshold = SPEED_THRESHOLDS[activityType as keyof typeof SPEED_THRESHOLDS]

          if (speed !== null && speed > speedThreshold && activityType !== "Drive") {
            console.log(`Speed ${speed} m/s exceeds ${speedThreshold} m/s for ${activityType} - skipping`)
            return
          }

          setPositions((prev) => {
            if (prev.length === 0) {
              return [newPosition]
            }

            const lastPosition = prev[prev.length - 1]
            const segmentDistance = calculateDistance([lastPosition, newPosition])
            const estimatedSpeed = timeDiff > 0 ? segmentDistance / timeDiff : 0
            console.log(`Segment distance: ${segmentDistance}m, Estimated speed: ${estimatedSpeed} m/s`)

            // Prevent initial spikes for Walk: limit jumps to 10m in first 5 positions
            if (activityType === "Walk" && segmentDistance > 10 && prev.length < 5) {
              console.log(`Initial distance jump too large: ${segmentDistance}m - skipping`)
              return prev
            }

            // Stricter dynamic distance threshold
            const distanceThreshold = estimatedSpeed > 5 ? 50 : 10 // Increased from 5 to 10m
            if (segmentDistance < distanceThreshold && prev.length > 1) {
              console.log(`Distance ${segmentDistance}m below threshold ${distanceThreshold}m - skipping`)
              return prev
            }

            return [...prev, newPosition]
          })
        },
        (err) => {
          let errorMessage = "Unknown error occurred"
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location permission denied"
              break
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable"
              break
            case err.TIMEOUT:
              errorMessage = "Location request timed out. Please check your GPS signal"
              break
          }
          setError(`Error getting location: ${errorMessage}`)
          stopTracking()
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000,
        }
      )
    } catch (err: any) {
      setError(`Failed to start tracking: ${err.message}. Please ensure location services are enabled.`)
    }
  }

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!startTime || positions.length === 0) {
      setIsTracking(false)
      return
    }

    setIsLoading(true)

    try {
      const endTime = new Date()
      const { error } = await supabase.from("workouts").insert({
        user_id: userId,
        activity_type: activityType,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        route_data: { positions },
        distance: distance,
      })

      if (error) throw error

      toast({
        title: "Workout saved",
        description: "Your workout has been saved successfully",
      })

      setIsTracking(false)
      setStartTime(null)
      setPositions([])
      setDistance(0)
      setElapsedTime(0)
      setFirstPositionSet(false)
      setLastUpdateTime(Date.now())
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error saving workout",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorHelpText = (error: string) => {
    if (error.includes("denied")) {
      return "Please enable location permissions in your browser settings and try again."
    } else if (error.includes("timeout") || error.includes("unavailable")) {
      return "Please ensure you have a clear GPS signal and location services are enabled on your device."
    }
    return "Please try again or check your device settings."
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
          <CardDescription>Select your activity type and start tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="activity-type" className="text-sm font-medium">
                Activity Type
              </label>
              <Select disabled={isTracking} value={activityType} onValueChange={setActivityType}>
                <SelectTrigger id="activity-type">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Walk">Walk</SelectItem>
                  <SelectItem value="Jog">Jog</SelectItem>
                  <SelectItem value="Drive">Drive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                {error}
                <p className="mt-2 text-xs">{getErrorHelpText(error)}</p>
              </div>
            )}

            {isTracking && (
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <Timer className="h-5 w-5 text-primary mb-1" />
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-xl font-semibold">{formatTime(elapsedTime)}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <Route className="h-5 w-5 text-primary mb-1" />
                  <span className="text-sm text-muted-foreground">Distance</span>
                  <span className="text-xl font-semibold">{formatDistance(distance)}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {!isTracking ? (
            <Button onClick={startTracking} className="w-full" disabled={isLoading}>
              <Play className="mr-2 h-4 w-4" />
              Start Tracking
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive" className="w-full" disabled={isLoading}>
              <Square className="mr-2 h-4 w-4" />
              Stop Tracking
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
          <CardDescription>
            {isTracking ? "Your route is being tracked in real-time" : "Start tracking to see your route on the map"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full rounded-md border overflow-hidden">
            <TrackingMap positions={positions} isTracking={isTracking} setPositions={setPositions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}