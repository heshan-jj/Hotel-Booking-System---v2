-- Migration: Add currency column to hotel_settings
ALTER TABLE public.hotel_settings
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
