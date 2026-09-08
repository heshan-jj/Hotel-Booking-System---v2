import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import * as nodeIcal from "npm:node-ical"

// Handle potential default vs namespace export from node-ical
// deno-lint-ignore no-explicit-any
const ical = (nodeIcal as any).default || nodeIcal

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type BookingSource = "direct" | "phone" | "onsite" | "booking_com" | "airbnb"

function mapSourceToBookingSource(sourceName: string): BookingSource {
  const normalized = sourceName.toLowerCase().replace(/[\s.-]/g, "_")
  if (normalized.includes("airbnb")) return "airbnb"
  if (normalized.includes("booking")) return "booking_com"
  if (normalized.includes("phone")) return "phone"
  if (normalized.includes("onsite") || normalized.includes("walkin")) return "onsite"
  return "direct"
}

// deno-lint-ignore no-explicit-any
function toDateString(val: any): string {
  if (!val) return ""
  if (val instanceof Date) {
    const year = val.getFullYear()
    const month = String(val.getMonth() + 1).padStart(2, "0")
    const day = String(val.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
  const d = new Date(val)
  if (isNaN(d.getTime())) return ""
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE") ??
      ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 2. Fetch all ical_feeds
    const { data: feeds, error: feedsError } = await supabase
      .from("ical_feeds")
      .select("id, room_id, source_name, feed_url, last_synced_at")

    if (feedsError) {
      throw new Error(`Failed to fetch ical_feeds: ${feedsError.message}`)
    }

    if (!feeds || feeds.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No iCal feeds found to sync.",
          total_feeds: 0,
          results: [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const results = []

    // 3. Process each feed
    for (const feed of feeds) {
      const feedStats = {
        feed_id: feed.id,
        room_id: feed.room_id,
        source_name: feed.source_name,
        status: "success",
        inserted: 0,
        updated: 0,
        cancelled: 0,
        unchanged: 0,
        error: null as string | null,
      }

      const syncTimestamp = new Date().toISOString()

      try {
        if (!feed.feed_url) {
          throw new Error("feed_url is empty")
        }

        // Fetch feed content
        const res = await fetch(feed.feed_url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; HotelPMS-iCalSync/1.0)",
          },
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        const icsData = await res.text()

        // Parse with node-ical
        const parsed = ical.sync
          ? ical.sync.parseICS(icsData)
          : ical.parseICS(icsData)

        // Extract VEVENT entries
        const feedEvents: Array<{
          uid: string
          summary?: string
          description?: string
          start: Date
          end: Date
          status?: string
        }> = []

        for (const key of Object.keys(parsed)) {
          const ev = parsed[key]
          if (ev.type === "VEVENT" && ev.uid && ev.start && ev.end) {
            feedEvents.push({
              uid: String(ev.uid).trim(),
              summary: ev.summary ? String(ev.summary).trim() : undefined,
              description: ev.description ? String(ev.description).trim() : undefined,
              start: new Date(ev.start),
              end: new Date(ev.end),
              status: ev.status ? String(ev.status).trim() : undefined,
            })
          }
        }

        // Fetch existing bookings for this room with ical_uid
        const { data: existingBookings, error: bookErr } = await supabase
          .from("bookings")
          .select("id, ical_uid, guest_id, check_in, check_out, status, notes")
          .eq("room_id", feed.room_id)
          .not("ical_uid", "is", null)

        if (bookErr) {
          throw new Error(`Failed to query existing bookings: ${bookErr.message}`)
        }

        const existingMap = new Map<string, NonNullable<typeof existingBookings>[number]>()
        for (const b of existingBookings || []) {
          if (b.ical_uid) {
            existingMap.set(b.ical_uid, b)
          }
        }

        const feedUids = new Set<string>()
        const bookingSource = mapSourceToBookingSource(feed.source_name)

        // Process incoming events from feed
        for (const ev of feedEvents) {
          feedUids.add(ev.uid)

          const checkIn = toDateString(ev.start)
          let checkOut = toDateString(ev.end)

          // Ensure checkout is strictly after checkin (hotel booking requirement)
          if (!checkOut || checkOut <= checkIn) {
            const nextDay = new Date(ev.start)
            nextDay.setDate(nextDay.getDate() + 1)
            checkOut = toDateString(nextDay)
          }

          const isCancelled = ev.status?.toUpperCase() === "CANCELLED"
          const targetStatus = isCancelled ? "cancelled" : "confirmed"
          const targetNotes =
            ev.description || ev.summary || `Imported from ${feed.source_name}`

          const existing = existingMap.get(ev.uid)

          if (existing) {
            // Check if changed
            const hasChanged =
              existing.check_in !== checkIn ||
              existing.check_out !== checkOut ||
              existing.status !== targetStatus

            if (hasChanged) {
              const { error: updErr } = await supabase
                .from("bookings")
                .update({
                  check_in: checkIn,
                  check_out: checkOut,
                  status: targetStatus,
                  notes: targetNotes,
                })
                .eq("id", existing.id)

              if (updErr) {
                console.error(`Error updating booking ${existing.id}:`, updErr)
              } else {
                feedStats.updated++
              }
            } else {
              feedStats.unchanged++
            }
          } else {
            // New booking — find or create guest
            const guestName = ev.summary || `${feed.source_name} Guest`

            // Try to find existing guest with exact name
            let guestId: string
            const { data: existingGuest } = await supabase
              .from("guests")
              .select("id")
              .eq("name", guestName)
              .limit(1)
              .maybeSingle()

            if (existingGuest) {
              guestId = existingGuest.id
            } else {
              const { data: createdGuest, error: guestErr } = await supabase
                .from("guests")
                .insert({
                  name: guestName,
                  notes: `Auto-created from ${feed.source_name} iCal feed (${feed.id})`,
                })
                .select("id")
                .single()

              if (guestErr || !createdGuest) {
                throw new Error(`Failed to create guest: ${guestErr?.message}`)
              }
              guestId = createdGuest.id
            }

            const { error: insErr } = await supabase.from("bookings").insert({
              guest_id: guestId,
              room_id: feed.room_id,
              source: bookingSource,
              check_in: checkIn,
              check_out: checkOut,
              status: targetStatus,
              ical_uid: ev.uid,
              notes: targetNotes,
            })

            if (insErr) {
              console.error(`Error inserting booking for uid ${ev.uid}:`, insErr)
            } else {
              feedStats.inserted++
            }
          }
        }

        // Mark cancelled if removed from feed
        for (const [uid, existing] of existingMap.entries()) {
          if (!feedUids.has(uid) && existing.status !== "cancelled") {
            const cancellationNote = existing.notes
              ? `${existing.notes} (Cancelled: removed from ${feed.source_name} feed)`
              : `Cancelled: removed from ${feed.source_name} feed`

            const { error: cancelErr } = await supabase
              .from("bookings")
              .update({
                status: "cancelled",
                notes: cancellationNote,
              })
              .eq("id", existing.id)

            if (cancelErr) {
              console.error(`Error cancelling booking ${existing.id}:`, cancelErr)
            } else {
              feedStats.cancelled++
            }
          }
        }

        // Update last_synced_at on feed
        await supabase
          .from("ical_feeds")
          .update({ last_synced_at: syncTimestamp })
          .eq("id", feed.id)

        // Log success run to sync_log
        await supabase.from("sync_log").insert({
          feed_id: feed.id,
          synced_at: syncTimestamp,
          status: "success",
          error: null,
        })
      } catch (feedErr) {
        const errorMsg =
          feedErr instanceof Error ? feedErr.message : String(feedErr)
        feedStats.status = "failed"
        feedStats.error = errorMsg

        console.error(`Sync error on feed ${feed.id}:`, errorMsg)

        // Log failure to sync_log
        await supabase.from("sync_log").insert({
          feed_id: feed.id,
          synced_at: syncTimestamp,
          status: "failed",
          error: errorMsg,
        })
      }

      results.push(feedStats)
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        total_feeds: feeds.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error("Global sync-ical error:", errorMsg)

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
