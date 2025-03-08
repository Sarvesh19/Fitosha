"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDistance } from "@/lib/utils"
import { MapPin, Activity, Clock, Ruler, Calendar } from "lucide-react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

const WorkoutMap = dynamic(() => import("./workout-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-xl">
      <div className="animate-pulse text-gray-400 text-sm">Loading map...</div>
    </div>
  ),
})

type Workout = {
  id: string
  activity_type: string
  start_time: string
  end_time: string
  route_data: any
  distance: number
}

const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hrs}h ${mins}m ${secs}s`
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function WorkoutList({ workouts }: { workouts: any[] }) {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [filterDate, setFilterDate] = useState<Date | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const calculateDuration = (start: string, end: string) => {
    return (new Date(end).getTime() - new Date(start).getTime()) / 1000
  }

  const filteredWorkouts = useMemo(() => {
    let result = [...workouts].sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )

    if (filterDate) {
      const selectedDate = new Date(filterDate)
      result = result.filter(workout => {
        const workoutDate = new Date(workout.start_time)
        return workoutDate.toDateString() === selectedDate.toDateString()
      })
    }

    return result
  }, [workouts, filterDate])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-3">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header with Filter Beside Workout History */}
        <div className="flex items-center gap-2">
  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
    Workout History
  </h3>
  <div className="relative">
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-gray-500 hover:text-gray-700"
      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
    >
      <Calendar className="h-4 w-4" />
    </Button>
    {filterDate && (
      <span className="text-sm text-gray-600 absolute left-10 top-1.5">
        {filterDate.toLocaleDateString('en-GB')}
      </span>
    )}
    {isDatePickerOpen && (
      <div className="absolute right-0 top-10 z-50 left-2 sm:left-auto">
        <DatePicker
          selected={filterDate}
          onChange={(date: Date | null) => {
            if (date) {
              setFilterDate(date)
            }
            setIsDatePickerOpen(false)
          }}
          inline // Renders the calendar inline
          className="border border-gray-200 rounded-lg shadow-lg bg-white"
        />
      </div>
    )}
  </div>
</div>

        {/* Workout Cards */}
        <div className="grid gap-3">
          {filteredWorkouts.length === 0 ? (
            <Card className="bg-white/50 backdrop-blur-sm border-none">
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 text-sm">
                  {filterDate ? "No workouts found for this date" : "No workouts yet. Start your journey!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredWorkouts.map((workout) => (
              <Card
                key={workout.id}
                className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-none cursor-pointer"
                onClick={() => setSelectedWorkout(workout)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-gradient-to-br from-blue-100 to-green-100">
                      {workout.activity_type === "Walk" ? (
                        <MapPin className="h-4 w-4 text-green-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">{workout.activity_type}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {formatDistance(workout.distance)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatDateTime(workout.start_time)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Enhanced Workout Details Dialog */}
        <Dialog open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
          <DialogContent className="max-w-xl bg-white/95 backdrop-blur-sm rounded-xl border-none shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-full bg-gradient-to-br from-blue-100 to-green-100">
                  {selectedWorkout?.activity_type === "Walk" ? (
                    <MapPin className="h-4 w-4 text-green-600" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <span className="font-bold">{selectedWorkout?.activity_type}</span>
              </DialogTitle>
            </DialogHeader>
            {selectedWorkout && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="font-medium text-sm">
                        {formatTime(calculateDuration(selectedWorkout.start_time, selectedWorkout.end_time))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Ruler className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600">Distance</p>
                      <p className="font-medium text-sm">{formatDistance(selectedWorkout.distance)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600">Started</p>
                      <p className="font-medium text-sm">{formatDateTime(selectedWorkout.start_time)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden shadow-md">
                  <WorkoutMap routeData={selectedWorkout.route_data} />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}