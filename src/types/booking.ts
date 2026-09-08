import type { Database } from "@/types/database.types"

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"]
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"]
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"]

export type GuestRow = Database["public"]["Tables"]["guests"]["Row"]
export type GuestInsert = Database["public"]["Tables"]["guests"]["Insert"]

export type RoomRow = Database["public"]["Tables"]["rooms"]["Row"]
export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"]

export type BookingSource = Database["public"]["Enums"]["booking_source"]

export interface BookingWithDetails extends BookingRow {
  guest?: GuestRow | null
  room?: RoomRow | null
}
