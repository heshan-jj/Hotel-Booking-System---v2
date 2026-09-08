import React, { useState, useEffect, useMemo } from "react"
import {
  useRooms,
  useCreateBooking,
  useCreateMultipleBookings,
  useUpdateBooking,
  useDeleteBooking,
  useCreateDefaultRoom,
} from "@/hooks/useBookingsData"
import { GuestSelector } from "./GuestSelector"
import { BOOKING_SOURCES, BOOKING_STATUSES } from "@/constants/booking"
import { useHotelSettings } from "@/hooks/useHotelSettings"
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
      const firstRoomId = rooms[0]?.id || ""
      setSingleRoomId(firstRoomId)
      setSelectedRoomIds(firstRoomId ? [firstRoomId] : [])
      setCheckIn(initialDates?.check_in || getTodayString())
      setCheckOut(initialDates?.check_out || getTomorrowString())
      setSource("direct")
      setStatus("confirmed")
      setNotes("")
      setExtraCharges(0)
      setIsManualPriceOverridden(false)
    }
  }, [isOpen, initialBooking, initialDates, initialGuest, rooms])

  // Default room selection when rooms load
  useEffect(() => {
    if (!singleRoomId && rooms.length > 0) {
      setSingleRoomId(rooms[0].id)
      if (selectedRoomIds.length === 0) {
        setSelectedRoomIds([rooms[0].id])
      }
    }
  }, [rooms, singleRoomId, selectedRoomIds])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? "Edit Reservation" : "Create New Booking"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing
                ? "Update reservation details, pricing, or status"
                : "Reserve one or multiple rooms for a guest with customized pricing"}
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
          <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 shrink-0">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4 overflow-y-auto flex-1">
          {/* Guest Selector (autocomplete + inline create) */}
          <GuestSelector
            selectedGuestId={guestId}
            onSelectGuest={handleGuestSelect}
            selectedGuest={selectedGuest}
          />

          {/* Room Selection */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                {isEditing ? "Assigned Room" : "Select Room(s) for this Guest"}{" "}
                <span className="text-red-500">*</span>
              </label>
              {!isEditing && selectedRoomIds.length > 1 && (
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {selectedRoomIds.length} rooms selected
                </span>
              )}
            </div>

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
            ) : isEditing ? (
              <select
                required
                value={singleRoomId}
                onChange={(e) => setSingleRoomId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (Cap: {room.capacity}, {currencySymbol}{room.base_rate}/night)
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 max-h-40 overflow-y-auto">
                {rooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.id)
                  return (
                    <div
                      key={room.id}
                      onClick={() => toggleRoomSelection(room.id)}
                      className={`cursor-pointer flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            isSelected
                              ? "bg-white text-primary border-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="font-semibold">{room.name}</span>
                      </div>
                      <span className="font-mono text-[11px] opacity-90">
                        {currencySymbol}{room.base_rate}/nt
                      </span>
                    </div>
                  )
                })}
              </div>
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Pricing and Manual Cost Alteration (Food, Beverage, Extras) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                Price Calculation & Extras
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {nights} {nights === 1 ? "night" : "nights"} stay
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Extra charges (Food, Beverage, Mini-bar) */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-600">
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-xs focus:border-primary focus:outline-none"
                />
              </div>

              {/* Manually Alter Final Total Price */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                    Final Price ({currencySymbol})
                    {isManualPriceOverridden && (
                      <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1 rounded">
                        Custom
                      </span>
                    )}
                  </label>
                  {isManualPriceOverridden && (
                    <button
                      type="button"
                      onClick={handleResetPrice}
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
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
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm font-semibold shadow-xs focus:outline-none ${
                    isManualPriceOverridden
                      ? "border-amber-400 bg-amber-50/40 text-amber-900 focus:border-amber-500"
                      : "border-slate-300 bg-white text-slate-900 focus:border-primary"
                  }`}
                />
              </div>
            </div>

            {/* Pricing breakdown summary */}
            <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span>
                Base room rate: <strong>{formatPrice(calculatedBaseRoomPrice)}</strong>
                {extraCharges > 0 && (
                  <>
                    {" "}
                    + Extras: <strong>{formatPrice(extraCharges)}</strong>
                  </>
                )}
              </span>
              <span className="font-semibold text-slate-900">
                Final Total: {formatPrice(finalPrice)}
              </span>
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              Reservation Notes & Special Requests
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Food & beverage preferences, late checkout, payment notes..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              {isEditing &&
                (isConfirmingDelete ? (
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
                ))}
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
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
