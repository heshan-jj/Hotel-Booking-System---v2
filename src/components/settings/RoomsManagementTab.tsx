import { useState } from "react"
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  useCreateDefaultRoom,
} from "@/hooks/useBookingsData"
import { useHotelSettings } from "@/hooks/useHotelSettings"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { RoomRow } from "@/types/booking"
import {
  BedDouble,
  Plus,
  Edit2,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  Sparkles,
  Check,
  X,
} from "lucide-react"

export function RoomsManagementTab() {
  const { data: rooms = [], isLoading } = useRooms()
  const { currencySymbol, formatPrice } = useHotelSettings()
  const createRoomMutation = useCreateRoom()
  const updateRoomMutation = useUpdateRoom()
  const deleteRoomMutation = useDeleteRoom()
  const createDefaultRoomsMutation = useCreateDefaultRoom()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomRow | null>(null)

  // Form State
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState<number>(2)
  const [baseRate, setBaseRate] = useState<number>(120)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Inline Delete State & Failure Banner
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleOpenCreateModal = () => {
    setEditingRoom(null)
    setName("")
    setCapacity(2)
    setBaseRate(120)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (room: RoomRow) => {
    setEditingRoom(room)
    setName(room.name)
    setCapacity(room.capacity)
    setBaseRate(room.base_rate)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage("Room name is required.")
      return
    }

    try {
      if (editingRoom) {
        // Update
        await updateRoomMutation.mutateAsync({
          id: editingRoom.id,
          updates: {
            name: name.trim(),
            capacity: Math.max(1, capacity),
            base_rate: Math.max(0, baseRate),
          },
        })
      } else {
        // Find or create property ID
        let propertyId: string
        const { data: props } = await supabase.from("properties").select("id").limit(1)

        if (props && props.length > 0) {
          propertyId = props[0].id
        } else {
          const { data: newProp, error: propErr } = await supabase
            .from("properties")
            .insert({ name: "Main Hotel Property" })
            .select("id")
            .single()

          if (propErr || !newProp) throw new Error("Could not ensure property record")
          propertyId = newProp.id
        }

        // Create
        await createRoomMutation.mutateAsync({
          property_id: propertyId,
          name: name.trim(),
          capacity: Math.max(1, capacity),
          base_rate: Math.max(0, baseRate),
        })
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error("Save room error:", err)
      setErrorMessage((err as Error).message || "Failed to save room details.")
    }
  }

  const handleConfirmDelete = async (roomId: string) => {
    setDeleteError(null)
    try {
      await deleteRoomMutation.mutateAsync(roomId)
      setConfirmingDeleteId(null)
    } catch (err) {
      console.error("Delete room error:", err)
      setDeleteError((err as Error).message || "Failed to delete room.")
    }
  }

  const isSaving = createRoomMutation.isPending || updateRoomMutation.isPending

  return (
    <div className="space-y-6">
      {deleteError && (
        <div className="flex items-start justify-between gap-2 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 p-4 text-xs font-semibold text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="dark:bg-zinc-900/90 dark:border-white/[0.08]">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-zinc-100">
                <BedDouble className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Hotel Rooms & Unit Inventory
              </CardTitle>
              <CardDescription className="dark:text-zinc-400">
                Configure your accommodation units, guest capacities, and default nightly base
                rates.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {rooms.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={createDefaultRoomsMutation.isPending}
                  onClick={() => createDefaultRoomsMutation.mutate()}
                  className="gap-1 text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Generate Sample Rooms</span>
                </Button>
              )}
              <Button
                onClick={handleOpenCreateModal}
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Plus className="h-4 w-4" />
                <span>Add Room</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-xs text-slate-500 dark:text-zinc-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Loading rooms...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
              <BedDouble className="mx-auto mb-2 h-7 w-7 text-slate-400 dark:text-zinc-600" />
              <p className="font-semibold text-slate-700 dark:text-zinc-300">No rooms configured yet</p>
              <p className="mt-1">Click "+ Add Room" above to register your first hotel room.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.08]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-zinc-800/60">
                    <TableHead className="text-xs font-semibold dark:text-zinc-300">Room Name</TableHead>
                    <TableHead className="text-xs font-semibold dark:text-zinc-300">Max Guests</TableHead>
                    <TableHead className="text-xs font-semibold dark:text-zinc-300">Base Rate / Night</TableHead>
                    <TableHead className="text-right text-xs font-semibold dark:text-zinc-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id} className="dark:border-white/[0.08]">
                      <TableCell className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                            <BedDouble className="h-4 w-4" />
                          </div>
                          <span>{room.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700">
                          <Users className="h-3 w-3" />
                          <span>{room.capacity} Guests</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-zinc-100 text-sm">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {formatPrice(room.base_rate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 sm:gap-1.5">
                          {confirmingDeleteId === room.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                title="Confirm Delete"
                                aria-label="Confirm room deletion"
                                onClick={() => handleConfirmDelete(room.id)}
                                className="h-11 px-3.5 sm:h-8 sm:px-2.5 text-xs gap-1"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Confirm</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Cancel"
                                aria-label="Cancel deletion"
                                onClick={() => setConfirmingDeleteId(null)}
                                className="h-11 px-3 sm:h-8 sm:px-2 text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit Room"
                                aria-label="Edit room details"
                                onClick={() => handleOpenEditModal(room)}
                                className="h-11 w-11 sm:h-8 sm:w-8 p-0 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete Room"
                                aria-label="Delete room"
                                onClick={() => setConfirmingDeleteId(room.id)}
                                className="h-11 w-11 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Room Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? "Edit Room Details" : "Add New Room"}
        description={
          editingRoom
            ? "Update room name, occupancy, or pricing rate."
            : "Create a room unit that can be booked and synced with channels."
        }
        maxWidthClass="max-w-md"
        id="room-modal"
      >
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roomNameInput" className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
              Room Name / Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roomNameInput"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deluxe Ocean Suite 101"
              className="mt-1.5 dark:bg-zinc-800/60 dark:border-white/[0.1] dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="capacityInput" className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                Max Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacityInput"
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="mt-1.5 dark:bg-zinc-800/60 dark:border-white/[0.1] dark:text-zinc-100"
              />
            </div>

            <div>
              <Label htmlFor="rateInput" className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                Base Rate ({currencySymbol} / Night) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rateInput"
                type="number"
                min="0"
                step="0.01"
                required
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                className="mt-1.5 dark:bg-zinc-800/60 dark:border-white/[0.1] dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              <span>{editingRoom ? "Save Changes" : "Create Room"}</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
