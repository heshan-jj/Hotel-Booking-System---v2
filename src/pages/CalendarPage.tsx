import { useState, useMemo } from "react"
import { Calendar, type View, Views } from "react-big-calendar"
import { localizer } from "@/lib/calendarLocalizer"
import { useBookings, useRooms, useCreateDefaultRoom } from "@/hooks/useBookingsData"
import { BookingModal } from "@/components/bookings/BookingModal"
import { BOOKING_SOURCES } from "@/constants/booking"
import type { BookingWithDetails, BookingSource } from "@/types/booking"
import {
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  Filter,
  RefreshCw,
  BedDouble,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import "@/styles/calendar.css"

interface CalendarBookingEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  booking: BookingWithDetails
}

export function CalendarPage() {
  const { data: bookings = [], isLoading, isError, error, refetch } = useBookings()
  const { data: rooms = [] } = useRooms()
  const createDefaultRoomsMutation = useCreateDefaultRoom()

  // Calendar View & Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)

  // Filters
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [selectedDates, setSelectedDates] = useState<{
    check_in: string
    check_out: string
  } | null>(null)

  // Map bookings to react-big-calendar events
  const events = useMemo<CalendarBookingEvent[]>(() => {
    return bookings
      .filter((booking) => {
        if (selectedSource !== "all" && booking.source !== selectedSource) {
          return false
        }
        if (selectedRoomId !== "all" && booking.room_id !== selectedRoomId) {
          return false
        }
        return true
      })
      .map((booking) => {
        // Parse dates: check_in at 14:00, check_out at 11:00 for realistic calendar range
        const [inY, inM, inD] = booking.check_in.split("-").map(Number)
        const [outY, outM, outD] = booking.check_out.split("-").map(Number)

        const startDate = new Date(inY, inM - 1, inD, 14, 0, 0)
        // Checkout end: midday on checkout date ensures visual bar spans through the stay
        const endDate = new Date(outY, outM - 1, outD, 11, 0, 0)

        const guestName = booking.guest?.name || "Guest"
        const roomName = booking.room?.name || "Room"

        return {
          id: booking.id,
          title: `${roomName} • ${guestName}`,
          start: startDate,
          end: endDate,
          allDay: true,
          booking,
        }
      })
  }, [bookings, selectedSource, selectedRoomId])

  // Custom Event Styling with Source Color Coding
  const eventPropGetter = (event: CalendarBookingEvent) => {
    const meta =
      BOOKING_SOURCES[event.booking.source as BookingSource] || BOOKING_SOURCES.direct
    return {
      style: {
        backgroundColor: meta.hex,
        borderColor: meta.hex,
        color: "#ffffff",
        borderRadius: "6px",
        fontSize: "0.8125rem",
        fontWeight: "500",
        padding: "2px 6px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      },
    }
  }

  // Handle Event Click (Edit Booking)
  const handleSelectEvent = (event: CalendarBookingEvent) => {
    setSelectedBooking(event.booking)
    setSelectedDates(null)
    setIsModalOpen(true)
  }

  // Handle Slot Select (Clicking empty date on calendar to create booking)
  const handleSelectSlot = (slotInfo: { start: Date; end: Date; action?: string }) => {
    const startStr = formatDateToInput(slotInfo.start)
    // In month view, slotInfo.end is often midnight of next day
    let endStr = formatDateToInput(slotInfo.end)
    if (endStr <= startStr) {
      const nextDay = new Date(slotInfo.start)
      nextDay.setDate(nextDay.getDate() + 1)
      endStr = formatDateToInput(nextDay)
    }

    setSelectedBooking(null)
    setSelectedDates({ check_in: startStr, check_out: endStr })
    setIsModalOpen(true)
  }

  // Open fresh modal
  const handleOpenCreateModal = () => {
    setSelectedBooking(null)
    setSelectedDates(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 shadow-ios-sm">
            <CalendarIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Reservations Calendar
            </h1>
            <p className="text-xs text-slate-400 font-normal">
              Interactive timeline of room occupancies and multi-channel bookings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh bookings"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3 text-xs font-medium text-slate-700 dark:text-zinc-300 shadow-ios-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#0071e3] px-3.5 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(0,113,227,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.25)] hover:bg-[#0077ed] active:bg-[#0062c4] active:scale-[0.98] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Database Empty Banner / Quick Seeder */}
      {rooms.length === 0 && !isLoading && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 sm:flex-row sm:items-center shadow-ios-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <BedDouble className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">No hotel rooms configured yet</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                To start booking reservations, initialize sample rooms or create them in Settings.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={createDefaultRoomsMutation.isPending}
            onClick={() => createDefaultRoomsMutation.mutate()}
            className="flex h-7 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-medium text-white shadow-ios-sm hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {createDefaultRoomsMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Initialize Sample Rooms
          </button>
        </div>
      )}

      {/* Filters & Source Color Legend */}
      <div className="flex flex-col gap-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3 shadow-ios-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Source Legend & Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1">Source:</span>
          <button
            type="button"
            onClick={() => setSelectedSource("all")}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-all select-none ${
              selectedSource === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-ios-sm font-semibold"
                : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 hover:bg-black/[0.06]"
            }`}
          >
            All ({bookings.length})
          </button>

          {Object.entries(BOOKING_SOURCES).map(([key, meta]) => {
            const isSelected = selectedSource === key
            const count = bookings.filter((b) => b.source === key).length
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedSource(isSelected ? "all" : key)}
                className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-all select-none border ${
                  isSelected
                    ? "ring-2 ring-slate-900 dark:ring-white ring-offset-1 font-semibold"
                    : "border-black/[0.04] hover:opacity-90"
                }`}
                style={{
                  backgroundColor: isSelected ? meta.hex : `${meta.hex}14`,
                  color: isSelected ? "#ffffff" : meta.hex,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? "#ffffff" : meta.hex }}
                />
                <span>{meta.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Room Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Room:</span>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="h-8 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/60 px-2.5 text-xs font-medium text-slate-700 dark:text-zinc-300 shadow-ios-sm focus:bg-white dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:border-[#0071e3] transition-all"
          >
            <option value="all">All Rooms ({rooms.length})</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 shadow-ios-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Failed to load reservations</p>
            <p className="text-[11px] text-rose-600">
              {(error as Error)?.message || "Please check your network and Supabase connection."}
            </p>
          </div>
        </div>
      )}

      {/* Calendar Area */}
      <div className="relative overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 shadow-ios-card">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium text-slate-500">Loading reservations...</p>
            </div>
          </div>
        )}

        <Calendar<CalendarBookingEvent>
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={currentView}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          onView={(newView) => setCurrentView(newView)}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventPropGetter}
          popup
          style={{ height: 720 }}
        />
      </div>

      {/* Create / Edit Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBooking(null)
          setSelectedDates(null)
        }}
        initialBooking={selectedBooking}
        initialDates={selectedDates}
      />
    </div>
  )
}

function formatDateToInput(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
