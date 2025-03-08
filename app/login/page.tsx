import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LoginForm } from "./login-form"
import Link from "next/link"
import { Activity } from "lucide-react"

export default async function LoginPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary">
            <Activity className="h-8 w-8" />
            <span>FitTrack</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Enter your email and password to sign in to your account</p>
        </div>
        <div className="space-y-4">
          <LoginForm />
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

