import React, { useState } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Hotel, Lock, Mail, AlertCircle, Loader2 } from "lucide-react"

export function LoginPage() {
  const { user, signInWithPassword, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/"

  if (!authLoading && user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.")
      return
    }

    setIsSubmitting(true)
    const { error } = await signInWithPassword(email.trim(), password)
    setIsSubmitting(false)

    if (error) {
      setErrorMsg(error.message || "Failed to sign in. Please verify your credentials.")
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
              <Hotel className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Hotel Management</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in to access your property dashboard</p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Staff / Admin Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@hotel.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Protected Staff & Admin Portal. Public access is disabled.
          </div>
        </div>
      </div>
    </div>
  )
}
