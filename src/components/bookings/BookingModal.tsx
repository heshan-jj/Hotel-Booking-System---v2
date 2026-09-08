import React, { useState, useEffect, useMemo } from "react"
import {
  useRooms,
  useBookings,
  useCreateBooking,
  useCreateMultipleBookings,
  useUpdateBooking,
  useDeleteBooking,
  useCreateDefaultRoom,
} from "@/hooks/useBookingsData"
import { GuestSelector } from "./GuestSelector"
import { BOOKING_SOURCES, BOOKING_STATUSES } from "@/constants/booking"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { getRoomConflict, getUnavailableRoomIds } from "@/lib/bookingConflicts"
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
  DollarSign,
  Utensils,
  RotateCcw,
  Check,
  Ban,
} from "lucide-react"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  initialBooking?: BookingWithDetails | null
  initialDates?: { check_in: string; check_out: string } | null
  initialGuest?: GuestRow | null
}

export function BookingModal({
  isOpen,
  onClose,
  initialBooking,
  initialDates,
  initialGuest,
}: BookingModalProps) {
  const isEditing = Boolean(initialBooking)

  const { data: rooms = [], isLoading: isLoadingRooms } = useRooms()
  const { data: allBookings = [] } = useBookings()
  const { currencySymbol, formatPrice } = useHotelSettings()
  const createBookingMutation = useCreateBooking()
  const createMultipleBookingsMutation = useCreateMultipleBookings()
  const updateBookingMutation = useUpdateBooking()
  const deleteBookingMutation = useDeleteBooking()
  const createDefaultRoomsMutation = useCreateDefaultRoom()

  // Form State
  const [selectedGuest, setSelectedGuest] = useState<GuestRow | null>(null)
  const [guestId, setGuestId] = useState<string>("")
  const [singleRoomId, setSingleRoomId] = useState<string>("")
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [checkIn, setCheckIn] = useState<string>("")
  const [checkOut, setCheckOut] = useState<string>("")
  const [source, setSource] = useState<BookingSource>("direct")
  const [status, setStatus] = useState<string>("confirmed")
  const [notes, setNotes] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  // Pricing State
  const [extraCharges, setExtraCharges] = useState<number>(0)
  const [finalPrice, setFinalPrice] = useState<number>(0)
  const [isManualPriceOverridden, setIsManualPriceOverridden] = useState<boolean>(false)

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1
    const d1 = new Date(checkIn)
    const d2 = new Date(checkOut)
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 1
  }, [checkIn, checkOut])

  // Conflict detection: Get IDs of rooms that are already booked for the selected dates
  const unavailableRoomIds = useMemo(() => {
    return getUnavailableRoomIds(
      rooms.map((r) => r.id),
      checkIn,
      checkOut,
      allBookings,
      initialBooking?.id
    )
  }, [rooms, checkIn, checkOut, allBookings, initialBooking?.id])

  // Calculate base room price
  const calculatedBaseRoomPrice = useMemo(() => {
    if (isEditing) {
      const room = rooms.find((r) => r.id === singleRoomId)
      return (room?.base_rate || 0) * nights
    }
    const chosenRooms = rooms.filter((r) => selectedRoomIds.includes(r.id))
    const totalRatePerNight = chosenRooms.reduce((sum, r) => sum + (r.base_rate || 0), 0)
    return totalRatePerNight * nights
  }, [isEditing, singleRoomId, rooms, nights, selectedRoomIds])

  // Total calculated price = base rooms + extra charges
  const calculatedTotalPrice = useMemo(() => {
    return Number((calculatedBaseRoomPrice + (Number(extraCharges) || 0)).toFixed(2))
  }, [calculatedBaseRoomPrice, extraCharges])

  // Sync final price if not manually overridden
  useEffect(() => {
    if (!isManualPriceOverridden) {
      setFinalPrice(calculatedTotalPrice)
    }
  }, [calculatedTotalPrice, isManualPriceOverridden])

  // Populate form on open
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null)
      setIsConfirmingDelete(false)
      setIsManualPriceOverridden(false)
      return
    }

    if (initialBooking) {
      setGuestId(initialBooking.guest_id)
      setSelectedGuest(initialBooking.guest || null)
      setSingleRoomId(initialBooking.room_id)
      setSelectedRoomIds([initialBooking.room_id])
      setCheckIn(initialBooking.check_in)
      setCheckOut(initialBooking.check_out)
      setSource(initialBooking.source)
      setStatus(initialBooking.status)
      setNotes(initialBooking.notes || "")
      const extra = initialBooking.extra_charges || 0
      const total = initialBooking.total_price || 0
      setExtraCharges(extra)
      setFinalPrice(total)
      setIsManualPriceOverridden(total > 0)
    } else {
      if (initialGuest) {
        setSelectedGuest(initialGuest)
        setGuestId(initialGuest.id)
      } else {
        setSelectedGuest(null)
        setGuestId("")
      }
      const initialIn = initialDates?.check_in || getTodayString()
      const initialOut = initialDates?.check_out || getTomorrowString()
      setCheckIn(initialIn)
      setCheckOut(initialOut)

      // Find first room that isn't booked for default dates
      const unavail = getUnavailableRoomIds(
        rooms.map((r) => r.id),
        initialIn,
        initialOut,
        allBookings
      )
      const firstAvailableRoom = rooms.find((r) => !unavail.includes(r.id)) || rooms[0]
      const defaultRoomId = firstAvailableRoom?.id || ""

      setSingleRoomId(defaultRoomId)
      setSelectedRoomIds(defaultRoomId ? [defaultRoomId] : [])
      setSource("direct")
      setStatus("confirmed")
      setNotes("")
      setExtraCharges(0)
      setIsManualPriceOverridden(false)
    }
  }, [isOpen, initialBooking, initialDates, initialGuest, rooms, allBookings])

  if (!isOpen) return null

  const isSaving =
    createBookingMutation.isPending ||
    createMultipleBookingsMutation.isPending ||
    updateBookingMutation.isPending
  const isDeleting = deleteBookingMutation.isPending

  const handleGuestSelect = (guest: GuestRow | null) => {
    setSelectedGuest(guest)
    setGuestId(guest?.id || "")
  }

  const toggleRoomSelection = (roomId: string) => {
    if (unavailableRoomIds.includes(roomId)) {
      const conflict = getRoomConflict(roomId, checkIn, checkOut, allBookings, initialBooking?.id)
      setErrorMessage(
        `Room unavailable: ${conflict.message || "already booked for the selected dates."}`
      )
      return
    }

    setErrorMessage(null)
    if (selectedRoomIds.includes(roomId)) {
      if (selectedRoomIds.length > 1) {
        setSelectedRoomIds(selectedRoomIds.filter((id) => id !== roomId))
      }
    } else {
      setSelectedRoomIds([...selectedRoomIds, roomId])
    }
  }

  const handleResetPrice = () => {
    setIsManualPriceOverridden(false)
    setFinalPrice(calculatedTotalPrice)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!guestId) {
      setErrorMessage("Please select or create a guest.")
      return
    }

    if (isEditing && !singleRoomId) {
      setErrorMessage("Please select a room.")
      return
    }

    if (!isEditing && selectedRoomIds.length === 0) {
      setErrorMessage("Please select at least one room.")
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

    // Comprehensive Room Conflict Validation
    const targetRoomIds = isEditing ? [singleRoomId] : selectedRoomIds
    for (const rId of targetRoomIds) {
      const conflict = getRoomConflict(rId, checkIn, checkOut, allBookings, initialBooking?.id)
      if (conflict.hasConflict) {
        setErrorMessage(
          `Booking Conflict: ${conflict.message}. Please select available dates or an unreserved room.`
        )
        return
      }
    }

    try {
      if (isEditing && initialBooking) {
        await updateBookingMutation.mutateAsync({
          id: initialBooking.id,
          updates: {
            guest_id: guestId,
            room_id: singleRoomId,
            check_in: checkIn,
            check_out: checkOut,
            source,
            status,
            notes: notes.trim() || null,
            extra_charges: Number(extraCharges) || 0,
            total_price: Number(finalPrice) || 0,
          },
        })
      } else {
        if (selectedRoomIds.length === 1) {
          await createBookingMutation.mutateAsync({
            guest_id: guestId,
            room_id: selectedRoomIds[0],
            check_in: checkIn,
            check_out: checkOut,
            source,
            status,
            notes: notes.trim() || null,
            extra_charges: Number(extraCharges) || 0,
            total_price: Number(finalPrice) || 0,
          })
        } else {
          // Multiple rooms booked under one guest
          const totalExtra = Number(extraCharges) || 0
          const extraPerRoom = Number((totalExtra / selectedRoomIds.length).toFixed(2))
          const totalRoomsBase = rooms
            .filter((r) => selectedRoomIds.includes(r.id))
            .reduce((sum, r) => sum + (r.base_rate || 0) * nights, 0)

          const newBookings = selectedRoomIds.map((rId) => {
            const r = rooms.find((rm) => rm.id === rId)
            const rBase = (r?.base_rate || 0) * nights
            let rTotalPrice: number
            if (isManualPriceOverridden && totalRoomsBase > 0) {
              const proportion = rBase / totalRoomsBase
              rTotalPrice = Number((Number(finalPrice) * proportion).toFixed(2))
            } else {
              rTotalPrice = Number((rBase + extraPerRoom).toFixed(2))
            }

            return {
              guest_id: guestId,
              room_id: rId,
              check_in: checkIn,
              check_out: checkOut,
              source,
              status,
              notes: notes.trim() ? `${notes.trim()} (Multi-room booking)` : "Multi-room booking",
              extra_charges: extraPerRoom,
              total_price: rTotalPrice,
            }
          })

          await createMultipleBookingsMutation.mutateAsync(newBookings)
        }
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
        setSingleRoomId(created[0].id)
        setSelectedRoomIds([created[0].id])
      }
    } catch (err) {
      console.error("Create rooms error:", err)
      setErrorMessage("Failed to create default rooms: " + (err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-xl rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-zinc-900 shadow-2xl transition-all max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06] px-6 py-3.5 shrink-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md select-none">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
              {isEditing ? "Edit Reservation" : "Create New Booking"}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">
              {isEditing
                ? "Update reservation details, pricing, or status"
                : "Reserve room(s) with live conflict prevention and price customization"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 transition-colors active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-800 shrink-0 shadow-ios-sm">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 px-6 py-4 overflow-y-auto flex-1">
          {/* 1. Guest Selector (autocomplete + inline create) */}
          <GuestSelector
            selectedGuestId={guestId}
            onSelectGuest={handleGuestSelect}
            selectedGuest={selectedGuest}
          />

          {/* 2. Check-in and Check-out dates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Calendar className="h-3 w-3 text-slate-400" />
                Check-in Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value)
                  setErrorMessage(null)
                }}
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/60 px-3 py-1.5 text-xs text-foreground tracking-tight shadow-ios-sm focus:bg-white dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:border-[#0071e3] focus-visible:ring-2 focus-visible:ring-[#0071e3]/15 transition-all"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Calendar className="h-3 w-3 text-slate-400" />
                Check-out Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={checkOut}
                min={checkIn}
                onChange={(e) => {
                  setCheckOut(e.target.value)
                  setErrorMessage(null)
                }}
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/60 px-3 py-1.5 text-xs text-foreground tracking-tight shadow-ios-sm focus:bg-white dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:border-[#0071e3] focus-visible:ring-2 focus-visible:ring-[#0071e3]/15 transition-all"
              />
            </div>
          </div>

          {/* 3. Room Selection with Live Conflict Prevention */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <BedDouble className="h-3 w-3 text-slate-400" />
                {isEditing ? "Assigned Room" : "Select Room(s) for this Stay"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {!isEditing && selectedRoomIds.length > 1 && (
                  <span className="text-[10px] font-medium text-[#0071e3] bg-[#0071e3]/10 border border-[#0071e3]/20 px-2 py-0.5 rounded-md">
                    {selectedRoomIds.length} rooms selected
                  </span>
                )}
                {unavailableRoomIds.length > 0 && (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    {unavailableRoomIds.length} booked for dates
                  </span>
                )}
              </div>
            </div>

            {isLoadingRooms ? (
              <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-slate-50/80 p-2.5 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0071e3]" />
                <span>Loading property rooms...</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 text-xs text-amber-800">
                <span>No rooms available in the property.</span>
                <button
                  type="button"
                  disabled={createDefaultRoomsMutation.isPending}
                  onClick={handleCreateDefaultRooms}
                  className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-ios-sm hover:bg-amber-500 disabled:opacity-50"
                >
                  {createDefaultRoomsMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <PlusCircle className="h-3 w-3" />
                  )}
                  Create Sample Rooms
                </button>
              </div>
            ) : isEditing ? (
              <select
                required
                value={singleRoomId}
                onChange={(e) => {
                  setSingleRoomId(e.target.value)
                  setErrorMessage(null)
                }}
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/60 px-3 py-1.5 text-xs text-foreground tracking-tight shadow-ios-sm focus:bg-white dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:border-[#0071e3] focus-visible:ring-2 focus-visible:ring-[#0071e3]/15 transition-all"
              >
                {rooms.map((room) => {
                  const isUnavailable = unavailableRoomIds.includes(room.id)
                  return (
                    <option
                      key={room.id}
                      value={room.id}
                      disabled={isUnavailable}
                      className={isUnavailable ? "text-slate-400 bg-slate-100 italic" : ""}
                    >
                      {room.name} (Cap: {room.capacity}, {currencySymbol}{room.base_rate}/night)
                      {isUnavailable ? " — [UNAVAILABLE: Already Booked]" : ""}
                    </option>
                  )
                })}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-black/[0.06] dark:border-white/[0.08] rounded-xl p-2 bg-slate-50/40 dark:bg-zinc-800/30 max-h-48 overflow-y-auto">
                {rooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.id)
                  const isUnavailable = unavailableRoomIds.includes(room.id)
                  const conflict = isUnavailable
                    ? getRoomConflict(room.id, checkIn, checkOut, allBookings, initialBooking?.id)
                    : null

                  return (
                    <div
                      key={room.id}
                      onClick={() => toggleRoomSelection(room.id)}
                      title={conflict?.message || ""}
                      className={`relative flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all duration-150 select-none ${
                        isUnavailable
                          ? "bg-slate-100/70 dark:bg-zinc-800/50 text-slate-400 border-black/[0.04] dark:border-white/[0.04] cursor-not-allowed opacity-60"
                          : isSelected
                          ? "cursor-pointer border-2 border-[#0071e3] bg-[#0071e3]/[0.06] text-slate-900 dark:text-zinc-100 shadow-ios-sm"
                          : "cursor-pointer bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.15] hover:bg-slate-50/80 active:scale-[0.98]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-colors ${
                            isUnavailable
                              ? "border border-rose-300 bg-rose-50 text-rose-500"
                              : isSelected
                              ? "bg-[#0071e3] text-white"
                              : "border border-black/[0.2] dark:border-white/[0.2] bg-transparent"
                          }`}
                        >
                          {isUnavailable ? (
                            <Ban className="h-2.5 w-2.5" />
                          ) : isSelected ? (
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          ) : null}
                        </div>
                        <div>
                          <span
                            className={`font-medium tracking-tight ${
                              isUnavailable ? "line-through text-slate-400" : ""
                            }`}
                          >
                            {room.name}
                          </span>
                          {isUnavailable && (
                            <span className="block text-[9px] text-rose-500 font-normal">
                              Booked for dates
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                        isSelected
                          ? "bg-[#0071e3]/10 text-[#0071e3]"
                          : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400"
                      }`}>
                        {currencySymbol}{room.base_rate}/nt
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 4. Pricing and Extras */}
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-800/40 p-3 space-y-2.5 shadow-ios-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-emerald-600" />
                Price Calculation & Extras
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {nights} {nights === 1 ? "night" : "nights"} stay
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Extra charges */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  <Utensils className="h-3 w-3 text-amber-500" />
                  Food & Beverage / Extras ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraCharges === 0 ? "" : extraCharges}
                  placeholder="0.00"
                  onChange={(e) => setExtraCharges(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-foreground tracking-tight shadow-ios-sm focus-visible:outline-none focus-visible:border-[#0071e3] focus-visible:ring-2 focus-visible:ring-[#0071e3]/15"
                />
              </div>

              {/* Final Total Price */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                    Final Price ({currencySymbol})
                    {isManualPriceOverridden && (
                      <span className="text-[9px] text-amber-600 font-medium bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                        Custom
                      </span>
                    )}
                  </label>
                  {isManualPriceOverridden && (
                    <button
                      type="button"
                      onClick={handleResetPrice}
                      className="text-[10px] text-[#0071e3] hover:underline flex items-center gap-0.5"
                    >
                      <RotateCcw className="h-2.5 w-2.5" /> Reset
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={finalPrice === 0 ? "" : finalPrice}
                  placeholder={calculatedTotalPrice.toString()}
                  onChange={(e) => {
                    setIsManualPriceOverridden(true)
                    setFinalPrice(parseFloat(e.target.value) || 0)
                  }}
                  className={`w-full rounded-lg border px-3 py-1 text-xs font-semibold shadow-ios-sm focus-visible:outline-none ${
                    isManualPriceOverridden
                      ? "border-amber-400/80 bg-amber-50/40 text-amber-900 focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20"
                      : "border-black/[0.09] dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-foreground focus-visible:border-[#0071e3] focus-visible:ring-2 focus-visible:ring-[#0071e3]/15"
                  }`}
                />
              </div>
            </div>

            {/* Pricing breakdown summary */}
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.06] pt-2">
              <span>
                Base room rate: <strong className="text-slate-800 dark:text-zinc-200">{formatPrice(calculatedBaseRoomPrice)}</strong>
                {extraCharges > 0 && (
                  <>
                    {" "}
                    + Extras: <strong className="text-slate-800 dark:text-zinc-200">{formatPrice(extraCharges)}</strong>
                  </>
                )}
              </span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                Final Total: <span className="text-[#0071e3]">{formatPrice(finalPrice)}</span>
              </span>
            </div>
          </div>

          {/* 5. Source & Status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Tag className="h-3 w-3 text-slate-400" />
                Booking Source <span className="text-rose-500">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as BookingSource)}
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/60 px-3 py-1.5 text-xs text-foreground tracking-tight shadow-ios-sm focus:bg-white dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:border-[#0071e3] focus-visible:ring-2 focus-visible:ring-[#0071e3]/15 transition-all"
              >
                {Object.entries(BOOKING_SOURCES).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Clock className="h-3 w-3 text-slate-400" />
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/60 px-3 py-1.5 text-xs text-foreground tracking-tight shadow-ios-sm focus:bg-white dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:border-[#0071e3] focus-visible:ring-2 focus-visible:ring-[#0071e3]/15 transition-all"
              >
                {BOOKING_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Notes */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <FileText className="h-3 w-3 text-slate-400" />
              Reservation Notes & Special Requests
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Food & beverage preferences, late checkout, payment notes..."
              className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/60 px-3 py-1.5 text-xs text-foreground placeholder-slate-400 tracking-tight shadow-ios-sm focus:bg-white dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:border-[#0071e3] focus-visible:ring-2 focus-visible:ring-[#0071e3]/15 transition-all"
            />
          </div>

          {/* iCal UID indicator if syncing */}
          {initialBooking?.ical_uid && (
            <div className="rounded-lg border border-black/[0.06] bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">iCal UID: </span>
              <span className="font-mono">{initialBooking.ical_uid}</span>
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.06] pt-3">
            <div>
              {isEditing &&
                (isConfirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="h-8 rounded-lg bg-rose-500 px-3 text-xs font-semibold text-white shadow-ios-sm hover:bg-rose-600 active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="text-xs text-slate-400 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors active:scale-[0.98]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8.5 rounded-lg border border-black/[0.1] dark:border-white/[0.12] bg-white/90 dark:bg-zinc-800/90 px-4 text-xs font-medium text-slate-700 dark:text-zinc-300 shadow-ios-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || rooms.length === 0}
                className="flex h-8.5 items-center gap-1.5 rounded-lg bg-[#0071e3] px-5 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(0,113,227,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.25)] hover:bg-[#0077ed] active:bg-[#0062c4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {isEditing
                    ? "Save Changes"
                    : selectedRoomIds.length > 1
                      ? `Book ${selectedRoomIds.length} Rooms`
                      : "Confirm Reservation"}
                </span>
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
