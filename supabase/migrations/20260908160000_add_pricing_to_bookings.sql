-- Migration: Add total_price and extra_charges to bookings table for manual price adjustments (e.g. food, beverage, extras)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total_price numeric(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS extra_charges numeric(10, 2) NOT NULL DEFAULT 0.00;

-- Optional index if filtering by price ranges in reports
CREATE INDEX IF NOT EXISTS idx_bookings_total_price ON public.bookings(total_price);
