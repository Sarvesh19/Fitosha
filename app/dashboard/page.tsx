import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { WorkoutList } from "./workout-list"

export default async function DashboardPage() {
  const supabase = createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null // This should be handled by middleware
  }

  // Fetch workouts for the current user
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .order("start_time", { ascending: false })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userEmail={user.email || ""} />
      <main className="flex-1 container py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">View and manage your workout history</p>
          </div>

          <WorkoutList workouts={workouts || []} />
        </div>
      </main>
    </div>
  )
}

