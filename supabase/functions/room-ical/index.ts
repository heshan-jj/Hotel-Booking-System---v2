import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

function formatIcsDate(dateStr: string): string {
  // Input: "YYYY-MM-DD" -> Output: "YYYYMMDD"
  return dateStr.replace(/-/g, "")
}

function formatIcsTimestamp(d: Date): string {
  // Output: "YYYYMMDDTHHMMSSZ"
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

Deno.serve(async (req: Request) => {
  // Handle CORS Preflight
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
      return new Response("Server configuration error: missing Supabase credentials.", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Extract room_id from query params or URL path
    const url = new URL(req.url)
    let roomId = url.searchParams.get("room_id") || url.searchParams.get("id")

    if (!roomId) {
      // Check path parts e.g. /room-ical/:roomId or /room-ical/:roomId.ics
      const segments = url.pathname.split("/").filter(Boolean)
      const last = segments[segments.length - 1]
      if (last && last !== "room-ical") {
        roomId = last.replace(/\.ics$/i, "")
      }
    }

    if (!roomId) {
      return new Response(
        "Missing room_id parameter. Usage: /room-ical?room_id=<ROOM_UUID> or /room-ical/<ROOM_UUID>.ics",
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
        }
      )
    }

    // 1. Fetch Room details
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, property_id")
      .eq("id", roomId)
      .maybeSingle()

    if (roomError) {
      return new Response(`Database error: ${roomError.message}`, {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      })
    }

    if (!room) {
      return new Response(`Room not found for ID: ${roomId}`, {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      })
    }

    // 2. Fetch all confirmed bookings for this room
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, check_in, check_out, status, source, ical_uid, created_at")
      .eq("room_id", roomId)
      .in("status", ["confirmed", "checked_in"])
      .order("check_in", { ascending: true })

    if (bookingsError) {
      return new Response(`Error fetching bookings: ${bookingsError.message}`, {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      })
    }

    const now = new Date()
    const nowStamp = formatIcsTimestamp(now)

    // 3. Build RFC 5545 iCalendar format
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hotel Management System//Room Availability 1.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${room.name} Availability`,
      "X-WR-TIMEZONE:UTC",
    ]

    for (const b of bookings || []) {
      const dtstart = formatIcsDate(b.check_in)
      const dtend = formatIcsDate(b.check_out)
      const uid = b.ical_uid || `${b.id}@hotelpms.local`
      const dtstamp = b.created_at ? formatIcsTimestamp(new Date(b.created_at)) : nowStamp

      lines.push("BEGIN:VEVENT")
      lines.push(`UID:${uid}`)
      lines.push(`DTSTAMP:${dtstamp}`)
      lines.push(`DTSTART;VALUE=DATE:${dtstart}`)
      lines.push(`DTEND;VALUE=DATE:${dtend}`)
      lines.push("SUMMARY:Reserved")
      lines.push("DESCRIPTION:Confirmed reservation")
      lines.push("STATUS:CONFIRMED")
      lines.push("TRANSP:OPAQUE")
      lines.push("END:VEVENT")
    }

    lines.push("END:VCALENDAR")

    // RFC 5545 specifies CRLF line endings
    const icsBody = lines.join("\r\n") + "\r\n"

    return new Response(icsBody, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="room-${room.id}.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("room-ical error:", msg)
    return new Response(`Internal server error: ${msg}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    })
  }
})
