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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{settings?.name || "Hotel"}</span>
            <span>/</span>
            <span className="font-semibold text-primary">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            {settings?.logo_url && (
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-0.5">
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700">
              {settings?.name || "Hotel PMS"}
            </span>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
