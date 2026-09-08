import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  BookingWithDetails,
  BookingInsert,
  BookingUpdate,
  GuestRow,
  GuestInsert,
  RoomRow,
} from "@/types/booking"
import type { Database } from "@/types/database.types"

export type RoomInsert = Database["public"]["Tables"]["rooms"]["Insert"]
export type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"]

export type IcalFeedRow = Database["public"]["Tables"]["ical_feeds"]["Row"]
export type IcalFeedInsert = Database["public"]["Tables"]["ical_feeds"]["Insert"]

export type SyncLogRow = Database["public"]["Tables"]["sync_log"]["Row"]
export type GuestUpdate = Database["public"]["Tables"]["guests"]["Update"]

export const BOOKINGS_QUERY_KEY = ["bookings"]
export const ROOMS_QUERY_KEY = ["rooms"]
export const GUESTS_QUERY_KEY = ["guests"]
export const ICAL_FEEDS_QUERY_KEY = ["ical_feeds"]
export const SYNC_LOG_QUERY_KEY = ["sync_log"]

// 1. Fetch Bookings
export function useBookings() {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          guest_id,
          room_id,
          source,
          check_in,
          check_out,
          status,
          ical_uid,
          notes,
          created_at,
          guest:guests(*),
          room:rooms(*)
        `)
        .order("check_in", { ascending: true })

      if (error) throw error
      return (data as unknown as BookingWithDetails[]) ?? []
    },
  })
}

// 2. Fetch Rooms
export function useRooms() {
  return useQuery({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      return (data as RoomRow[]) ?? []
    },
  })
}

// Rooms Mutations
export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newRoom: RoomInsert) => {
      const { data, error } = await supabase
        .from("rooms")
        .insert(newRoom)
        .select()
        .single()

      if (error) throw error
      return data as RoomRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RoomUpdate }) => {
      const { data, error } = await supabase
        .from("rooms")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as RoomRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
    },
  })
}

// 3. Fetch Guests (all or filtered)
export function useGuests(searchQuery?: string) {
  return useQuery({
    queryKey: [...GUESTS_QUERY_KEY, searchQuery || ""],
    queryFn: async () => {
      let query = supabase.from("guests").select("*").order("name", { ascending: true })

      if (searchQuery && searchQuery.trim()) {
        const term = `%${searchQuery.trim()}%`
        query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term},id_number.ilike.${term},nationality.ilike.${term}`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as GuestRow[]) ?? []
    },
  })
}

// 4. Create Guest
export function useCreateGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newGuest: GuestInsert) => {
      const { data, error } = await supabase
        .from("guests")
        .insert(newGuest)
        .select()
        .single()

      if (error) throw error
      return data as GuestRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUESTS_QUERY_KEY })
    },
  })
}

export function useUpdateGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: GuestUpdate }) => {
      const { data, error } = await supabase
        .from("guests")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as GuestRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUESTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
    },
  })
}

export function useDeleteGuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUESTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
    },
  })
}

// 5. Create Booking
export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newBooking: BookingInsert) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert(newBooking)
        .select(`
          *,
          guest:guests(*),
          room:rooms(*)
        `)
        .single()

      if (error) throw error
      return data as unknown as BookingWithDetails
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
    },
  })
}

// 6. Update Booking
export function useUpdateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BookingUpdate }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          guest:guests(*),
          room:rooms(*)
        `)
        .single()

      if (error) throw error
      return data as unknown as BookingWithDetails
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
    },
  })
}

// 7. Delete Booking
export function useDeleteBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
    },
  })
}

// 8. iCal Feeds Hooks
export function useIcalFeeds() {
  return useQuery({
    queryKey: ICAL_FEEDS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ical_feeds")
        .select(`
          *,
          room:rooms(*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data as unknown as (IcalFeedRow & { room?: RoomRow })[]) ?? []
    },
  })
}

export function useCreateIcalFeed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newFeed: IcalFeedInsert) => {
      const { data, error } = await supabase
        .from("ical_feeds")
        .insert(newFeed)
        .select()
        .single()

      if (error) throw error
      return data as IcalFeedRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ICAL_FEEDS_QUERY_KEY })
    },
  })
}

export function useDeleteIcalFeed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ical_feeds").delete().eq("id", id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ICAL_FEEDS_QUERY_KEY })
    },
  })
}

// 9. Sync Logs Hook
export function useSyncLogs() {
  return useQuery({
    queryKey: SYNC_LOG_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_log")
        .select(`
          *,
          feed:ical_feeds(id, source_name, room:rooms(name))
        `)
        .order("synced_at", { ascending: false })
        .limit(30)

      if (error) throw error
      return data ?? []
    },
  })
}

// 10. Manual Sync Trigger (invokes sync-ical edge function)
export function useTriggerSyncIcal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-ical`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Sync failed (${res.status}): ${errText}`)
      }

      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ICAL_FEEDS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SYNC_LOG_QUERY_KEY })
    },
  })
}

// Helper to seed a sample property and rooms if database is fresh
export function useCreateDefaultRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      let propertyId: string
      const { data: props, error: propErr } = await supabase
        .from("properties")
        .select("id")
        .limit(1)

      if (propErr) throw propErr

      if (props && props.length > 0) {
        propertyId = props[0].id
      } else {
        const { data: newProp, error: createPropErr } = await supabase
          .from("properties")
          .insert({ name: "Main Hotel Property" })
          .select()
          .single()

        if (createPropErr) throw createPropErr
        propertyId = newProp.id
      }

      const { data: createdRooms, error: roomErr } = await supabase
        .from("rooms")
        .insert([
          { property_id: propertyId, name: "Room 101 - Deluxe Ocean View", capacity: 2, base_rate: 150.0 },
          { property_id: propertyId, name: "Room 102 - Standard Queen", capacity: 2, base_rate: 110.0 },
          { property_id: propertyId, name: "Room 201 - Executive Suite", capacity: 4, base_rate: 240.0 },
        ])
        .select()

      if (roomErr) throw roomErr
      return createdRooms
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}
