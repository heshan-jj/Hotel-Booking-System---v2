-- Migration: Prevent overlapping room bookings (Double-booking conflict prevention)
CREATE OR REPLACE FUNCTION public.check_room_booking_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count integer;
  conflicting_room_name text;
  conflicting_check_in date;
  conflicting_check_out date;
  conflicting_guest_name text;
BEGIN
  -- Cancelled bookings do not hold room availability
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Check for any overlapping active bookings for the same room
  -- Two intervals [A_start, A_end) and [B_start, B_end) overlap iff A_start < B_end AND A_end > B_start
  SELECT 
    COUNT(*), 
    MIN(r.name),
    MIN(b.check_in),
    MIN(b.check_out),
    MIN(g.name)
  INTO 
    conflict_count, 
    conflicting_room_name,
    conflicting_check_in,
    conflicting_check_out,
    conflicting_guest_name
  FROM public.bookings b
  JOIN public.rooms r ON r.id = b.room_id
  LEFT JOIN public.guests g ON g.id = b.guest_id
  WHERE b.room_id = NEW.room_id
    AND b.status != 'cancelled'
    AND b.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND b.check_in < NEW.check_out
    AND b.check_out > NEW.check_in;

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Room booking conflict: Room "%" is already booked from % to % (Guest: %).', 
      COALESCE(conflicting_room_name, 'Selected Room'),
      conflicting_check_in,
      conflicting_check_out,
      COALESCE(conflicting_guest_name, 'Unknown')
      USING ERRCODE = '23P01'; -- exclusion_violation
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger before insert or update
DROP TRIGGER IF EXISTS trigger_check_room_booking_conflict ON public.bookings;
CREATE TRIGGER trigger_check_room_booking_conflict
  BEFORE INSERT OR UPDATE OF room_id, check_in, check_out, status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_room_booking_conflict();
