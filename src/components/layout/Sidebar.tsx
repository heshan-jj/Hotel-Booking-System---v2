import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import {
  Calendar,
  CalendarCheck,
  TrendingUp,
  Users,
  Settings,
  Hotel,
  LogOut,
  User as UserIcon,
  X,
} from "lucide-react"

const navigation = [
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Bookings", href: "/bookings", icon: CalendarCheck },
  { name: "Revenue", href: "/revenue", icon: TrendingUp },
  { name: "Guests", href: "/guests", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  className?: string
  onItemClick?: () => void
  onClose?: () => void
  isMobileDrawer?: boolean
}

export function Sidebar({ className = "", onItemClick, onClose, isMobileDrawer = false }: SidebarProps) {
  const { user, signOut } = useAuth()
  const { settings } = useHotelSettings()

  return (
    <aside
      className={`${
        isMobileDrawer
          ? "flex h-full w-full flex-col"
          : "hidden md:flex h-screen w-64 flex-col border-r border-black/[0.06] dark:border-white/[0.08]"
      } bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl select-none shrink-0 ${className}`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06] px-4">
        <div className="flex items-center gap-3 min-w-0">
          {settings?.logo_url ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white p-0.5 shadow-ios-sm">
              <img
                src={settings.logo_url}
                alt={settings.name || "Hotel Logo"}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0071e3] text-white shadow-ios-sm">
              <Hotel className="h-4 w-4" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xs font-semibold tracking-tight text-slate-900 dark:text-white">
              {settings?.name || "Hotel PMS"}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate font-medium">Property Management</p>
          </div>
        </div>

        {isMobileDrawer && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 transition-colors active:scale-95"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Main Menu
        </p>
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? "bg-[#0071e3]/10 text-[#0071e3] dark:text-[#3898ec] font-semibold shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-black/[0.035] dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-zinc-100"
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="border-t border-black/[0.05] dark:border-white/[0.06] p-3 space-y-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-slate-50/80 dark:bg-zinc-900/60 p-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-xs">
            {user?.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-800 dark:text-zinc-200">
              {user?.email ?? "Staff Member"}
            </p>
            <span className="inline-block rounded px-1.5 py-0.2 text-[9px] font-medium tracking-tight bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
              Staff / Admin
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white/90 dark:bg-zinc-900/90 text-xs font-medium text-slate-600 dark:text-zinc-400 shadow-ios-sm transition-all duration-150 hover:bg-rose-50/80 hover:text-rose-600 hover:border-rose-200 active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
