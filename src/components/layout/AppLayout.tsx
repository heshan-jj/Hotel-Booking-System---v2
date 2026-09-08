import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { useHotelSettings } from "@/hooks/useHotelSettings"

export function AppLayout() {
  const { settings } = useHotelSettings()
  const location = useLocation()

  // Get current page name from path
  const path = location.pathname.replace("/", "")
  const pageTitle = path ? path.charAt(0).toUpperCase() + path.slice(1) : "Calendar"

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fb] dark:bg-zinc-950 text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Frosted Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 z-10 select-none">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-zinc-500">
            <span className="hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
              {settings?.name || "Hotel"}
            </span>
            <span className="text-slate-300 dark:text-zinc-700">/</span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-zinc-300 shadow-ios-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="truncate max-w-[160px]">{settings?.name || "Hotel PMS"}</span>
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
