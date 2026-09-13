# Fix Prompt: Hotel PMS v2 — Design & Accessibility Remediation

Paste this whole document into Claude Code (or another coding agent) running inside
`D:\Projects\Hotel Booking System - v2`. It has full repo access — let it read each file
before editing, and have it run `npm run build` / `tsc -b` after each section to confirm
nothing broke.

**Stack context**: React 19 + TypeScript + Vite, Tailwind + shadcn/ui-style components,
Supabase backend. No `@radix-ui/react-dialog` is installed — build modal fixes with plain
React (a shared focus-trap hook), not a new dependency, unless you explicitly choose to
`npm install @radix-ui/react-dialog` and refactor onto it (optional stretch goal, see
Section 7).

Work through the sections in order — later sections depend on primitives built in earlier
ones (the focus-trap hook in Section 1, the shared ThemeColorPicker in Section 5).

---

## Section 1 — Shared focus-trap hook (do this first)

Create `src/hooks/useFocusTrap.ts`:

```ts
import { useEffect, useRef } from "react"

/**
 * Traps keyboard focus inside a modal/dialog while it's open, returns focus to the
 * previously-focused element on close, and closes on Escape.
 *
 * Usage:
 *   const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)
 *   <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1}>...</div>
 */
export function useFocusTrap<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<T | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    if (container) {
      const focusable = container.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ;(focusable || container).focus()
    }

    function getFocusable(): HTMLElement[] {
      if (!container) return []
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== "Tab") return

      const focusable = getFocusable()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  return containerRef
}
```

Apply it to **every** modal in the codebase (listed below) by:
1. Calling `const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)` at the top of
   the component.
2. Attaching `ref={dialogRef}` to the modal's outer content `<div>` (the card/sheet, not the
   backdrop).
3. Adding `role="dialog"`, `aria-modal="true"`, `tabIndex={-1}`, and
   `aria-labelledby="<id-of-the-title-element>"` (give the title element that `id`).

Modals to update this way:
- `src/components/bookings/BookingModal.tsx`
- `src/components/settings/RoomsManagementTab.tsx` (the Add/Edit Room modal)
- `src/components/settings/ChannelManagerTab.tsx` (the Add Inbound Feed modal)

---

## Section 2 — Icon-only buttons need accessible labels

Every icon-only `<button>` (no visible text, just a Lucide icon) currently relies only on
`title=`, which isn't reliably exposed to screen readers. Add `aria-label` matching the
action, everywhere this pattern appears:

- `src/pages/BookingsPage.tsx` — Edit (`Edit` icon), Delete (`Trash2`), Check In
  (`CheckCircle2`), Check Out (`LogOutIcon`) row-action buttons.
- `src/components/bookings/BookingModal.tsx` — the `X` close button in the header.
- `src/components/layout/Sidebar.tsx` — the mobile drawer close `X` button (already has one —
  verify), the sign-out button (already labeled via `title`, add `aria-label="Sign out"` too).
- `src/components/layout/AppLayout.tsx` — the mobile hamburger `Menu` button (already has
  `aria-label`, verify) and the mobile quick-logout `LogOut` icon button (add
  `aria-label="Sign out"`).
- `src/components/settings/RoomsManagementTab.tsx` — Edit (`Edit2`) and Delete (`Trash2`)
  buttons in the rooms table.
- `src/components/settings/ChannelManagerTab.tsx` — Delete (`Trash2`) button in the inbound
  feeds table.
- `src/components/bookings/GuestSelector.tsx` — the `X` "clear search" button.

Example fix:
```tsx
<Button
  variant="ghost"
  size="sm"
  title="Edit Details"
  aria-label="Edit reservation"
  onClick={() => handleEdit(booking)}
  className="h-7 w-7 p-0 ..."
>
  <Edit className="h-3.5 w-3.5" />
</Button>
```

---

## Section 3 — Touch target sizing on mobile

Icon-only action buttons are currently `h-7 w-7` / `h-8 w-8` (28–32px) at every breakpoint.
Apple HIG / WCAG mobile touch target minimum is **44×44pt**. Since this is a PWA meant for
phone use, resize these responsively — larger on mobile (default, no breakpoint prefix),
smaller on desktop (`sm:` prefix), so density on desktop isn't sacrificed:

Apply this pattern to every icon-only button flagged in Section 2:
```tsx
className="h-11 w-11 sm:h-8 sm:w-8 p-0 ..."
```

Also increase the gap between adjacent action buttons on mobile (currently `gap-1`) to at
least `gap-2` so accidental mis-taps are less likely — do this on the `BookingsPage` and
`RoomsManagementTab` action-button wrapper `<div>`s.

---

## Section 4 — Replace `window.confirm()` / `alert()` with in-app UI

Native browser dialogs can't be themed or respect dark mode, and read inconsistently across
platforms. `BookingModal.tsx` already has a good pattern for this — an inline
"Delete → Confirm Delete / Cancel" button toggle (see its `isConfirmingDelete` state). Reuse
that exact pattern in:

