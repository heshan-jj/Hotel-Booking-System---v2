import { Navigate, Outlet } from "react-router-dom"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { Loader2 } from "lucide-react"

export function OnboardingGuard() {
  const { settings, isLoading } = useHotelSettings()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading hotel configuration...</p>
        </div>
      </div>
    )
  }

  // If onboarding is not completed or the settings row does not exist, redirect to /onboarding
  if (!settings || !settings.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  // Otherwise, render protected dashboard content
  return <Outlet />
}
