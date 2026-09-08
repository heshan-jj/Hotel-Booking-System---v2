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
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        Guest <span className="text-rose-500">*</span>
      </label>

      {/* If a guest is selected and not creating new */}
      {currentGuest && !isCreatingNew ? (
        <div className="flex items-center justify-between rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-slate-50/80 dark:bg-zinc-800/60 p-2.5 shadow-ios-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {currentGuest.name ? currentGuest.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">{currentGuest.name}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-normal">
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
            className="h-7 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white/90 dark:bg-zinc-900/90 px-2.5 text-xs font-medium text-slate-600 dark:text-zinc-300 shadow-ios-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            Change
          </button>
        </div>
      ) : isCreatingNew ? (
        /* Inline New Guest Creation Form */
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 shadow-ios-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <UserPlus className="h-3.5 w-3.5" />
              New Guest Profile
            </h4>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs tracking-tight text-foreground placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">Phone</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs tracking-tight text-foreground placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="guest@example.com"
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs tracking-tight text-foreground placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Passport / ID Number
              </label>
              <input
                type="text"
                value={newIdNumber}
                onChange={(e) => setNewIdNumber(e.target.value)}
                placeholder="N1234567"
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs tracking-tight text-foreground placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">Nationality</label>
              <input
                type="text"
                value={newNationality}
                onChange={(e) => setNewNationality(e.target.value)}
                placeholder="e.g. British"
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs tracking-tight text-foreground placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">Guest Notes</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="VIP preferences, allergies, dietary requirements..."
                className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs tracking-tight text-foreground placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="h-7 rounded-lg px-3 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-black/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={createGuestMutation.isPending || !newName.trim()}
              onClick={handleCreateGuest}
              className="flex h-7 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-ios-sm hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {createGuestMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Save & Select Guest
            </button>
          </div>
        </div>
      ) : (
        /* Autocomplete Search Dropdown */
        <div className="relative">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
              <Search className="h-3.5 w-3.5" />
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
              className="w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-800/60 py-1.5 pl-8 pr-8 text-xs tracking-tight text-foreground placeholder:text-slate-400 shadow-ios-sm focus:bg-white dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Results popover */}
          {isOpen && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1 shadow-ios-dropdown">
              {/* Option to create new guest */}
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(true)
                  setNewName(searchTerm)
                  setIsOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Create new guest {searchTerm ? `"${searchTerm}"` : ""}</span>
              </button>

              {isSearching ? (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Searching guests...</span>
                </div>
              ) : guests.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-slate-400">
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
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
                        isSelected ? "bg-primary/10 text-primary font-semibold" : "text-slate-800 dark:text-zinc-200"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{guest.name}</p>
                        <p className="text-xs text-slate-400">
                          {[guest.phone, guest.email, guest.nationality]
                            .filter(Boolean)
                            .join(" • ") || "No additional info"}
                        </p>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
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
