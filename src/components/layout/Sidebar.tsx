import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import {
  Calendar,
  CalendarCheck,
  Users,
  Settings,
  Hotel,
  LogOut,
  User as UserIcon,
} from "lucide-react"

const navigation = [
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Bookings", href: "/bookings", icon: CalendarCheck },
  { name: "Guests", href: "/guests", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const { settings } = useHotelSettings()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        {settings?.logo_url ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <img
              src={settings.logo_url}
              alt={settings.name || "Hotel Logo"}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Hotel className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold tracking-tight text-slate-900">
            {settings?.name || "Hotel PMS"}
          </h2>
          <p className="text-[11px] text-slate-500 truncate">Property Management</p>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile & Logout */}
      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800">
              {user?.email ?? "Staff Member"}
            </p>
            <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Staff / Admin
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
