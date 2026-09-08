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

  const handleDelete = async (roomId: string, roomName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${roomName}"? This will also remove any linked calendar feeds.`
      )
    ) {
      try {
        await deleteRoomMutation.mutateAsync(roomId)
      } catch (err) {
        console.error("Delete room error:", err)
        alert("Failed to delete room: " + (err as Error).message)
      }
    }
  }

  const isSaving = createRoomMutation.isPending || updateRoomMutation.isPending

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <BedDouble className="h-5 w-5 text-blue-600" />
                Hotel Rooms & Unit Inventory
              </CardTitle>
              <CardDescription>
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
                  className="gap-1 text-xs"
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
            <div className="flex items-center justify-center py-10 text-xs text-slate-500 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Loading rooms...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
              <BedDouble className="mx-auto mb-2 h-7 w-7 text-slate-400" />
              <p className="font-semibold text-slate-700">No rooms configured yet</p>
              <p className="mt-1">Click "+ Add Room" above to register your first hotel room.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold">Room Name</TableHead>
                    <TableHead className="text-xs font-semibold">Max Guests</TableHead>
                    <TableHead className="text-xs font-semibold">Base Rate / Night</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-semibold text-slate-900 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                            <BedDouble className="h-4 w-4" />
                          </div>
                          <span>{room.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 bg-slate-50 text-slate-700">
                          <Users className="h-3 w-3" />
                          <span>{room.capacity} Guests</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 text-sm">
                        <span className="text-emerald-700 font-semibold">
                          {formatPrice(room.base_rate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(room)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(room.id, room.name)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Add / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingRoom ? "Edit Room Details" : "Add New Room"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {editingRoom
                ? "Update room name, occupancy, or pricing rate."
                : "Create a room unit that can be booked and synced with channels."}
            </p>

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="roomNameInput" className="text-xs font-semibold text-slate-700">
                  Room Name / Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="roomNameInput"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Deluxe Ocean Suite 101"
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="capacityInput" className="text-xs font-semibold text-slate-700">
                    Max Capacity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="capacityInput"
                    type="number"
                    min="1"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="rateInput" className="text-xs font-semibold text-slate-700">
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
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
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
          </div>
        </div>
      )}
    </div>
  )
}
