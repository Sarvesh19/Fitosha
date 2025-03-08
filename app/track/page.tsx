import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { TrackingForm } from "./tracking-form"

export default async function TrackPage() {
  const supabase = createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null // This should be handled by middleware
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userEmail={user.email || ""} />
      <main className="flex-1 container py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Track Activity</h1>
            <p className="text-muted-foreground">Record your walking or jogging activity</p>
          </div>

          <TrackingForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}

