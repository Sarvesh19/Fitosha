"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDate, formatTime, formatDistance } from "@/lib/utils"
import { MapPin, Activity } from "lucide-react"
import dynamic from "next/dynamic"

// Import the map component dynamically to avoid SSR issues
const WorkoutMap = dynamic(() => import("./workout-map"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted flex items-center justify-center">Loading map...</div>,
})

type Workout = {
  id: string
  activity_type: string
  start_time: string
  end_time: string
  route_data: any
  distance: number
}

export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)

  const handleViewRoute = (workout: Workout) => {
    setSelectedWorkout(workout)
  }

  const handleCloseDialog = () => {
    setSelectedWorkout(null)
  }

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    return (endTime - startTime) / 1000 // Duration in seconds
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No workouts found. Start tracking your first activity!
                </TableCell>
              </TableRow>
            ) : (
              workouts.map((workout) => (
                <TableRow key={workout.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {workout.activity_type === "Walk" ? (
                        <MapPin className="h-4 w-4 text-green-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-500" />
                      )}
                      {workout.activity_type}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(workout.start_time)}</TableCell>
                  <TableCell>{formatTime(calculateDuration(workout.start_time, workout.end_time))}</TableCell>
                  <TableCell>{formatDistance(workout.distance)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewRoute(workout)}>
                      View Route
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedWorkout} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkout?.activity_type} on {selectedWorkout && formatDate(selectedWorkout.start_time)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p className="text-lg font-medium">
                  {selectedWorkout &&
                    formatTime(calculateDuration(selectedWorkout.start_time, selectedWorkout.end_time))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Distance</p>
                <p className="text-lg font-medium">{selectedWorkout && formatDistance(selectedWorkout.distance)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-lg font-medium">{selectedWorkout?.activity_type}</p>
              </div>
            </div>

            <div className="h-[400px] w-full rounded-md border overflow-hidden">
              {selectedWorkout && <WorkoutMap routeData={selectedWorkout.route_data} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