- `src/pages/BookingsPage.tsx` → `handleDelete` (currently `confirm(...)`) and
  `handleStatusChange`'s catch block (currently `alert(...)`, replace with an inline error
  banner state like the one already used in `BookingModal`).
- `src/components/settings/RoomsManagementTab.tsx` → `handleDelete` (currently
  `confirm(...)` + `alert(...)` on failure).
- `src/components/settings/ChannelManagerTab.tsx` → `handleDeleteFeed` (currently
  `confirm(...)`).

For each, add a per-row `confirmingId` (or similar) piece of state so only the row being
deleted shows its inline confirm state, and add an `errorMessage`/toast-style banner for
failures instead of `alert()`.

---

## Section 5 — Deduplicate the theme color picker

`src/pages/OnboardingPage.tsx` and `src/components/settings/HotelProfileTab.tsx` each define
an identical `COLOR_PRESETS` array and near-duplicate preset-grid + custom-hex-input + live-
preview markup. They've already drifted (Onboarding's version has dark-theme classes baked
in; HotelProfileTab's is light-only).

Extract a single shared component:

`src/components/shared/ThemeColorPicker.tsx`
```tsx
interface ThemeColorPickerProps {
  value: string
  onChange: (hex: string) => void
  hotelName?: string
  /** Set true when rendering inside a dark, non-token-driven shell (e.g. Onboarding). */
  forceDark?: boolean
}
```
- Move `COLOR_PRESETS` here as the single source of truth.
- Render the presets grid, the native `<input type="color">` + hex text `Input`, the "Live
  Theme Preview" card, exactly as currently built — but parameterize the light/dark classes
  using the app's semantic tokens (`bg-card`, `text-foreground`, `border-border`, etc.) so it
  adapts automatically wherever it's dropped, rather than needing a `forceDark` prop long
  term. (Use `forceDark` only if `Onboarding`'s standalone dark shell — see Section 6 — isn't
  hooked into the token system yet.)

Update `OnboardingPage.tsx` step 2 and `HotelProfileTab.tsx`'s "Theme & Primary Color" card
to both render `<ThemeColorPicker value={themeColor} onChange={setThemeColor} hotelName={...} />`
instead of their own inline copies. Delete the now-duplicate local `COLOR_PRESETS` arrays and
markup from both files.

---

## Section 6 — Dark mode is completely missing from Settings tabs

`src/components/settings/ChannelManagerTab.tsx`, `HotelProfileTab.tsx`, and
`RoomsManagementTab.tsx` use **zero** `dark:` Tailwind classes — every other page in the app
(`Sidebar`, `BookingsPage`, `CalendarPage`, `BookingModal`) has them throughout. Right now,
toggling dark mode anywhere else works; opening Settings in dark mode shows white cards on a
dark shell.

Go through all three files and mirror the `dark:` variant pattern already used in
`BookingsPage.tsx` / `card.tsx` / `table.tsx`, specifically:

