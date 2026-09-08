import type { BookingSource } from "@/types/booking"

export interface SourceMeta {
  label: string
  hex: string
  bgClass: string
  textClass: string
  borderClass: string
  badgeClass: string
}

export const BOOKING_SOURCES: Record<BookingSource, SourceMeta> = {
  direct: {
    label: "Direct",
    hex: "#059669",
    bgClass: "bg-emerald-600",
    textClass: "text-white",
    borderClass: "border-emerald-700",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  booking_com: {
    label: "Booking.com",
    hex: "#0284c7",
    bgClass: "bg-sky-600",
    textClass: "text-white",
    borderClass: "border-sky-700",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
  airbnb: {
    label: "Airbnb",
    hex: "#f43f5e",
    bgClass: "bg-rose-500",
    textClass: "text-white",
    borderClass: "border-rose-600",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
  phone: {
    label: "Phone",
    hex: "#d97706",
    bgClass: "bg-amber-600",
    textClass: "text-white",
    borderClass: "border-amber-700",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  onsite: {
    label: "On-site",
    hex: "#9333ea",
    bgClass: "bg-purple-600",
    textClass: "text-white",
    borderClass: "border-purple-700",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
}

export const BOOKING_STATUSES = [
  { value: "confirmed", label: "Confirmed", color: "bg-emerald-500" },
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "checked_in", label: "Checked In", color: "bg-blue-500" },
  { value: "checked_out", label: "Checked Out", color: "bg-slate-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
]
