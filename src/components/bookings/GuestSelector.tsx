import { useState, useEffect, useRef } from "react"
import { useGuests, useCreateGuest } from "@/hooks/useBookingsData"
import type { GuestRow } from "@/types/booking"
import { Search, UserPlus, Check, X, Loader2, User } from "lucide-react"

interface GuestSelectorProps {
  selectedGuestId: string
  onSelectGuest: (guest: GuestRow | null) => void
  selectedGuest?: GuestRow | null
}

export function GuestSelector({
  selectedGuestId,
  onSelectGuest,
  selectedGuest,
}: GuestSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Inline new guest fields
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newIdNumber, setNewIdNumber] = useState("")
  const [newNationality, setNewNationality] = useState("")
  const [newNotes, setNewNotes] = useState("")

  const containerRef = useRef<HTMLDivElement>(null)

  const { data: guests = [], isLoading: isSearching } = useGuests(searchTerm)
  const createGuestMutation = useCreateGuest()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Find currently selected guest from fetched guests if not provided
  const currentGuest =
    selectedGuest || guests.find((g) => g.id === selectedGuestId) || null

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    try {
      const created = await createGuestMutation.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim() || null,
        email: newEmail.trim() || null,
        id_number: newIdNumber.trim() || null,
        nationality: newNationality.trim() || null,
        notes: newNotes.trim() || null,
      })
      onSelectGuest(created)
      setIsCreatingNew(false)
      setIsOpen(false)
      // Reset form
      setNewName("")
      setNewPhone("")
      setNewEmail("")
      setNewIdNumber("")
      setNewNationality("")
      setNewNotes("")
    } catch (err) {
      console.error("Failed to create guest:", err)
    }
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        Guest <span className="text-red-500">*</span>
      </label>

      {/* If a guest is selected and not creating new */}
      {currentGuest && !isCreatingNew ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{currentGuest.name}</p>
              <p className="text-xs text-slate-500">
                {[currentGuest.phone, currentGuest.email].filter(Boolean).join(" • ") ||
                  "No contact details"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectGuest(null)
              setIsOpen(true)
            }}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            Change
          </button>
        </div>
      ) : isCreatingNew ? (
        /* Inline New Guest Creation Form */
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
              <UserPlus className="h-4 w-4" />
              New Guest Profile
            </h4>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="guest@example.com"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Passport / ID Number
              </label>
              <input
                type="text"
                value={newIdNumber}
                onChange={(e) => setNewIdNumber(e.target.value)}
                placeholder="N1234567"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Nationality</label>
              <input
                type="text"
                value={newNationality}
                onChange={(e) => setNewNationality(e.target.value)}
                placeholder="e.g. British"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Guest Notes</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="VIP preferences, allergies, dietary requirements..."
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={createGuestMutation.isPending || !newName.trim()}
              onClick={handleCreateGuest}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-blue-500 disabled:opacity-50"
            >
              {createGuestMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save & Select Guest
            </button>
          </div>
        </div>
      ) : (
        /* Autocomplete Search Dropdown */
        <div className="relative">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setIsOpen(true)
              }}
              placeholder="Search guest by name, email, or phone..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results popover */}
          {isOpen && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {/* Option to create new guest */}
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(true)
                  setNewName(searchTerm)
                  setIsOpen(false)
                }}
                className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Create new guest {searchTerm ? `"${searchTerm}"` : ""}</span>
              </button>

              {isSearching ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Searching guests...</span>
                </div>
              ) : guests.length === 0 ? (
                <div className="px-4 py-4 text-center text-xs text-slate-500">
                  No existing guests found. Click above to add a new guest.
                </div>
              ) : (
                guests.map((guest) => {
                  const isSelected = guest.id === selectedGuestId
                  return (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => {
                        onSelectGuest(guest)
                        setIsOpen(false)
                        setSearchTerm("")
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                        isSelected ? "bg-blue-50/70" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium text-slate-900">{guest.name}</p>
                        <p className="text-xs text-slate-500">
                          {[guest.phone, guest.email, guest.nationality]
                            .filter(Boolean)
                            .join(" • ") || "No additional info"}
                        </p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
