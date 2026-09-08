import React, { useState, useEffect } from "react"
import { useCreateGuest, useUpdateGuest } from "@/hooks/useBookingsData"
import type { GuestRow } from "@/types/booking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, User, Mail, Phone, FileText, Globe, CreditCard, Loader2 } from "lucide-react"

interface GuestModalProps {
  isOpen: boolean
  onClose: () => void
  guest?: GuestRow | null
}

export function GuestModal({ isOpen, onClose, guest }: GuestModalProps) {
  const isEditing = Boolean(guest)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [nationality, setNationality] = useState("")
  const [notes, setNotes] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createGuestMutation = useCreateGuest()
  const updateGuestMutation = useUpdateGuest()

  useEffect(() => {
    if (guest) {
      setName(guest.name || "")
      setEmail(guest.email || "")
      setPhone(guest.phone || "")
      setIdNumber(guest.id_number || "")
      setNationality(guest.nationality || "")
      setNotes(guest.notes || "")
    } else {
      setName("")
      setEmail("")
      setPhone("")
      setIdNumber("")
      setNationality("")
      setNotes("")
    }
    setErrorMessage(null)
  }, [guest, isOpen])

  if (!isOpen) return null

  const isSaving = createGuestMutation.isPending || updateGuestMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage("Guest full name is required.")
      return
    }

    try {
      if (isEditing && guest) {
        await updateGuestMutation.mutateAsync({
          id: guest.id,
          updates: {
            name: name.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            id_number: idNumber.trim() || null,
            nationality: nationality.trim() || null,
            notes: notes.trim() || null,
          },
        })
      } else {
        await createGuestMutation.mutateAsync({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          id_number: idNumber.trim() || null,
          nationality: nationality.trim() || null,
          notes: notes.trim() || null,
        })
      }
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save guest"
      setErrorMessage(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {isEditing ? "Edit Guest Profile" : "Add New Guest"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update guest contact information and identification"
                  : "Create a guest profile for check-ins and bookings"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 text-sm bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="guest-name" className="text-xs font-semibold text-slate-700">
              Full Name <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="guest-name"
                required
                placeholder="e.g. John Doe"
                className="pl-9 h-10 rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="guest-email" className="text-xs font-semibold text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-9 h-10 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guest-phone" className="text-xs font-semibold text-slate-700">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="guest-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="pl-9 h-10 rounded-xl"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="guest-id-number" className="text-xs font-semibold text-slate-700">
                ID / Passport Number
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="guest-id-number"
                  placeholder="e.g. A12345678"
                  className="pl-9 h-10 rounded-xl"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guest-nationality" className="text-xs font-semibold text-slate-700">
                Nationality / Country
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="guest-nationality"
                  placeholder="e.g. United States"
                  className="pl-9 h-10 rounded-xl"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-notes" className="text-xs font-semibold text-slate-700">
              Special Notes / Preferences
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <textarea
                id="guest-notes"
                rows={3}
                placeholder="e.g. Vegetarian breakfast, preferred high floor, VIP member"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 pl-9 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 resize-none transition"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-4"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl px-5 gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Guest"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
