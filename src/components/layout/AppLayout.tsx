import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { MobileTabBar } from "./MobileTabBar"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { useAuth } from "@/contexts/AuthContext"
import { LogOut, Menu } from "lucide-react"

const ROUTE_TITLES: Record<string, string> = {
  "/calendar": "Reservations Calendar",
  "/bookings": "Bookings & Reservations",
  "/revenue": "Revenue & Financials",
  "/guests": "Guest Directory",
  "/settings": "Hotel Settings",
  "/onboarding": "Hotel Onboarding",
}

export function AppLayout() {
  const { settings } = useHotelSettings()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Declarative page title resolution
  const currentPath = location.pathname
  const pageTitle =
    ROUTE_TITLES[currentPath] ||
    currentPath.replace("/", "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Dashboard"

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fb] dark:bg-zinc-950 text-foreground">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Mobile Drawer Slide-over */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Dimmed backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-zinc-950 shadow-2xl transition-transform animate-in slide-in-from-left duration-200 flex flex-col z-50">
            <Sidebar
              isMobileDrawer
              onClose={() => setIsMobileMenuOpen(false)}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Top Frosted Header */}
        <header className="flex h-13 sm:h-14 shrink-0 items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md px-3 sm:px-6 z-20 select-none">
          {/* Left Area: Mobile Hamburger Button & Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-zinc-500">
            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white/80 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 shadow-ios-sm active:scale-95 transition-all mr-1"
              aria-label="Open menu"
              title="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Mobile Logo */}
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="h-6 w-6 rounded-md object-contain border border-black/[0.08] p-0.5 md:hidden"
              />
            ) : null}
            <span className="hidden sm:inline hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
              {settings?.name || "Hotel"}
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">/</span>
            <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm sm:text-xs">
              {pageTitle}
            </span>
          </div>

          {/* Right Area: Status & Mobile Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 px-2 sm:px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-300 shadow-ios-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="truncate max-w-[100px] sm:max-w-[160px]">{settings?.name || "Hotel PMS"}</span>
            </div>

            {/* Mobile Quick Sign-Out */}
            <button
              type="button"
              onClick={() => signOut()}
              title={`Sign out (${user?.email})`}
              className="flex md:hidden h-7 w-7 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 text-slate-500 hover:text-rose-600 active:scale-95 transition-all shadow-ios-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Main Content View with mobile bottom padding */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 pb-24 md:pb-7">
          <Outlet />
        </main>

        {/* Native iOS Mobile Bottom Tab Bar (visible on < md) */}
        <MobileTabBar />
      </div>
    </div>
  )
}
