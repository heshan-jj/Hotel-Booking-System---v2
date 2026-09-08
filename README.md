# 🏨 Hotel PMS — Property Management & Booking System

A modern, high-performance, and mobile-responsive **Hotel Property Management System (PMS)** engineered for boutique hotels, resorts, bed & breakfasts, and serviced apartments.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Auth, Edge Functions, Storage)**, featuring an authentic **Apple / iOS Human Interface** design language and **PWA (Progressive Web App)** support for iPhone, iPad, Android, and Desktop.

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| 📅 **Interactive Calendar** | Real-time multi-room timeline (Month, Week, Day, Agenda) powered by `react-big-calendar` with one-tap slot reservation and live conflict detection. |
| 🔄 **2-Way OTA iCal Sync** | Automated two-way calendar synchronization with **Airbnb**, **Booking.com**, **Agoda**, **VRBO**, and **Expedia** via Supabase Edge Functions. |
| 🛡️ **Conflict Prevention** | Database-level PostgreSQL triggers that guarantee zero double-bookings across concurrent channels and walk-ins. |
| 💰 **Revenue & Financials** | Real-time metrics for Gross Revenue, Average Daily Rate (ADR), occupied nights, channel yield distribution, and room revenue ranking. |
| 👥 **Guest Directory** | Centralized guest profiles with search-as-you-type autocomplete, reservation histories, direct phone/email contact, and notes. |
| ⚙️ **Property Customization** | Dynamic property branding, address, check-in/out policies, multi-currency support (`$`, `€`, `£`, `Rs.`, etc.), and logo upload. |
| 📱 **Native iOS PWA Experience**| Installable offline-capable web application with safe-area insets, iOS bottom tab bar, hamburger drawer, and native bottom sheet modals. |
| 🔐 **Enterprise Auth & Security**| Supabase Auth with Row Level Security (RLS) policies protecting database records across staff accounts. |

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), Tailwind Animate, Lucide Icons, Apple HIG design tokens
- **State & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, Storage, Edge Functions)
- **Calendar Engine**: [react-big-calendar](https://github.com/jquense/react-big-calendar) with `date-fns` localizer
- **PWA**: Native Service Worker (`sw.js`) with cache-first and network-first strategies, Web App Manifest

---

## 📋 Prerequisites

Before setting up the project, ensure you have:

1. **Node.js**: `v18.0.0` or higher (Node.js 20+ LTS recommended).
2. **Package Manager**: [pnpm](https://pnpm.io/) (recommended), `npm`, or `yarn`.
3. **Supabase Account**: A free or paid account on [supabase.com](https://supabase.com/) (or a local Supabase CLI instance).

---

## 🚀 Quick Start & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hotel-booking-system.git
cd hotel-booking-system
```

### 2. Install Dependencies

```bash
pnpm install
# or: npm install
```

### 3. Setup Supabase Project

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and create a **New Project**.
2. Note your **Project URL** and **Anon / Public API Key** from **Project Settings > API**.

### 4. Apply Database Migrations

Apply the database schema and security policies. You can apply them using the Supabase CLI or directly in the Supabase SQL Editor.

#### Option A: Using Supabase CLI (Recommended)
```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Push all migrations in order
npx supabase db push
```

#### Option B: Via Supabase SQL Editor
Execute the files inside `supabase/migrations/` sequentially in the Supabase SQL Editor:
1. `20260908140721_init_schema.sql` — Base tables (`rooms`, `guests`, `bookings`, `audit_logs`) and RLS policies.
2. `20260908150500_cron_sync_ical.sql` — Cron schedule setup for recurring OTA calendar sync.
3. `20260908151500_hotel_settings_and_storage.sql` — `hotel_settings` table and logo storage bucket.
4. `20260908160000_add_pricing_to_bookings.sql` — Nightly rate calculation, pricing breakdown, and extras columns.
5. `20260908163000_add_currency_to_hotel_settings.sql` — Multi-currency symbol and code support.
6. `20260908170000_prevent_room_booking_conflicts.sql` — Concurrency-safe overlap prevention database trigger.

### 5. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 6. Create Your First Staff / Admin Account

1. In the Supabase Dashboard, navigate to **Authentication > Users**.
2. Click **Add User > Create User**.
3. Enter your administrator email (e.g., `admin@yourhotel.com`) and a secure password.
4. Auto-confirm the user email so you can sign in immediately.

### 7. Launch Development Server

```bash
pnpm run dev
```

Open your browser at `http://localhost:5173`. You will be greeted by the Apple-styled login screen!

---

## 🛎️ Initial Hotel Onboarding

When logging in for the first time:

1. **Property Setup Wizard** (`/onboarding`):
   - Enter your **Hotel / Property Name** (e.g., *The Grand Azure Hotel*).
   - Provide your **Address, Contact Phone, and Support Email**.
   - Select your **Operating Currency** (`USD ($)`, `EUR (€)`, `GBP (£)`, `AUD ($)`, `CAD ($)`, `LKR (Rs.)`, `INR (₹)`, `JPY (¥)`, etc.).
   - Configure check-in time (e.g., `14:00`) and check-out time (e.g., `11:00`).
   - (Optional) Upload your property's logo.

2. **Add Rooms & Base Rates**:
   - Navigate to **Settings > Room Configuration** or seed initial rooms.
   - Enter room titles (e.g., *Deluxe Ocean Suite 101*), room types, capacities, and default nightly base rates.

---

## 🔄 OTA Calendar Synchronization (iCal)

The system supports automatic, two-way calendar synchronization with major online travel agencies (OTAs) including **Airbnb**, **Booking.com**, **Agoda**, and **Expedia**.

### 1. Exporting Your Hotel's Calendar to OTAs
Each room publishes an independent, live iCal feed:

```text
https://<your-supabase-project-ref>.supabase.co/functions/v1/room-ical?room_id=<ROOM_UUID>
```

Paste this URL into your OTA calendar export settings (e.g., *Airbnb > Pricing & Availability > Calendar Sync > Import Calendar*).

### 2. Importing OTA Calendars into Your Hotel PMS
1. In Airbnb or Booking.com, copy the room's **iCal Export URL**.
2. In the Hotel PMS, go to **Settings > Rooms** and paste the URL into the **iCal Feed URL** field for that room.
3. The background synchronization function will periodically pull external bookings and prevent double bookings automatically.

### 3. Deploying Supabase Edge Functions
To deploy the synchronization functions:

```bash
# Deploy room iCal export endpoint
npx supabase functions deploy room-ical --no-verify-jwt

# Deploy periodic sync worker
npx supabase functions deploy sync-ical
```

---

## 📱 Mobile & PWA Installation Guide

This system is built with native **Progressive Web App (PWA)** capabilities and responsive Apple Human Interface design.

### Installing on iPhone / iPad (iOS)
1. Open the application in **Safari** on your iOS device.
2. Tap the **Share** button (the square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. The PMS will now launch in standalone fullscreen mode like a native iOS app.

### Installing on Android
1. Open the application in **Google Chrome**.
2. Tap the three-dot menu icon in the top right.
3. Tap **Install App** or **Add to Home Screen**.

### Installing on macOS / Windows / Linux (Desktop)
1. Open the application in Chrome, Edge, or Brave.
2. Click the **Install** icon on the right side of the address bar.

---

## 🧭 Application Structure

```text
hotel-booking-system/
├── public/
│   ├── manifest.webmanifest   # PWA manifest (standalone mode, icons, shortcuts)
│   ├── sw.js                  # Service worker (caching & offline fallbacks)
│   └── pms-icon-*.png         # Multi-resolution app icons
├── src/
│   ├── components/
│   │   ├── bookings/          # BookingModal, GuestSelector, RoomSelector
│   │   ├── guards/            # OnboardingGuard (route protections)
│   │   ├── layout/            # AppLayout, Sidebar, MobileTabBar
│   │   └── ui/                # iOS Primitives (buttons, inputs, cards, tabs, badges)
│   ├── contexts/              # AuthContext, HotelSettingsContext
│   ├── hooks/                 # React Query hooks (useBookings, useRooms, useGuests)
│   ├── pages/
│   │   ├── BookingsPage.tsx   # Reservation directory with search & filters
│   │   ├── CalendarPage.tsx   # Interactive occupancy calendar
│   │   ├── RevenuePage.tsx    # Financial reporting & ADR performance
│   │   ├── GuestsPage.tsx     # Guest directory & history
│   │   ├── SettingsPage.tsx   # Property settings & room setup
│   │   ├── LoginPage.tsx      # Secure staff login
│   │   └── OnboardingPage.tsx # Property initialization wizard
│   ├── styles/
│   │   └── calendar.css       # Custom Apple calendar stylesheet
│   ├── index.css              # Global design tokens & styling variables
│   └── main.tsx               # App entrypoint & Service Worker registration
├── supabase/
│   ├── functions/             # Deno Edge Functions (room-ical, sync-ical)
│   └── migrations/            # SQL migration files & RLS policies
└── tailwind.config.js         # Custom shadows, squircles, and layout tokens
```

---

## 🛡️ Database Overlap Trigger (Zero Double-Bookings)

To protect hotels from catastrophic simultaneous bookings, a PostgreSQL trigger verifies date intervals at database write time:

```sql
-- Prevents booking overlapping date ranges for the same room
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = NEW.room_id
      AND status != 'cancelled'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND daterange(check_in, check_out, '[)') && daterange(NEW.check_in, NEW.check_out, '[)')
  ) THEN
    RAISE EXCEPTION 'Room is already booked for the selected dates';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚢 Production Deployment

### Building the Frontend

```bash
pnpm run build
```
The compiled, production-ready assets will be located in `dist/`.

### Recommended Hosting Options

1. **Vercel**:
   - Connect your GitHub repository.
   - Framework preset: `Vite`.
   - Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Deploy.

2. **Netlify**:
   - Connect repository, set build command to `pnpm run build` and publish directory to `dist`.
   - Configure rewrite rule in `public/_redirects`:
     ```text
     /*    /index.html   200
     ```

3. **Cloudflare Pages**:
   - Connect repository, choose `Vite` preset, provide Supabase environment variables, and deploy.

---

## ❓ Troubleshooting & FAQs

### 1. "Room is already booked for the selected dates"
- **Cause**: An active reservation (status not `cancelled`) already occupies that room during the chosen dates.
- **Resolution**: Adjust the check-in/out dates or change the booking status of the conflicting reservation to `cancelled`.

### 2. Can I use different currencies?
- **Yes**: Open **Settings** and update the **Currency** field (e.g. `USD`, `EUR`, `GBP`, `LKR`). The entire app (revenue metrics, rates, invoices, booking modal) immediately updates formatting across all pages.

### 3. PWA is not prompting for installation on iOS Safari
- Apple iOS does not show automatic install banners. Instruct your staff to tap **Share (⬆️) > Add to Home Screen**.

---

## 📄 License

This project is licensed under the MIT License — feel free to use and adapt it for your hotel or commercial hospitality properties.
