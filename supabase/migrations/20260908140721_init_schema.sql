-- Custom enum for booking source
CREATE TYPE public.booking_source AS ENUM (
  'direct',
  'phone',
  'onsite',
  'booking_com',
  'airbnb'
);

-- 1. Properties
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Rooms
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 1 CHECK (capacity > 0),
  base_rate numeric(10, 2) NOT NULL CHECK (base_rate >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Guests
CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  id_number text,
  nationality text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  source public.booking_source NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  ical_uid text UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_booking_dates CHECK (check_out > check_in)
);

-- 5. iCal Feeds
CREATE TABLE public.ical_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  feed_url text NOT NULL,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Sync Log
CREATE TABLE public.sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES public.ical_feeds(id) ON DELETE CASCADE,
  synced_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL,
  error text
);

-- Foreign key & search indexes for performance
CREATE INDEX idx_rooms_property_id ON public.rooms(property_id);
CREATE INDEX idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX idx_ical_feeds_room_id ON public.ical_feeds(room_id);
CREATE INDEX idx_sync_log_feed_id ON public.sync_log(feed_id);
CREATE INDEX idx_sync_log_synced_at ON public.sync_log(synced_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ical_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is staff or admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.role() = 'authenticated'
    AND (
      CASE 
        WHEN auth.jwt() -> 'app_metadata' ->> 'role' IS NOT NULL 
          THEN (auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin')
        WHEN auth.jwt() -> 'user_metadata' ->> 'role' IS NOT NULL 
          THEN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('staff', 'admin')
        ELSE true
      END
    );
$$;

-- RLS Policies: Authenticated staff/admin can read and write everything.
-- No public/anon access policies are created (access denied by default).

-- Properties
CREATE POLICY "Staff/admin full access on properties"
  ON public.properties
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- Rooms
CREATE POLICY "Staff/admin full access on rooms"
  ON public.rooms
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- Guests
CREATE POLICY "Staff/admin full access on guests"
  ON public.guests
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- Bookings
CREATE POLICY "Staff/admin full access on bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- iCal Feeds
CREATE POLICY "Staff/admin full access on ical_feeds"
  ON public.ical_feeds
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- Sync Log
CREATE POLICY "Staff/admin full access on sync_log"
  ON public.sync_log
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
