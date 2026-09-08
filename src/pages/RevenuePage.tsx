import { useState, useMemo } from "react"
import { useBookings, useRooms } from "@/hooks/useBookingsData"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { BOOKING_SOURCES } from "@/constants/booking"
import type { BookingSource } from "@/types/booking"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Receipt,
  Utensils,
  RefreshCw,
  User,
  Loader2,
} from "lucide-react"

type TimeRange = "all" | "this_month" | "last_30" | "this_year"

export function RevenuePage() {
  const { data: bookings = [], isLoading, refetch } = useBookings()
  const { data: rooms = [] } = useRooms()
  const { formatPrice } = useHotelSettings()

  const [timeRange, setTimeRange] = useState<TimeRange>("all")

  // Filter valid revenue-generating bookings based on time range
  const filteredBookings = useMemo(() => {
    const now = new Date()

    return bookings.filter((b) => {
      // Exclude cancelled bookings from revenue calculations
      if (b.status === "cancelled") return false

      const checkInDate = new Date(b.check_in)
      if (isNaN(checkInDate.getTime())) return false

      if (timeRange === "this_month") {
        return (
          checkInDate.getFullYear() === now.getFullYear() &&
          checkInDate.getMonth() === now.getMonth()
        )
      }

      if (timeRange === "last_30") {
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(now.getDate() - 30)
        return checkInDate >= thirtyDaysAgo && checkInDate <= now
      }

      if (timeRange === "this_year") {
        return checkInDate.getFullYear() === now.getFullYear()
      }

      return true // "all"
    })
  }, [bookings, timeRange])

  // Financial Metrics Calculation
  const metrics = useMemo(() => {
    let totalRevenue = 0
    let extrasRevenue = 0
    let totalNights = 0

    filteredBookings.forEach((b) => {
      totalRevenue += Number(b.total_price) || 0
      extrasRevenue += Number(b.extra_charges) || 0

      const d1 = new Date(b.check_in)
      const d2 = new Date(b.check_out)
      const diffDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
      totalNights += diffDays > 0 ? diffDays : 1
    })

    const roomRevenue = Math.max(0, totalRevenue - extrasRevenue)
    const adr = totalNights > 0 ? roomRevenue / totalNights : 0
    const avgBookingValue = filteredBookings.length > 0 ? totalRevenue / filteredBookings.length : 0

    return {
      totalRevenue,
      extrasRevenue,
      roomRevenue,
      totalNights,
      adr,
      avgBookingValue,
      totalBookings: filteredBookings.length,
    }
  }, [filteredBookings])

  // Channel Distribution
  const channelData = useMemo(() => {
    const channelMap: Record<string, { revenue: number; count: number }> = {}

    Object.keys(BOOKING_SOURCES).forEach((key) => {
      channelMap[key] = { revenue: 0, count: 0 }
    })

    filteredBookings.forEach((b) => {
      const src = b.source || "direct"
      if (!channelMap[src]) {
        channelMap[src] = { revenue: 0, count: 0 }
      }
      channelMap[src].revenue += Number(b.total_price) || 0
      channelMap[src].count += 1
    })

    return Object.entries(channelMap)
      .map(([key, val]) => {
        const meta = BOOKING_SOURCES[key as BookingSource] || BOOKING_SOURCES.direct
        const percentage = metrics.totalRevenue > 0 ? (val.revenue / metrics.totalRevenue) * 100 : 0
        return {
          key,
          label: meta.label,
          hex: meta.hex,
          revenue: val.revenue,
          count: val.count,
          percentage,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
  }, [filteredBookings, metrics.totalRevenue])

  // Room Performance
  const roomYield = useMemo(() => {
    const roomMap: Record<string, { name: string; revenue: number; nights: number; bookings: number }> = {}

    rooms.forEach((r) => {
      roomMap[r.id] = { name: r.name, revenue: 0, nights: 0, bookings: 0 }
    })

    filteredBookings.forEach((b) => {
      if (roomMap[b.room_id]) {
        roomMap[b.room_id].revenue += Number(b.total_price) || 0
        roomMap[b.room_id].bookings += 1

        const d1 = new Date(b.check_in)
        const d2 = new Date(b.check_out)
        const diffDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
        roomMap[b.room_id].nights += diffDays > 0 ? diffDays : 1
      }
    })

    return Object.values(roomMap).sort((a, b) => b.revenue - a.revenue)
  }, [rooms, filteredBookings])

  // Recent 10 revenue transactions
  const recentTransactions = useMemo(() => {
    return [...filteredBookings]
      .sort((a, b) => new Date(b.created_at || b.check_in).getTime() - new Date(a.created_at || a.check_in).getTime())
      .slice(0, 8)
  }, [filteredBookings])

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 shadow-ios-sm">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Revenue & Financials
            </h1>
            <p className="text-xs text-slate-400 font-normal">
              Property earnings, channel yield, and average daily rate insights
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* iOS Segmented Time Switcher */}
          <div className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-200/60 dark:bg-zinc-800/70 p-0.5 text-slate-600 dark:text-zinc-400 border border-black/[0.04] select-none">
            {(
              [
                { id: "all", label: "All Time" },
                { id: "this_month", label: "This Month" },
                { id: "last_30", label: "Last 30 Days" },
                { id: "this_year", label: "This Year" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium tracking-tight transition-all duration-150 active:scale-[0.98] ${
                  timeRange === t.id
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-ios-sm font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Total Gross Revenue */}
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3.5 shadow-ios-card transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-emerald-500" />
              Total Revenue
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-mono">
            {formatPrice(metrics.totalRevenue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Across {metrics.totalBookings} reservation{metrics.totalBookings === 1 ? "" : "s"}
          </p>
        </div>

        {/* Average Daily Rate */}
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3.5 shadow-ios-card transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#0071e3] uppercase tracking-wider flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              ADR (Per Night)
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#0071e3] font-mono">
            {formatPrice(metrics.adr)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Average room rate achieved</p>
        </div>

        {/* Total Booked Nights */}
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3.5 shadow-ios-card transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-indigo-500" />
              Occupied Nights
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-mono">
            {metrics.totalNights}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total stay nights confirmed</p>
        </div>

        {/* F&B & Extras Revenue */}
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3.5 shadow-ios-card transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              Extras & F&B
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            {formatPrice(metrics.extrasRevenue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Add-ons, dining & mini-bar</p>
        </div>
      </div>

      {/* Breakdown Grid: Channel Distribution & Room Yield */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Booking Channel Distribution */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Channel Yield Distribution</span>
              <span className="text-[11px] font-normal text-slate-400">By booking source</span>
            </CardTitle>
            <CardDescription className="text-[11px]">
              Revenue contributions generated across connected channels
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {channelData.map((c) => (
              <div key={c.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.hex }} />
                    <span className="font-medium text-slate-700 dark:text-zinc-300">{c.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({c.count} bookings)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">
                      {formatPrice(c.revenue)}
                    </span>
                    <span className="text-[11px] text-slate-400 w-10 text-right font-mono">
                      {c.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(c.percentage, c.revenue > 0 ? 3 : 0)}%`,
                      backgroundColor: c.hex,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Room Yield Ranking */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Room Yield Ranking</span>
              <span className="text-[11px] font-normal text-slate-400">Top earning rooms</span>
            </CardTitle>
            <CardDescription className="text-[11px]">
              Gross revenue generated grouped by individual room
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {roomYield.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No room data available</div>
            ) : (
              <div className="space-y-2">
                {roomYield.map((r, index) => {
                  const percentOfTotal =
                    metrics.totalRevenue > 0 ? (r.revenue / metrics.totalRevenue) * 100 : 0

                  return (
                    <div
                      key={r.name}
                      className="flex items-center justify-between rounded-xl border border-black/[0.04] dark:border-white/[0.05] bg-slate-50/50 dark:bg-zinc-800/40 p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[11px] font-bold text-slate-600 dark:text-zinc-400 font-mono">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                            {r.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {r.nights} nights • {r.bookings} stay{r.bookings === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 font-mono">
                          {formatPrice(r.revenue)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {percentOfTotal.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Revenue Transactions Table */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Revenue Activity</CardTitle>
              <CardDescription className="text-[11px]">
                Latest confirmed and checked-in revenue transactions
              </CardDescription>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Showing {recentTransactions.length} of {filteredBookings.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#0071e3]" />
              <span>Loading transactions...</span>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No revenue transactions recorded for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Stay Period</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Gross Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => {
                    const sourceMeta =
                      BOOKING_SOURCES[tx.source as BookingSource] || BOOKING_SOURCES.direct

                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3] font-semibold text-[10px] border border-[#0071e3]/20">
                              {tx.guest?.name ? tx.guest.name.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
                            </div>
                            <span className="font-semibold text-xs text-slate-800 dark:text-zinc-200">
                              {tx.guest?.name || "Guest"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-slate-700 dark:text-zinc-300">
                            {tx.room?.name || "Room"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                            {tx.check_in} → {tx.check_out}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge className={`text-[10px] border font-medium ${sourceMeta.badgeClass}`}>
                            <span
                              className="h-1.5 w-1.5 rounded-full mr-1"
                              style={{ backgroundColor: sourceMeta.hex }}
                            />
                            {sourceMeta.label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={tx.status === "confirmed" ? "success" : "default"}
                            className="capitalize text-[10px]"
                          >
                            {tx.status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="font-mono font-semibold text-xs text-slate-900 dark:text-zinc-100">
                            {formatPrice(tx.total_price)}
                          </span>
                          {Number(tx.extra_charges || 0) > 0 && (
                            <span className="block text-[9px] text-amber-600 font-mono">
                              +{formatPrice(tx.extra_charges)} extras
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
