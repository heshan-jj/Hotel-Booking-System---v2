import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
