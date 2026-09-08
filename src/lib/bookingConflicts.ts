import type { BookingWithDetails } from "@/types/booking"

export interface BookingConflict {
  hasConflict: boolean
  roomName?: string
  conflictingBooking?: BookingWithDetails
  message?: string
}

/**
 * Checks if a room has any overlapping bookings for the given check-in and check-out dates.
 * In hotels, checkout date is morning and checkin date is afternoon, so:
 * intervals [checkIn, checkOut) and [b.check_in, b.check_out) overlap if:
 * b.check_in < checkOut && b.check_out > checkIn
 */
export function getRoomConflict(
  roomId: string,
  checkIn: string,
  checkOut: string,
  bookings: BookingWithDetails[],
  excludeBookingId?: string | null
): BookingConflict {
  if (!roomId || !checkIn || !checkOut || checkOut <= checkIn) {
    return { hasConflict: false }
  }

  const conflict = bookings.find((b) => {
    // Ignore cancelled bookings
    if (b.status === "cancelled") return false
    // Ignore the booking being edited
    if (excludeBookingId && b.id === excludeBookingId) return false
    if (b.room_id !== roomId) return false

    return b.check_in < checkOut && b.check_out > checkIn
  })

  if (conflict) {
    const roomName = conflict.room?.name || "Room"
    const guestName = conflict.guest?.name || "another guest"
    return {
      hasConflict: true,
      roomName,
      conflictingBooking: conflict,
      message: `${roomName} is already booked from ${conflict.check_in} to ${conflict.check_out} (Guest: ${guestName})`,
    }
  }

  return { hasConflict: false }
}

/**
 * Returns an array of room IDs that are unavailable for the given dates.
 */
export function getUnavailableRoomIds(
  roomIds: string[],
  checkIn: string,
  checkOut: string,
  bookings: BookingWithDetails[],
  excludeBookingId?: string | null
): string[] {
  if (!checkIn || !checkOut || checkOut <= checkIn) return []

  return roomIds.filter((roomId) => {
    const conflict = getRoomConflict(roomId, checkIn, checkOut, bookings, excludeBookingId)
    return conflict.hasConflict
  })
}
