import { useState, useMemo } from "react"
import {
  useBookings,
  useRooms,
  useUpdateBooking,
  useDeleteBooking,
} from "@/hooks/useBookingsData"
import { BookingModal } from "@/components/bookings/BookingModal"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { BOOKING_SOURCES, BOOKING_STATUSES } from "@/constants/booking"
import type { BookingWithDetails, BookingSource } from "@/types/booking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  CalendarCheck,
  Plus,
  Search,
  RefreshCw,
  BedDouble,
  User,
  Edit,
  Trash2,
  CheckCircle2,
  LogOut as LogOutIcon,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react"

export function BookingsPage() {
  const { data: bookings = [], isLoading, isError, error, refetch } = useBookings()
  const { data: rooms = [] } = useRooms()
  const { formatPrice } = useHotelSettings()
  const updateBookingMutation = useUpdateBooking()
  const deleteBookingMutation = useDeleteBooking()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSource, setSelectedSource] = useState("all")
  const [selectedRoomId, setSelectedRoomId] = useState("all")

  // Inline Delete State & Action Error Banner State
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Quick stats calculation
  const stats = useMemo(() => {
    const total = bookings.length
    const confirmed = bookings.filter((b) => b.status === "confirmed").length
    const checkedIn = bookings.filter((b) => b.status === "checked_in").length
    const cancelled = bookings.filter((b) => b.status === "cancelled").length
    return { total, confirmed, checkedIn, cancelled }
  }, [bookings])

  // Filtered bookings list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const guestName = b.guest?.name?.toLowerCase() || ""
        const guestEmail = b.guest?.email?.toLowerCase() || ""
        const roomName = b.room?.name?.toLowerCase() || ""
        const notes = b.notes?.toLowerCase() || ""
        const icalUid = b.ical_uid?.toLowerCase() || ""

        const matches =
          guestName.includes(query) ||
          guestEmail.includes(query) ||
          roomName.includes(query) ||
          notes.includes(query) ||
          icalUid.includes(query)

        if (!matches) return false
      }

      // 2. Status
      if (selectedStatus !== "all" && b.status !== selectedStatus) {
        return false
      }

      // 3. Source
      if (selectedSource !== "all" && b.source !== selectedSource) {
        return false
      }

      // 4. Room
      if (selectedRoomId !== "all" && b.room_id !== selectedRoomId) {
        return false
      }

      return true
    })
  }, [bookings, searchQuery, selectedStatus, selectedSource, selectedRoomId])

  const handleEdit = (booking: BookingWithDetails) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedBooking(null)
    setIsModalOpen(true)
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setActionError(null)
    try {
      await updateBookingMutation.mutateAsync({
        id: bookingId,
        updates: { status: newStatus },
      })
    } catch (err) {
      console.error("Status update error:", err)
      setActionError((err as Error).message || "Failed to update reservation status.")
    }
  }

  const handleConfirmDelete = async (bookingId: string) => {
    setActionError(null)
    try {
      await deleteBookingMutation.mutateAsync(bookingId)
      setConfirmingDeleteId(null)
    } catch (err) {
      console.error("Delete booking error:", err)
      setActionError((err as Error).message || "Failed to delete reservation.")
    }
  }

  function calculateNights(checkIn: string, checkOut: string): number {
    const d1 = new Date(checkIn)
    const d2 = new Date(checkOut)
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays || 1
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-start justify-between gap-2 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 p-4 text-xs font-semibold text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-ios-sm">
            <CalendarCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Reservations & Bookings
            </h1>
            <p className="text-xs text-slate-400 font-normal">
              Manage all guest reservations, channel bookings, and guest arrivals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Booking</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3.5 shadow-ios-card transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3.5 shadow-ios-card transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Confirmed
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.confirmed}</p>
        </div>

        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3.5 shadow-ios-card transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Checked In
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-primary">{stats.checkedIn}</p>
        </div>

        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3.5 shadow-ios-card transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Cancelled
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-rose-600">{stats.cancelled}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900/90 p-3 shadow-ios-sm">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, room, notes, or UID..."
              className="pl-8 h-8 text-xs bg-slate-50/80 dark:bg-zinc-800/60"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <span className="text-xs font-medium text-slate-400 shrink-0">Status:</span>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8 w-36">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {BOOKING_STATUSES.map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <span className="text-xs font-medium text-slate-400 shrink-0">Source:</span>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="h-8 w-36">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {Object.entries(BOOKING_SOURCES).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Filter */}
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <span className="text-xs font-medium text-slate-400 shrink-0">Room:</span>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="overflow-hidden dark:bg-zinc-900/90 dark:border-white/[0.08]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-xs text-slate-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading reservations...</span>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-xs text-rose-600">
              Failed to load reservations: {(error as Error).message}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <CalendarCheck className="mx-auto mb-2.5 h-8 w-8 text-slate-300 dark:text-zinc-600" />
              <p className="font-semibold text-slate-800 dark:text-zinc-200 text-sm">No bookings found</p>
              <p className="mt-1 text-slate-400">
                {searchQuery || selectedStatus !== "all" || selectedSource !== "all"
                  ? "Try clearing your filters or search keywords."
                  : "Click '+ New Booking' to create your first reservation."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-white/[0.08] dark:bg-zinc-800/60">
                    <TableHead className="dark:text-zinc-300">Guest</TableHead>
                    <TableHead className="dark:text-zinc-300">Room</TableHead>
                    <TableHead className="dark:text-zinc-300">Stay Dates</TableHead>
                    <TableHead className="dark:text-zinc-300">Nights</TableHead>
                    <TableHead className="dark:text-zinc-300">Source</TableHead>
                    <TableHead className="dark:text-zinc-300">Status</TableHead>
                    <TableHead className="dark:text-zinc-300">Price</TableHead>
                    <TableHead className="text-right dark:text-zinc-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const sourceMeta =
                      BOOKING_SOURCES[booking.source as BookingSource] || BOOKING_SOURCES.direct
                    const nights = calculateNights(booking.check_in, booking.check_out)

                    return (
                      <TableRow key={booking.id} className="dark:border-white/[0.08]">
                        {/* Guest */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                              {booking.guest?.name ? booking.guest.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-zinc-100 text-xs tracking-tight">
                                {booking.guest?.name || "Unknown Guest"}
                              </p>
                              <p className="text-xs text-slate-400 font-normal">
                                {[booking.guest?.phone, booking.guest?.email]
                                  .filter(Boolean)
                                  .join(" • ") || "No contact info"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Room */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-zinc-200">
                            <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                            <span>{booking.room?.name || "Unassigned"}</span>
                          </div>
                        </TableCell>

                        {/* Stay Dates */}
                        <TableCell>
                          <div className="text-xs font-medium text-slate-800 dark:text-zinc-200 font-mono">
                            <span>{booking.check_in}</span>
                            <span className="mx-1 text-slate-300 dark:text-zinc-600">→</span>
                            <span>{booking.check_out}</span>
                          </div>
                        </TableCell>

                        {/* Nights */}
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-mono dark:bg-zinc-800 dark:text-zinc-300">
                            {nights} {nights === 1 ? "night" : "nights"}
                          </Badge>
                        </TableCell>

                        {/* Source */}
                        <TableCell>
                          <Badge
                            className={`text-xs border font-medium ${sourceMeta.badgeClass}`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full mr-1.5"
                              style={{ backgroundColor: sourceMeta.hex }}
                            />
                            {sourceMeta.label}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "success"
                                : booking.status === "checked_in"
                                ? "default"
                                : booking.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                            className="capitalize text-xs"
                          >
                            {booking.status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        {/* Total Price & Extras */}
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                            {formatPrice(booking.total_price)}
                          </div>
                          {Number(booking.extra_charges || 0) > 0 && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                              +{formatPrice(booking.extra_charges)} extras
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 sm:gap-1.5">
                            {confirmingDeleteId === booking.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  title="Confirm Delete"
                                  aria-label="Confirm reservation deletion"
                                  onClick={() => handleConfirmDelete(booking.id)}
                                  className="h-11 px-3.5 sm:h-8 sm:px-2.5 text-xs gap-1"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Confirm</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Cancel"
                                  aria-label="Cancel deletion"
                                  onClick={() => setConfirmingDeleteId(null)}
                                  className="h-11 px-3 sm:h-8 sm:px-2 text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                {/* Quick Status Toggles */}
                                {booking.status === "confirmed" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Check In Guest"
                                    aria-label="Check in guest"
                                    onClick={() => handleStatusChange(booking.id, "checked_in")}
                                    className="h-11 px-3 sm:h-8 sm:px-2.5 text-xs gap-1 text-primary hover:bg-primary/10"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Check In</span>
                                  </Button>
                                )}

                                {booking.status === "checked_in" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Check Out Guest"
                                    aria-label="Check out guest"
                                    onClick={() => handleStatusChange(booking.id, "checked_out")}
                                    className="h-11 px-3 sm:h-8 sm:px-2.5 text-xs gap-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                                  >
                                    <LogOutIcon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Check Out</span>
                                  </Button>
                                )}

                                {/* Edit Action */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Edit Details"
                                  aria-label="Edit reservation"
                                  onClick={() => handleEdit(booking)}
                                  className="h-11 w-11 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>

                                {/* Delete Action */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete Booking"
                                  aria-label="Delete reservation"
                                  onClick={() => setConfirmingDeleteId(booking.id)}
                                  className="h-11 w-11 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBooking(null)
        }}
        initialBooking={selectedBooking}
      />
    </div>
  )
}

