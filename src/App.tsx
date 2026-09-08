import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import { HotelSettingsProvider } from "@/contexts/HotelSettingsContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { OnboardingGuard } from "@/components/guards/OnboardingGuard"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { OnboardingPage } from "@/pages/OnboardingPage"
import { CalendarPage } from "@/pages/CalendarPage"
import { BookingsPage } from "@/pages/BookingsPage"
import { GuestsPage } from "@/pages/GuestsPage"
import { SettingsPage } from "@/pages/SettingsPage"

function App() {
  return (
    <AuthProvider>
      <HotelSettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes (require authenticated staff/admin) */}
            <Route element={<ProtectedRoute />}>
              {/* Onboarding Route (redirects to / if already completed) */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Guarded Dashboard Routes (redirect to /onboarding if not completed) */}
              <Route element={<OnboardingGuard />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/calendar" replace />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/guests" element={<GuestsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </HotelSettingsProvider>
    </AuthProvider>
  )
}

export default App
