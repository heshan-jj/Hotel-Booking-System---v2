import { NavLink } from "react-router-dom"
import {
  Calendar,
  CalendarCheck,
  TrendingUp,
  Users,
  Settings,
} from "lucide-react"

const tabs = [
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Bookings", href: "/bookings", icon: CalendarCheck },
  { name: "Revenue", href: "/revenue", icon: TrendingUp },
  { name: "Guests", href: "/guests", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-black/[0.07] dark:border-white/[0.08] select-none">
      <div className="flex items-center justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.625rem)]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all duration-100 active:scale-90 ${
                isActive
                  ? "text-[#0071e3] dark:text-[#3898ec]"
                  : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <tab.icon className={`h-5 w-5 transition-transform ${isActive ? "stroke-[2.2]" : "stroke-[1.7]"}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#0071e3] dark:bg-[#3898ec]" />
                  )}
                </div>
                <span className={`text-[10px] tracking-tight mt-1 ${isActive ? "font-semibold" : "font-medium"}`}>
                  {tab.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
