import { useState, useMemo } from "react"
import {
  useGuests,
  useBookings,
  useDeleteGuest,
} from "@/hooks/useBookingsData"
import type { GuestRow } from "@/types/booking"
import { GuestModal } from "@/components/guests/GuestModal"
import { BookingModal } from "@/components/bookings/BookingModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  CreditCard,
  Globe,
  CalendarDays,
  CalendarPlus,
  FileText,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

export function GuestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGuest, setSelectedGuest] = useState<GuestRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [guestForBooking, setGuestForBooking] = useState<GuestRow | null>(null)
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null)
  const [guestToDelete, setGuestToDelete] = useState<GuestRow | null>(null)

  const { data: guests = [], isLoading: isLoadingGuests } = useGuests(searchQuery)
  const { data: bookings = [] } = useBookings()
  const deleteGuestMutation = useDeleteGuest()

  // Calculate booking counts per guest
  const bookingsCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of bookings) {
      if (b.guest_id) {
        map[b.guest_id] = (map[b.guest_id] || 0) + 1
      }
    }
    return map
  }, [bookings])

  // Filter guests client-side for additional responsiveness if needed
  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guests
    const q = searchQuery.toLowerCase().trim()
    return guests.filter((g) => {
      const matchName = g.name.toLowerCase().includes(q)
      const matchEmail = g.email?.toLowerCase().includes(q) ?? false
      const matchPhone = g.phone?.toLowerCase().includes(q) ?? false
      const matchId = g.id_number?.toLowerCase().includes(q) ?? false
      const matchNat = g.nationality?.toLowerCase().includes(q) ?? false
      return matchName || matchEmail || matchPhone || matchId || matchNat
    })
  }, [guests, searchQuery])

  // Stats
  const totalGuests = guests.length
  const guestsWithBookings = guests.filter((g) => (bookingsCountMap[g.id] || 0) > 0).length
  const internationalGuests = guests.filter((g) => Boolean(g.nationality)).length
  const verifiedIds = guests.filter((g) => Boolean(g.id_number)).length

  const handleOpenAdd = () => {
    setSelectedGuest(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (guest: GuestRow) => {
    setSelectedGuest(guest)
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!guestToDelete) return
    setDeletingGuestId(guestToDelete.id)
    try {
      await deleteGuestMutation.mutateAsync(guestToDelete.id)
      setGuestToDelete(null)
    } catch (err) {
      console.error("Failed to delete guest:", err)
    } finally {
      setDeletingGuestId(null)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Guests</h1>
            <p className="text-sm text-slate-500">
              Manage guest profiles, contact directory, and booking records
            </p>
          </div>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 shadow-sm rounded-xl">
          <Plus className="h-4 w-4" />
          Add Guest
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Guests</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalGuests}</p>
          <p className="mt-0.5 text-xs text-slate-400">Registered guest directory</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">With Bookings</span>
            <CalendarDays className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{guestsWithBookings}</p>
          <p className="mt-0.5 text-xs text-slate-400">Past & upcoming stays</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">International</span>
            <Globe className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{internationalGuests}</p>
          <p className="mt-0.5 text-xs text-slate-400">Country specified</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Documented IDs</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{verifiedIds}</p>
          <p className="mt-0.5 text-xs text-slate-400">Passport / ID recorded</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search guests by name, email, phone, passport, or nationality..."
            className="pl-10 pr-10 h-11 rounded-xl bg-slate-50/70 border-slate-200 focus:bg-white transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-200/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Guests Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {isLoadingGuests ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-slate-500">Loading guest directory...</p>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              {searchQuery ? "No guests match your search" : "No guests registered yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching for another name, phone number, email, or nationality."
                : "Add your first guest profile to link with room reservations and track contact details."}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenAdd} className="mt-4 gap-2 rounded-xl">
                <Plus className="h-4 w-4" />
                Add First Guest
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="py-3.5 pl-6 font-semibold text-slate-700">Guest</TableHead>
                  <TableHead className="py-3.5 font-semibold text-slate-700">Contact Details</TableHead>
                  <TableHead className="py-3.5 font-semibold text-slate-700">ID / Country</TableHead>
                  <TableHead className="py-3.5 font-semibold text-slate-700 text-center">Bookings</TableHead>
                  <TableHead className="py-3.5 pr-6 text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => {
                  const bookingCount = bookingsCountMap[guest.id] || 0

                  return (
                    <TableRow key={guest.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
                            {getInitials(guest.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {guest.name}
                              {guest.notes && (
                                <span title={guest.notes}>
                                  <FileText className="h-3.5 w-3.5 text-amber-500 inline" />
                                </span>
                              )}
                            </div>
                            {guest.notes ? (
                              <p className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">
                                {guest.notes}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400">
                                Added {new Date(guest.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          {guest.email ? (
                            <a
                              href={`mailto:${guest.email}`}
                              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-[200px]">{guest.email}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No email</span>
                          )}

                          {guest.phone ? (
                            <a
                              href={`tel:${guest.phone}`}
                              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{guest.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 block italic">No phone</span>
                          )}
                        </div>
                      </TableCell>

                      {/* ID & Nationality */}
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {guest.nationality ? (
                            <Badge variant="outline" className="gap-1 text-xs py-0.5 px-2 bg-slate-50 font-normal">
                              <Globe className="h-3 w-3 text-slate-400" />
                              {guest.nationality}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No nationality</span>
                          )}

                          {guest.id_number && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
                              <CreditCard className="h-3 w-3 text-slate-400" />
                              {guest.id_number}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Booking count */}
                      <TableCell className="py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            bookingCount > 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {bookingCount} {bookingCount === 1 ? "booking" : "bookings"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGuestForBooking(guest)
                              setIsBookingModalOpen(true)
                            }}
                            className="h-8 px-2.5 gap-1.5 rounded-lg text-xs font-semibold text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40 shadow-xs"
                            title="Manually book rooms for this guest"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            <span>Book Rooms</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(guest)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Edit guest profile"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setGuestToDelete(guest)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete guest"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Guest Create / Edit Modal */}
      <GuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        guest={selectedGuest}
      />

      {/* Booking Modal (for manual room booking for a guest) */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false)
          setGuestForBooking(null)
        }}
        initialGuest={guestForBooking}
      />

      {/* Delete Confirmation Modal */}
      {guestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Guest Profile</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 font-semibold">{guestToDelete.name}</strong>?
              {bookingsCountMap[guestToDelete.id] > 0 && (
                <span className="block mt-2 text-rose-600 font-medium text-xs bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                  Warning: This guest has {bookingsCountMap[guestToDelete.id]} associated bookings in the system.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setGuestToDelete(null)}
                disabled={Boolean(deletingGuestId)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingGuestId)}
                className="rounded-xl gap-2"
              >
                {deletingGuestId && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Guest
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
