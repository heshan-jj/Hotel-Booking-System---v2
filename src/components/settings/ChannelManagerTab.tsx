import React, { useState } from "react"
import {
  useRooms,
  useIcalFeeds,
  useCreateIcalFeed,
  useDeleteIcalFeed,
  useSyncLogs,
  useTriggerSyncIcal,
} from "@/hooks/useBookingsData"
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
import {
  Radio,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  HelpCircle,
  Clock,
  Share2,
} from "lucide-react"

export function ChannelManagerTab() {
  const { data: rooms = [] } = useRooms()
  const { data: feeds = [], isLoading: isLoadingFeeds } = useIcalFeeds()
  const { data: syncLogs = [] } = useSyncLogs()

  const createFeedMutation = useCreateIcalFeed()
  const deleteFeedMutation = useDeleteIcalFeed()
  const syncNowMutation = useTriggerSyncIcal()

  // Copy state for outbound feed URLs
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null)

  // Add Feed Modal state
  const [isAddFeedModalOpen, setIsAddFeedModalOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [sourceName, setSourceName] = useState("Airbnb")
  const [feedUrl, setFeedUrl] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  // Sync result feedback
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const handleCopyUrl = (roomId: string) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co"
    const url = `${baseUrl}/functions/v1/room-ical?room_id=${roomId}`
    navigator.clipboard.writeText(url)
    setCopiedRoomId(roomId)
    setTimeout(() => setCopiedRoomId(null), 2500)
  }

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedRoomId) {
      setFormError("Please select a room.")
      return
    }

    if (!feedUrl.trim()) {
      setFormError("Feed URL is required.")
      return
    }

    try {
      new URL(feedUrl.trim())
    } catch {
      setFormError("Please enter a valid URL (starting with https:// or http://).")
      return
    }

    try {
      await createFeedMutation.mutateAsync({
        room_id: selectedRoomId,
        source_name: sourceName.trim(),
        feed_url: feedUrl.trim(),
      })

      setIsAddFeedModalOpen(false)
      setSelectedRoomId("")
      setFeedUrl("")
      setSourceName("Airbnb")
    } catch (err) {
      console.error("Failed to create feed:", err)
      setFormError((err as Error).message || "Failed to save iCal feed.")
    }
  }

  const handleDeleteFeed = async (id: string) => {
    if (confirm("Are you sure you want to delete this iCal feed connection?")) {
      try {
        await deleteFeedMutation.mutateAsync(id)
      } catch (err) {
        console.error("Failed to delete feed:", err)
      }
    }
  }

  const handleManualSync = async () => {
    setSyncFeedback(null)
    try {
      const result = await syncNowMutation.mutateAsync()
      setSyncFeedback({
        type: "success",
        message: `Sync completed successfully! Processed ${result.total_feeds || 0} feeds.`,
      })
    } catch (err) {
      console.error("Manual sync error:", err)
      setSyncFeedback({
        type: "error",
        message: (err as Error).message || "Failed to trigger sync.",
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Sync Trigger */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">iCal Channel Synchronization</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Keep your room availability in sync with Airbnb, Booking.com, and other OTA channels.
            Scheduled cron runs automatically every 2 hours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleManualSync}
            disabled={syncNowMutation.isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncNowMutation.isPending ? "animate-spin" : ""}`}
            />
            <span>{syncNowMutation.isPending ? "Syncing Feeds..." : "Sync Feeds Now"}</span>
          </Button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium ${
            syncFeedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{syncFeedback.message}</span>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-xs hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. OUTBOUND FEEDS: Export Availability */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <Share2 className="h-4 w-4 text-blue-600" />
                Outbound Availability Feeds (Export to OTAs)
              </CardTitle>
              <CardDescription>
                Copy each room's availability feed URL and paste it into Airbnb or Booking.com's
                "Import Calendar" setting.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              No rooms configured yet. Add rooms in the "Rooms" tab to generate outbound feeds.
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const baseUrl =
                  import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co"
                const exportUrl = `${baseUrl}/functions/v1/room-ical?room_id=${room.id}`
                const isCopied = copiedRoomId === room.id

                return (
                  <div
                    key={room.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {room.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-white">
                          Cap: {room.capacity}
                        </Badge>
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-500 break-all select-all">
                        {exportUrl}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={isCopied ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCopyUrl(room.id)}
                      className={`gap-1.5 shrink-0 text-xs ${
                        isCopied
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Feed URL</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50/60 p-3 text-xs text-blue-800">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <span className="font-semibold">How to sync with channels: </span>
              In Airbnb (Listing &gt; Pricing and availability &gt; Calendar sync &gt; Import
              Calendar), paste the room URL above. In Booking.com (Rates & Availability &gt; Sync
              calendars &gt; Add calendar connection), do the same.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. INBOUND FEEDS: Import Reservations */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <Radio className="h-4 w-4 text-emerald-600" />
                Inbound Channel Feeds (Import from OTAs)
              </CardTitle>
              <CardDescription>
                Add the .ics export links provided by Airbnb or Booking.com so our system
                automatically imports external bookings into your calendar.
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddFeedModalOpen(true)}
              size="sm"
              disabled={rooms.length === 0}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Inbound Feed</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingFeeds ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Loading feeds...</span>
            </div>
          ) : feeds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
              No inbound channel feeds configured yet. Click "+ Add Inbound Feed" to connect an
              Airbnb or Booking.com calendar.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold">Channel</TableHead>
                    <TableHead className="text-xs font-semibold">Linked Room</TableHead>
                    <TableHead className="text-xs font-semibold">External iCal URL</TableHead>
                    <TableHead className="text-xs font-semibold">Last Synced</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeds.map((feed) => (
                    <TableRow key={feed.id}>
                      <TableCell className="font-semibold text-slate-900 text-xs">
                        <Badge variant="outline" className="bg-slate-50">
                          {feed.source_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700">
                        {feed.room?.name || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500 max-w-xs truncate">
                        <a
                          href={feed.feed_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <span className="truncate">{feed.feed_url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {feed.last_synced_at
                          ? new Date(feed.last_synced_at).toLocaleString()
                          : "Pending initial sync"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFeed(feed.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. SYNC AUDIT LOGS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <Clock className="h-4 w-4 text-slate-500" />
            Recent Synchronization History (Sync Logs)
          </CardTitle>
          <CardDescription>
            Audit log of past manual and scheduled automated iCal synchronizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              No sync logs recorded yet. Logs will appear here once feeds are synchronized.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 sticky top-0">
                    <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                    <TableHead className="text-xs font-semibold">Channel / Feed</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Details / Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => {
                    const isSuccess = log.status === "success"
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-mono text-slate-600">
                          {new Date(log.synced_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">
                          {log.feed?.source_name ? (
                            <span>
                              {log.feed.source_name} ({log.feed.room?.name || "Room"})
                            </span>
                          ) : (
                            <span className="text-slate-400">Feed {log.feed_id.slice(0, 8)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              isSuccess
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-sm truncate">
                          {log.error ? (
                            <span className="text-red-600 font-mono text-[11px]">
                              {log.error}
                            </span>
                          ) : (
                            <span className="text-emerald-700">Synchronized cleanly</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Feed Modal */}
      {isAddFeedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Connect Inbound iCal Feed</h3>
            <p className="mt-1 text-xs text-slate-500">
              Import bookings from an external OTA calendar (Airbnb, Booking.com, VRBO) into a
              designated room.
            </p>

            {formError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateFeed} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="feedRoom" className="text-xs font-semibold text-slate-700">
                  Target Hotel Room <span className="text-red-500">*</span>
                </Label>
                <select
                  id="feedRoom"
                  required
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="sourceName" className="text-xs font-semibold text-slate-700">
                  Channel Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sourceName"
                  required
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Airbnb, Booking.com, VRBO"
                  className="mt-1.5 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="feedUrl" className="text-xs font-semibold text-slate-700">
                  External iCal URL (.ics) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="feedUrl"
                  required
                  type="url"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  className="mt-1.5 font-mono text-xs"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Paste the export link found in your OTA's calendar settings.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddFeedModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createFeedMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {createFeedMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  )}
                  Save Channel Feed
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
