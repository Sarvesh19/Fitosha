"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Activity, BarChart3, LogOut, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function Navbar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
    router.push("/login")
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Activity className="h-6 w-6" />
          <span>FitTrack</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link
            href="/dashboard"
            className={`text-sm font-medium ${pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"} hover:text-primary flex items-center gap-1`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            href="/track"
            className={`text-sm font-medium ${pathname === "/track" ? "text-primary" : "text-muted-foreground"} hover:text-primary flex items-center gap-1`}
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Track Activity</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span>|</span>
            <span>{userEmail}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-1">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}

