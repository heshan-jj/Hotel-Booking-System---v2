import React, { useState } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { Hotel, Lock, Mail, AlertCircle, Loader2, ShieldCheck } from "lucide-react"

export function LoginPage() {
  const { user, signInWithPassword, isLoading: authLoading } = useAuth()
  const { settings } = useHotelSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/"

  if (!authLoading && user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setInfoMsg(null)

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

  const handleForgotClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setInfoMsg("Please contact your Hotel System Administrator to reset credentials or issue a new access key.")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6 md:p-10 overflow-hidden select-none">
      {/* Subtle Background Glow Spheres */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Main Glass Card */}
      <div className="relative w-full max-w-[860px] overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-zinc-900 shadow-2xl backdrop-blur-2xl transition-all duration-300">
        <div className="flex flex-col md:flex-row min-h-[520px]">
          
          {/* Left Column: Graphic & Laptop Illustration */}
          <div className="flex md:w-1/2 items-center justify-center p-8 sm:p-12 bg-slate-50/70 dark:bg-zinc-900/40 relative border-b md:border-b-0 md:border-r border-black/[0.06] dark:border-white/[0.08]">
            <div className="relative flex items-center justify-center">
              {/* Central Light Circular Backdrop */}
              <div className="flex h-64 w-64 sm:h-72 sm:w-72 items-center justify-center rounded-full bg-slate-100/90 dark:bg-zinc-800/70 p-6 shadow-inner border border-black/[0.04] dark:border-white/[0.06]">
                {/* SVG System Laptop Illustration */}
                <div className="w-full max-w-[200px] transition-transform duration-300 hover:scale-105">
                  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-lg">
                    {/* Laptop Screen Outer */}
                    <rect x="25" y="15" width="150" height="100" rx="10" fill="#1e293b" />
                    {/* Laptop Display Inner */}
                    <rect x="30" y="20" width="140" height="90" rx="6" fill="#0f172a" />
                    
                    {/* Primary Accent Circle & User Icon */}
                    <circle cx="100" cy="52" r="20" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="2" />
                    <circle cx="100" cy="46" r="7" fill="hsl(var(--primary))" />
                    <path d="M87 63C87 56.5 92.8 51.5 100 51.5C107.2 51.5 113 56.5 113 63" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                    
                    {/* UI Dashboard Wireframe Lines */}
                    <rect x="50" y="78" width="100" height="6" rx="3" fill="hsl(var(--primary) / 0.3)" />
                    <rect x="65" y="90" width="70" height="4" rx="2" fill="#475569" opacity="0.6" />

                    {/* Laptop Base Hinge */}
                    <path d="M20 115H180V120C180 122.2 178.2 124 176 124H24C21.8 124 20 122.2 20 120V115Z" fill="#334155" />
                    {/* Trackpad notch */}
                    <path d="M85 115H115V117H85V115Z" fill="#64748b" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Member Login Form */}
          <div className="flex md:w-1/2 flex-col justify-between p-8 sm:p-12">
            <div>
              {/* Hotel Brand Header & Title */}
              <div className="mb-7 text-center">
                <div className="mx-auto mb-3 flex items-center justify-center gap-2">
                  {settings?.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="Hotel Logo"
                      className="h-9 w-9 rounded-xl object-contain border border-black/[0.08] dark:border-white/[0.1] p-1 shadow-ios-sm"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-ios-sm">
                      <Hotel className="h-4.5 w-4.5" />
                    </div>
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {settings?.name || "Hotel Management"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  Member Login
                </h1>
                <p className="mt-1 text-xs text-slate-400 font-normal">
                  Sign in to access your property management dashboard
                </p>
              </div>

              {/* Alert Messages */}
              {errorMsg && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-semibold text-red-800 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="mb-5 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/40 p-3.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="loginEmail" className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Staff / Admin Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="loginEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@hotel.com"
                      className="h-11 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/80 pl-10 pr-4 text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-ios-sm transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="loginPassword" className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-zinc-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="loginPassword"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/80 pl-10 pr-4 text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-ios-sm transition-all"
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider shadow-ios-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>
              </form>

              {/* Forgot password link */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleForgotClick}
                  className="text-xs font-medium text-slate-400 hover:text-primary transition-colors cursor-pointer"
                >
                  Forgot Username / Password?
                </button>
              </div>
            </div>

            {/* Security Footer Note */}
            <div className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 dark:text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>Protected Staff Portal • Public access disabled</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}



