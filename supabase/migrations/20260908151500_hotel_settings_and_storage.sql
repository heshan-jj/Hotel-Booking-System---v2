-- 1. Create hotel_settings table (strictly single-row configuration)
CREATE TABLE public.hotel_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'My Hotel',
  logo_url text,
  theme_primary_color text NOT NULL DEFAULT '#0f172a',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_hotel_settings_updated_at
  BEFORE UPDATE ON public.hotel_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Seed initial single-row config
INSERT INTO public.hotel_settings (id, name, theme_primary_color, onboarding_completed)
VALUES (1, 'My Hotel', '#0f172a', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS on hotel_settings
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff/admin full access on hotel_settings"
  ON public.hotel_settings
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- 5. Create "hotel-assets" storage bucket for logo uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-assets', 'hotel-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Storage RLS Policies for hotel-assets
-- Allow authenticated staff/admin to upload objects
CREATE POLICY "Staff/admin can upload hotel-assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hotel-assets' AND public.is_staff_or_admin()
  );

-- Allow authenticated staff/admin to update objects
CREATE POLICY "Staff/admin can update hotel-assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'hotel-assets' AND public.is_staff_or_admin()
  )
  WITH CHECK (
    bucket_id = 'hotel-assets' AND public.is_staff_or_admin()
  );

-- Allow authenticated staff/admin to delete objects
CREATE POLICY "Staff/admin can delete hotel-assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hotel-assets' AND public.is_staff_or_admin()
  );

-- Allow authenticated staff/admin to read/select objects
CREATE POLICY "Staff/admin can select hotel-assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'hotel-assets' AND public.is_staff_or_admin()
  );

-- Also allow public select so public URLs can render the logo in browser
CREATE POLICY "Public can view hotel-assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'hotel-assets'
  );
