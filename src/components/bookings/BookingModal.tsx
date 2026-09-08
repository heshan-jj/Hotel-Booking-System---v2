import React, { useState, useEffect } from "react"
import {
  useRooms,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useCreateDefaultRoom,
} from "@/hooks/useBookingsData"
import { GuestSelector } from "./GuestSelector"
import { BOOKING_SOURCES, BOOKING_STATUSES } from "@/constants/booking"
import type { BookingWithDetails, BookingSource, GuestRow } from "@/types/booking"
import {
  X,
  Calendar,
  BedDouble,
  Tag,
  Clock,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  PlusCircle,
} from "lucide-react"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  initialBooking?: BookingWithDetails | null
  initialDates?: { check_in: string; check_out: string } | null
}

export function BookingModal({
  isOpen,
  onClose,
  initialBooking,
  initialDates,
}: BookingModalProps) {
  const isEditing = Boolean(initialBooking)

  const { data: rooms = [], isLoading: isLoadingRooms } = useRooms()
  const createBookingMutation = useCreateBooking()
  const updateBookingMutation = useUpdateBooking()
  const deleteBookingMutation = useDeleteBooking()
  const createDefaultRoomsMutation = useCreateDefaultRoom()

  // Form State
  const [selectedGuest, setSelectedGuest] = useState<GuestRow | null>(null)
  const [guestId, setGuestId] = useState<string>("")
  const [roomId, setRoomId] = useState<string>("")
  const [checkIn, setCheckIn] = useState<string>("")
  const [checkOut, setCheckOut] = useState<string>("")
  const [source, setSource] = useState<BookingSource>("direct")
  const [status, setStatus] = useState<string>("confirmed")
  const [notes, setNotes] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  // Populate form on open or initialBooking/initialDates change
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null)
      setIsConfirmingDelete(false)
      return
    }

    if (initialBooking) {
      setGuestId(initialBooking.guest_id)
      setSelectedGuest(initialBooking.guest || null)
      setRoomId(initialBooking.room_id)
      setCheckIn(initialBooking.check_in)
      setCheckOut(initialBooking.check_out)
      setSource(initialBooking.source)
      setStatus(initialBooking.status)
      setNotes(initialBooking.notes || "")
    } else {
      setGuestId("")
      setSelectedGuest(null)
      setRoomId(rooms[0]?.id || "")
      setCheckIn(initialDates?.check_in || getTodayString())
      setCheckOut(initialDates?.check_out || getTomorrowString())
      setSource("direct")
      setStatus("confirmed")
      setNotes("")
    }
  }, [isOpen, initialBooking, initialDates, rooms])

  // Select default room when rooms load
  useEffect(() => {
    if (!roomId && rooms.length > 0) {
      setRoomId(rooms[0].id)
    }
  }, [rooms, roomId])

  if (!isOpen) return null

  const isSaving = createBookingMutation.isPending || updateBookingMutation.isPending
  const isDeleting = deleteBookingMutation.isPending

  const handleGuestSelect = (guest: GuestRow | null) => {
    setSelectedGuest(guest)
    setGuestId(guest?.id || "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!guestId) {
      setErrorMessage("Please select or create a guest.")
      return
    }

    if (!roomId) {
      setErrorMessage("Please select a room.")
      return
    }

    if (!checkIn || !checkOut) {
      setErrorMessage("Check-in and check-out dates are required.")
      return
    }

    if (checkOut <= checkIn) {
      setErrorMessage("Check-out date must be strictly after check-in date.")
      return
    }

    try {
      if (isEditing && initialBooking) {
        await updateBookingMutation.mutateAsync({
          id: initialBooking.id,
          updates: {
            guest_id: guestId,
            room_id: roomId,
            check_in: checkIn,
            check_out: checkOut,
            source,
            status,
            notes: notes.trim() || null,
          },
        })
      } else {
        await createBookingMutation.mutateAsync({
          guest_id: guestId,
          room_id: roomId,
          check_in: checkIn,
          check_out: checkOut,
          source,
          status,
          notes: notes.trim() || null,
        })
      }

      onClose()
    } catch (err) {
      console.error("Booking mutation error:", err)
      setErrorMessage(
        (err as Error).message || "An unexpected error occurred while saving the booking."
      )
    }
  }

  const handleDelete = async () => {
    if (!initialBooking) return
    try {
      await deleteBookingMutation.mutateAsync(initialBooking.id)
      onClose()
    } catch (err) {
      console.error("Delete booking error:", err)
      setErrorMessage((err as Error).message || "Failed to delete booking.")
    }
  }

  const handleCreateDefaultRooms = async () => {
    try {
      const created = await createDefaultRoomsMutation.mutateAsync()
      if (created && created.length > 0) {
        setRoomId(created[0].id)
      }
    } catch (err) {
      console.error("Create rooms error:", err)
      setErrorMessage("Failed to create default rooms: " + (err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? "Edit Reservation" : "Create New Booking"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing
                ? "Update reservation details, dates, or status"
                : "Schedule a room reservation for a direct or channel guest"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Guest Selector (autocomplete + inline create) */}
          <GuestSelector
            selectedGuestId={guestId}
            onSelectGuest={handleGuestSelect}
            selectedGuest={selectedGuest}
          />

          {/* Room Selector */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <BedDouble className="h-3.5 w-3.5 text-slate-400" />
              Room <span className="text-red-500">*</span>
            </label>
            {isLoadingRooms ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                <span>Loading property rooms...</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3 text-xs text-amber-800">
                <span>No rooms available in the property.</span>
                <button
                  type="button"
                  disabled={createDefaultRoomsMutation.isPending}
                  onClick={handleCreateDefaultRooms}
                  className="flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {createDefaultRoomsMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <PlusCircle className="h-3 w-3" />
                  )}
                  Create Sample Rooms
                </button>
              </div>
            ) : (
              <select
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (Cap: {room.capacity}, ${room.base_rate}/night)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Check-in and Check-out dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Check-in Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Check-out Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Source & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                Booking Source <span className="text-red-500">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as BookingSource)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {Object.entries(BOOKING_SOURCES).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {BOOKING_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Reservation Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests, arrival time, payment details..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* iCal UID indicator if syncing */}
          {initialBooking?.ical_uid && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">iCal UID: </span>
              <span className="font-mono text-[11px]">{initialBooking.ical_uid}</span>
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              {isEditing && (
                isConfirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-500 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || rooms.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isEditing ? "Save Changes" : "Confirm Reservation"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getTomorrowString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