- `bg-white` → add `dark:bg-zinc-900/90` (match `Card`'s own background)
- `text-slate-900` → add `dark:text-zinc-100`
- `text-slate-700` / `text-slate-800` → add `dark:text-zinc-300` / `dark:text-zinc-200`
- `text-slate-500` / `text-slate-400` → add `dark:text-zinc-400` / `dark:text-zinc-500`
- `border-slate-200` / `border-slate-100` → add `dark:border-white/[0.08]`
- `bg-slate-50` (backgrounds, table headers, empty states) → add `dark:bg-zinc-800/60`
- Native `<select>` elements (currency picker in `HotelProfileTab`, room picker in
  `ChannelManagerTab`'s add-feed modal) → add `dark:bg-zinc-800/60 dark:text-zinc-100
  dark:border-white/[0.1]`
- The two hand-rolled modals' backdrops/cards in `RoomsManagementTab` and `ChannelManagerTab`
  (`bg-white`, `border-slate-200`) → same dark treatment as `BookingModal`'s card
  (`dark:bg-zinc-900 dark:border-white/[0.1]`)

After this pass, toggle dark mode and manually click through all three Settings tabs to
confirm nothing is left with a hardcoded light background.

---

## Section 7 (optional stretch) — Consolidate modal implementations

There are currently four separate hand-rolled modal overlays: `BookingModal.tsx`,
`RoomsManagementTab`'s inline modal, `ChannelManagerTab`'s inline modal, and the mobile
drawer in `AppLayout.tsx`/`Sidebar.tsx` (a different pattern, can stay separate). The first
three duplicate the same backdrop + card + header + close-button structure.

If time allows: extract `src/components/ui/dialog.tsx` — a `Dialog` wrapper that takes
`isOpen`, `onClose`, `title`, and `children`, internally uses the `useFocusTrap` hook from
Section 1, and renders the backdrop/card/header/close-button chrome once. Refactor
`BookingModal`, `RoomsManagementTab`, and `ChannelManagerTab` to use it instead of
hand-rolling the overlay each time. This is not required for correctness (Sections 1–6 already
fix the accessibility gaps) — it's a maintenance win to prevent the three from drifting again.

---

## Section 8 — Login & Onboarding: use the shared component system

`src/pages/LoginPage.tsx` and `src/pages/OnboardingPage.tsx` use raw `<input>`/`<label>`
elements with hardcoded `slate-800`/`blue-600` colors instead of the shared `Input`, `Label`,
`Button` components used everywhere else, and never reference the app's semantic CSS
variables (`--primary`, `--background`, etc. in `src/index.css`).

Keep the intentional dark "branded splash" gradient background for these two screens (that's
a reasonable design choice for an auth/first-run flow) — the fix is about component reuse and
tokens, not necessarily forcing them into light mode:

1. Replace every raw `<input type="...">` in both files with the shared `<Input>` component,
   passing a `className` override only for the dark-shell-specific colors that don't come
   from tokens yet (e.g. `className="border-slate-700 bg-slate-800/80 text-white
   placeholder:text-slate-500"` — this is already close to what's there, just route it
   through the shared component instead of a bare `<input>`).
2. Replace raw `<label>` elements with the shared `<Label>` component.
3. Replace the raw `<select>` in `OnboardingPage` step 1 (currency picker) with the app's
   `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` components (see
   `src/components/ui/select.tsx`), styled to match the dark shell the same way it's styled
   elsewhere in light mode.
4. Give the logo file `<input type="file">` in both `OnboardingPage` and `HotelProfileTab` an
   `aria-label="Upload hotel logo"` — it's currently `sr-only` and visually triggered by a
   wrapping `<label>`, but double-check the wrapping `<label>`'s clickable text ("Browse File")
   is itself sufficient for a screen reader (it should read fine as-is since it's a real
   `<label for=...>`/wrapped-input pattern — just confirm during QA).

---

## Section 9 — Contrast checks on OTA source colors

`src/pages/CalendarPage.tsx`'s `eventPropGetter` hardcodes `color: "#ffffff"` as the text
color against each booking source's `meta.hex` background (from `BOOKING_SOURCES` in
`src/constants/booking.ts`). White text on a light/pastel brand color can fall under the
4.5:1 contrast minimum.

1. Open `src/constants/booking.ts` and list every `hex` value defined in `BOOKING_SOURCES`.
2. For each, compute contrast against both `#ffffff` and a dark fallback (e.g. `#1e293b` /
   `slate-800`).
3. In `CalendarPage.tsx`'s `eventPropGetter`, replace the hardcoded `color: "#ffffff"` with a
   small `getReadableTextColor(hex: string): string` helper (relative-luminance based) that
   picks white or dark text per event, and apply the same helper to the source-filter pills
   later in the same file (currently also hardcoding `color: isSelected ? "#ffffff" : meta.hex`).

---

## Section 10 — GuestSelector: proper combobox semantics

`src/components/bookings/GuestSelector.tsx`'s autocomplete search dropdown is currently plain
divs/buttons with click-only interaction — no ARIA combobox semantics, no keyboard
navigation.

1. Add `role="combobox"`, `aria-expanded={isOpen}`, `aria-controls="guest-results-listbox"`,
   `aria-autocomplete="list"` to the search `<input>`.
2. Add `id="guest-results-listbox"` and `role="listbox"` to the results popover container.
3. Add `role="option"` and `aria-selected={isSelected}` to each guest result button and to
   the "+ Create new guest" button.
4. Add arrow-key (Up/Down) navigation between options and Enter-to-select, with a
   `highlightedIndex` piece of state driving a visual highlight style (reuse the existing
   `isSelected` highlight classes for the highlighted-but-not-yet-selected state, or add a
   distinct `bg-black/[0.03]` highlight).
5. Add `aria-label="Clear search"` to the `X` clear-search button (also covered in Section 2).

---

## QA checklist after all sections

- [ ] `npm run build` passes with no TypeScript errors
- [ ] Tab through the Bookings page, Booking modal, Settings → Rooms modal, and Settings →
      Channel Manager modal using only the keyboard — focus never escapes an open modal, and
      Escape closes it
- [ ] Toggle OS/app dark mode and click through every page including all three Settings tabs
      — no hardcoded white cards remain
- [ ] Resize to a mobile viewport (375px) — every icon-only button is comfortably tappable
      and has enough spacing from its neighbors
- [ ] Run a screen reader (VoiceOver/NVDA) over the Bookings table row actions and the Guest
      Selector autocomplete — every control announces a clear name and role
- [ ] Onboarding's theme-color step and Settings → Hotel Profile's theme-color card render
      identically (same component now) in both light and dark shells
